"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatEngine, detectWebGPU, type ChatMessage } from "./engine";
import { hasConsented, recordConsent } from "./consent";
import { buildPromptMessages, primeRetrieval, REFUSAL_MESSAGE, retrieve } from "./retrieval";
import { TranscriptStore, type Turn } from "./transcript-store";
import type { AmplitudeSource, VoiceOrbState } from "@/components/labs/VoiceOrb";

/**
 * useChatController — the whole feature's state machine.
 *
 * Phases:
 *   dormant   → user hasn't clicked Start. No downloads.
 *   loading   → weights + retrieval assets streaming in.
 *   ready     → idle, waiting for input.
 *   sending   → user turn accepted, retrieval running.
 *   streaming → LLM tokens flowing.
 *   error     → recoverable via clearError; unrecoverable via close-and-reopen.
 *
 * Voice pipeline is lazy — nothing loads until enableVoice() is called.
 *
 * All handlers are stable via useCallback; the returned object is memoized so
 * consumers can pass individual props without re-renders on unrelated state.
 */

export type ChatPhase = "dormant" | "loading" | "ready" | "sending" | "streaming" | "error";
export type ChatMode = "text" | "voice";
export type UiMode = "compact" | "expanded";

export type { Turn } from "./transcript-store";

interface ControllerState {
  phase: ChatPhase;
  mode: ChatMode;
  uiMode: UiMode;
  progress: number;
  progressCaption: string;
  webgpuAvailable: boolean | null;
  voiceState: VoiceOrbState;
  voiceEnabled: boolean;
  voiceLoading: boolean;
  error: string | null;
}

export interface ChatController extends ControllerState {
  open: (initialMode?: UiMode) => void;
  close: () => void;
  start: () => Promise<void>;
  send: (text: string) => Promise<void>;
  toggleMode: () => void;
  enableVoice: () => Promise<void>;
  disableVoice: () => void;
  clearError: () => void;
  isOpen: boolean;
  /** Per-frame amplitude stream for the VoiceOrb. Bypasses React state so the
   *  60fps updates don't churn the reconciler. */
  amplitudeSource: AmplitudeSource;
  /** Transcript store — subscribe with useSyncExternalStore. Kept outside
   *  React state so per-token streaming doesn't re-render unrelated UI. */
  transcript: TranscriptStore;
}

const INITIAL: ControllerState = {
  phase: "dormant",
  mode: "text",
  uiMode: "compact",
  progress: 0,
  progressCaption: "",
  webgpuAvailable: null,
  voiceState: "idle",
  voiceEnabled: false,
  voiceLoading: false,
  error: null,
};

export function useChatController(): ChatController {
  const [state, setState] = useState<ControllerState>(INITIAL);
  const [isOpen, setIsOpen] = useState(false);
  const engineRef = useRef<ChatEngine | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Transcript lives outside React state so per-token streaming doesn't
  // reconcile the whole tree — only components subscribed to the store
  // (via useSyncExternalStore) update.
  const transcriptRef = useRef<TranscriptStore | null>(null);
  if (transcriptRef.current === null) transcriptRef.current = new TranscriptStore();
  const transcript = transcriptRef.current;
  // Voice pipeline lives outside React state — heavy objects, per-frame data.
  const voiceRef = useRef<{
    vad?: import("../voice/vad").VoiceActivityDetector;
    meter?: import("../voice/audio-analyser").AmplitudeMeter;
    stream?: MediaStream;
  }>({});
  // Stable AmplitudeSource that fans out subscriptions to whichever meter is
  // currently attached (mic during listening, TTS during speaking). Callers
  // subscribe once; we route amp events to them without React state churn.
  const ampListenersRef = useRef<Set<(amp: number) => void>>(new Set());
  const amplitudeSource = useMemo<AmplitudeSource>(
    () => ({
      subscribe: (cb) => {
        ampListenersRef.current.add(cb);
        return () => {
          ampListenersRef.current.delete(cb);
        };
      },
    }),
    [],
  );

  useEffect(() => {
    detectWebGPU().then((ok) => setState((s) => ({ ...s, webgpuAvailable: ok })));
    return () => {
      // Tear down everything on unmount. Otherwise a route change or React
      // strict-mode re-mount leaves the engine holding the GPU adapter and
      // the mic stream open — subsequent mounts either hang or fail to
      // acquire the mic.
      abortRef.current?.abort();
      const v = voiceRef.current as {
        vad?: import("../voice/vad").VoiceActivityDetector;
        meter?: import("../voice/audio-analyser").AmplitudeMeter;
        stream?: MediaStream;
        unsub?: () => void;
      };
      v.unsub?.();
      v.vad?.destroy();
      v.meter?.detach();
      v.stream?.getTracks().forEach((t) => t.stop());
      voiceRef.current = {};
      // Best-effort engine unload; don't await from an effect cleanup.
      engineRef.current?.unload().catch(() => {});
      engineRef.current = null;
    };
  }, []);

  const merge = (patch: Partial<ControllerState>) => setState((s) => ({ ...s, ...patch }));

  const open = useCallback((initialMode: UiMode = "compact") => {
    setIsOpen(true);
    setState((s) => ({ ...s, uiMode: initialMode }));
    // Returning users who have already consented skip straight to loading
    // the engine. The engine and retrieval assets are browser-cached, so
    // subsequent loads land in `ready` in a few seconds; a fresh browser
    // will re-download and the progress bar will handle that path.
    if (hasConsented()) {
      // Defer to next tick so the panel mounts before phase flips to loading.
      queueMicrotask(() => {
        void startInternalRef.current?.();
      });
    }
  }, []);

  const close = useCallback(() => {
    abortRef.current?.abort();
    setIsOpen(false);
    // Keep engine loaded in memory so reopening is instant. Transcript is
    // preserved across open/close within one page load; new page load resets it.
  }, []);

  const toggleMode = useCallback(() => {
    setState((s) => ({ ...s, uiMode: s.uiMode === "compact" ? "expanded" : "compact" }));
  }, []);

  const clearError = useCallback(() => merge({ error: null, phase: engineRef.current?.isReady() ? "ready" : "dormant" }), []);

  const start = useCallback(async () => {
    if (state.phase !== "dormant" && state.phase !== "error") return;
    if (state.webgpuAvailable === false) {
      merge({ error: "This browser doesn't support WebGPU, which the local model needs." });
      return;
    }
    // Record consent on first successful click. Even if init later fails,
    // the user has explicitly agreed to run this feature; we don't want to
    // re-prompt on the next visit.
    recordConsent();
    merge({ phase: "loading", progress: 0, progressCaption: "Warming up…", error: null });
    try {
      const engine = engineRef.current ?? new ChatEngine();
      engineRef.current = engine;
      // Fire retrieval + voice-model priming in parallel with LLM download.
      // All are cached by the browser after first success. STT + TTS priming
      // is best-effort — if either fails, the real usage path surfaces the
      // error when the user actually speaks or toggles voice.
      const primingRetrieval = primeRetrieval();
      const primingTts = import("../voice/tts").then((m) => m.primeTts());
      const primingStt = import("../voice/stt").then((m) => m.primeStt());
      await engine.init({
        onProgress: ({ text, progress }) =>
          merge({ progress, progressCaption: text || "Downloading model…" }),
      });
      await primingRetrieval;
      // Don't block ready-state on voice priming — both can finish in the
      // background. Voice-mode toggle will await them if not yet done.
      void primingTts;
      void primingStt;
      merge({ phase: "ready", progress: 1, progressCaption: "" });
    } catch (err) {
      merge({ phase: "error", error: err instanceof Error ? err.message : "Failed to load model." });
    }
  }, [state.phase, state.webgpuAvailable]);
  // Keep a mutable ref to `start` so `open()` can invoke it without
  // depending on it (which would force `open` to change identity every
  // render — bad for downstream consumers that memoise on it).
  const startInternalRef = useRef<typeof start | null>(null);
  startInternalRef.current = start;

  /**
   * Runs the retrieval → LLM pipeline for one user turn.
   *
   * Returns:
   *   - `text`: the final assistant text (empty string if refused early)
   *   - `refused`: true when scope check short-circuited to the refusal
   *   - `null` if aborted or errored
   *
   * The optional `onDelta` fires on every LLM token — voice mode hooks it
   * to push tokens straight into streaming TTS, so audio can start before
   * the LLM finishes.
   */
  const runQuery = useCallback(
    async (
      text: string,
      opts: { onDelta?: (delta: string) => void } = {},
    ): Promise<{ text: string; refused: boolean } | null> => {
      const engine = engineRef.current;
      if (!engine || !engine.isReady()) return null;
      const controller = new AbortController();
      abortRef.current = controller;

      merge({ phase: "sending" });
      transcript.append("user", text);

      // Retrieval + scope check.
      let result;
      try {
        result = await retrieve(text);
      } catch (err) {
        merge({
          phase: "error",
          error: err instanceof Error ? err.message : "Retrieval failed.",
        });
        return null;
      }
      if (!result.inScope) {
        transcript.append("assistant", REFUSAL_MESSAGE);
        merge({ phase: "ready" });
        return { text: REFUSAL_MESSAGE, refused: true };
      }

      const messages: ChatMessage[] = buildPromptMessages(text, result.hits);

      // Append empty assistant turn; stream mutates its content via buffered
      // rAF-throttled deltas so 30 tok/s doesn't drive 30 renders/s.
      const assistantId = transcript.append("assistant", "");
      merge({ phase: "streaming" });

      try {
        const full = await engine.stream(messages, {
          signal: controller.signal,
          onToken: (delta) => {
            transcript.appendToTurnBuffered(assistantId, delta);
            opts.onDelta?.(delta);
          },
        });
        // Ensure any buffered final tokens are visible before we flip phase.
        transcript.flushPending();
        merge({ phase: "ready" });
        return { text: full, refused: false };
      } catch (err) {
        transcript.flushPending();
        if ((err as { name?: string }).name === "AbortError") {
          merge({ phase: "ready" });
          return null;
        }
        merge({
          phase: "error",
          error: err instanceof Error ? err.message : "Generation failed.",
        });
        return null;
      }
    },
    [transcript],
  );

  const send = useCallback(
    async (text: string) => {
      if (state.phase === "streaming" || state.phase === "sending") return;
      await runQuery(text);
    },
    [state.phase, runQuery],
  );

  const enableVoice = useCallback(async () => {
    if (state.voiceEnabled || state.voiceLoading) return;
    merge({ voiceLoading: true, mode: "voice", uiMode: "compact", voiceState: "idle" });
    try {
      const { VoiceActivityDetector } = await import("../voice/vad");
      const { AmplitudeMeter, sharedAudioContext } = await import("../voice/audio-analyser");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const meter = new AmplitudeMeter();
      await meter.attachStream(stream);
      // Fan amplitude out to any orb listeners without going through React
      // state. This is the fix for the 60Hz reconcile that made the page
      // unresponsive during voice mode.
      const unsub = meter.subscribe((amp) => {
        for (const cb of ampListenersRef.current) cb(amp);
      });
      meter.start();

      const vad = new VoiceActivityDetector();
      // `handling` is a single-slot mutex: while we're processing a turn,
      // ignore any further speech events. Combined with pausing the VAD as
      // soon as onSpeechEnd fires, this eliminates the failure mode where
      // ambient noise during LLM streaming produces new "listening"
      // transitions and never re-emits onSpeechEnd.
      let handling = false;
      await vad.start({
        onSpeechStart: () => {
          if (handling) return;
          merge({ voiceState: "listening" });
        },
        onSpeechEnd: async (audio) => {
          if (handling) return;
          handling = true;
          // Pause the VAD *immediately* — before STT, LLM, TTS. Otherwise
          // background noise during the ~5–10s pipeline can retrigger
          // onSpeechStart, corrupt the orb state, and leave the mutex
          // dangling.
          vad.pause();
          try {
            // Per-turn latency instrumentation. The `[t+Nms]` prefix on each
            // stage tells us where the wall-clock is going: STT, LLM's
            // first token, LLM total, TTS-first-chunk, first-audio-play.
            // Strip in production.
            const t0 = performance.now();
            const t = (label: string) =>
              console.debug(`[voice] +${Math.round(performance.now() - t0)}ms ${label}`);
            merge({ voiceState: "thinking" });
            t("thinking");
            const { transcribe } = await import("../voice/stt");
            t("stt module loaded");
            const text = await transcribe(audio);
            t(`stt done: "${text.slice(0, 40)}..."`);
            if (!text) return;

            // Streaming voice pipeline. Three concurrent things:
            //   1. LLM streams tokens (via runQuery's onDelta).
            //   2. Kokoro consumes those tokens and emits per-sentence audio.
            //   3. AmplitudeMeter plays the audio chunks back-to-back.
            //
            // We open (2) and (3) up front. When the first Kokoro chunk
            // arrives we start enqueueing; when the LLM finishes we close
            // the TTS text stream; then we wait for playback to drain.
            let tts: Awaited<ReturnType<typeof import("../voice/tts").openStreamingSynthesiser>> | null = null;
            let playback: Awaited<ReturnType<typeof meter.openPlaybackStream>> | null = null;
            let ttsFailed = false;
            let consumerDone: Promise<void> = Promise.resolve();
            let audioChunkCount = 0;

            try {
              const { openStreamingSynthesiser } = await import("../voice/tts");
              t("tts module loaded");
              const ctx = await sharedAudioContext();
              tts = await openStreamingSynthesiser();
              t("tts opened");
              playback = await meter.openPlaybackStream({
                onFirstPlay: () => {
                  t("first audio playing");
                  merge({ voiceState: "speaking" });
                },
              });
              consumerDone = (async () => {
                try {
                  for await (const chunk of tts!.audioChunks()) {
                    audioChunkCount++;
                    const rate = Number(chunk.sampling_rate);
                    t(
                      `tts chunk #${audioChunkCount} len=${chunk.audio?.length} rate=${rate} (~${(chunk.audio?.length / rate).toFixed(1)}s audio)`,
                    );
                    if (
                      !chunk.audio ||
                      chunk.audio.length === 0 ||
                      !Number.isFinite(rate) ||
                      rate <= 0
                    ) {
                      continue;
                    }
                    const buf = ctx.createBuffer(1, chunk.audio.length, rate);
                    const copy = new Float32Array(chunk.audio.length);
                    copy.set(chunk.audio);
                    buf.copyToChannel(copy, 0);
                    playback!.enqueue(buf);
                  }
                  console.debug(`[voice] tts audio iterator drained (${audioChunkCount} chunks total)`);
                } catch (err) {
                  console.warn("TTS consumer failed:", err);
                }
              })();
            } catch (err) {
              console.warn("TTS init failed, running silent:", err);
              ttsFailed = true;
            }

            // Buffer LLM deltas into whole-word units before pushing to the
            // TextSplitterStream. Kokoro's splitter expects word-level input;
            // pushing sub-word tokens can starve the splitter of sentence
            // boundaries and it never emits audio chunks. Flushing on
            // whitespace gives it clean words.
            let wordBuffer = "";
            let firstTokenSeen = false;
            let tokenCount = 0;
            const flushWord = () => {
              if (!wordBuffer || !tts || ttsFailed) return;
              try {
                tts.push(wordBuffer);
              } catch (err) {
                console.warn("TTS push failed, disabling further audio:", err);
                ttsFailed = true;
              }
              wordBuffer = "";
            };
            const safePush = (delta: string) => {
              if (!firstTokenSeen) {
                firstTokenSeen = true;
                t("first LLM token");
              }
              tokenCount++;
              if (!tts || ttsFailed) return;
              wordBuffer += delta;
              if (/\s$/.test(delta)) flushWord();
            };

            const response = await runQuery(text, { onDelta: safePush });
            t(`LLM done (${tokenCount} tokens)`);
            // Flush any tail — the last word usually has no trailing space.
            flushWord();

            // Scope refusals bypass the LLM stream, so no tokens were
            // pushed. Speak the refusal message directly, then close once.
            if (response?.refused) safePush(REFUSAL_MESSAGE);
            // Close the splitter exactly once, ignoring errors from a
            // splitter that was never opened or is already terminated.
            if (tts) {
              try {
                tts.close();
              } catch {
                /* splitter was never used, or already closed — safe to ignore */
              }
            }
            // Wait for Kokoro to drain and playback to finish.
            if (tts) await consumerDone;
            if (playback) await playback.end();
          } catch (err) {
            // Any un-handled path — non-fatal for voice mode.
            console.warn("Voice turn failed:", err);
          } finally {
            // Always: reattach mic, resume VAD, return to idle. The order
            // matters — restore mic analyser before resuming VAD so the
            // very first frame the VAD processes isn't stale TTS audio.
            try {
              await meter.attachStream(stream);
              meter.start();
            } catch (err) {
              console.warn("Failed to restore mic stream:", err);
            }
            merge({ voiceState: "idle" });
            vad.resume();
            handling = false;
          }
        },
      });

      voiceRef.current = { vad, meter, stream };
      // Cleanup subscription on disable — closure keeps it alive.
      (voiceRef.current as { unsub?: () => void }).unsub = unsub;
      merge({ voiceEnabled: true, voiceLoading: false });
    } catch (err) {
      merge({
        voiceLoading: false,
        voiceEnabled: false,
        mode: "text",
        error: err instanceof Error ? err.message : "Couldn't enable voice.",
      });
    }
  }, [state.voiceEnabled, state.voiceLoading, runQuery]);

  const disableVoice = useCallback(() => {
    const v = voiceRef.current as {
      vad?: import("../voice/vad").VoiceActivityDetector;
      meter?: import("../voice/audio-analyser").AmplitudeMeter;
      stream?: MediaStream;
      unsub?: () => void;
    };
    v.unsub?.();
    v.vad?.destroy();
    v.meter?.detach();
    v.stream?.getTracks().forEach((t) => t.stop());
    voiceRef.current = {};
    merge({ voiceEnabled: false, mode: "text", voiceState: "idle" });
  }, []);

  return useMemo(
    () => ({
      ...state,
      isOpen,
      open,
      close,
      start,
      send,
      toggleMode,
      enableVoice,
      disableVoice,
      clearError,
      amplitudeSource,
      transcript,
    }),
    [
      state,
      isOpen,
      open,
      close,
      start,
      send,
      toggleMode,
      enableVoice,
      disableVoice,
      clearError,
      amplitudeSource,
      transcript,
    ],
  );
}
