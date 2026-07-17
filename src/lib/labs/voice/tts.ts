/**
 * TextToSpeech — Kokoro-82M via the dedicated `kokoro-js` SDK.
 *
 * The transformers.js `text-to-speech` pipeline doesn't exist (only
 * `text-to-audio`, and Kokoro isn't a first-class type there yet). The
 * upstream SDK is the officially-supported path and handles Kokoro's
 * tokenization / phonemization internally.
 *
 * Lazy-loaded on first synthesise() call. First load downloads model weights
 * from HuggingFace and caches them in the browser (OPFS/IndexedDB).
 *
 * dtype q8 (~90MB) is the smallest-viable quality tier. fp32 (~330MB) is
 * fully accurate but heavy; we accept the small loss for the size win.
 */
import { TTS_MODEL_ID } from "../chat/config";

/**
 * Kokoro exposes two paths:
 *   - `generate(text)`         → full-response synthesis, returns one buffer
 *   - `stream(splitter)`       → per-sentence synthesis; consume as async iter
 *
 * We use the streaming path for voice mode. The LLM's token stream is
 * pushed into a TextSplitterStream, Kokoro emits per-sentence audio as
 * sentences finish, and the AmplitudeMeter's playback queue drops the
 * first chunk to the speaker as soon as it arrives. Time-to-first-audio
 * drops from ~18s (full-utterance synth) to ~4–6s (first sentence).
 */

/**
 * Kokoro's non-streaming API returns audio directly:
 *     { audio: Float32Array, sampling_rate: number }
 * The streaming API yields one level of wrapping — each chunk is
 *     { text, phonemes, audio: RawAudio }
 * where `RawAudio` itself has `.audio` (Float32Array) and `.sampling_rate`.
 * The two shapes are normalised at the boundary of this module so callers
 * always see the flat `{ audio, sampling_rate }` shape.
 */
export interface KokoroChunk {
  audio: Float32Array;
  sampling_rate: number;
}

interface RawAudioLike {
  audio: Float32Array;
  sampling_rate: number;
}

interface StreamedFrame {
  text: string;
  phonemes?: string;
  audio: RawAudioLike;
}

interface TextSplitter {
  push(text: string): void;
  close(): void;
  flush?: () => void;
}

interface KokoroInstance {
  generate: (text: string, opts: { voice: string }) => Promise<KokoroChunk>;
  stream: (splitter: TextSplitter) => AsyncIterable<StreamedFrame>;
}

let promise: Promise<{
  tts: KokoroInstance;
  TextSplitterStream: new () => TextSplitter;
}> | null = null;

/**
 * Test if WebGPU is usable for TTS. Kokoro on WebGPU is ~4× faster than
 * wasm, but not every device that reports WebGPU can actually run Kokoro's
 * ops — we still need a wasm fallback path.
 */
async function pickDevice(): Promise<"webgpu" | "wasm"> {
  if (typeof navigator === "undefined") return "wasm";
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
  if (!gpu) return "wasm";
  try {
    const adapter = await gpu.requestAdapter();
    return adapter ? "webgpu" : "wasm";
  } catch {
    return "wasm";
  }
}

async function load(onProgress?: (p: number) => void) {
  if (!promise) {
    promise = (async () => {
      const mod = await import("kokoro-js");
      const device = await pickDevice();
      // On WebGPU, Kokoro recommends fp32 dtype (per its README) — the q8
      // path is optimised for wasm/CPU. Trade a modest download-size hit
      // (~330MB vs ~90MB) for a big first-audio latency win.
      const config =
        device === "webgpu"
          ? ({ dtype: "fp32", device: "webgpu" } as const)
          : ({ dtype: "q8", device: "wasm" } as const);
      let tts: unknown;
      try {
        tts = await mod.KokoroTTS.from_pretrained(TTS_MODEL_ID, {
          ...config,
          progress_callback: (p) => {
            const progress = (p as { progress?: number }).progress;
            if (onProgress && typeof progress === "number") onProgress(progress / 100);
          },
        });
      } catch (err) {
        // WebGPU init can fail after adapter-probe succeeds (some GPUs
        // reject Kokoro's specific ops). Fall back to wasm cleanly.
        if (device === "webgpu") {
          console.warn("Kokoro WebGPU init failed, falling back to wasm:", err);
          tts = await mod.KokoroTTS.from_pretrained(TTS_MODEL_ID, {
            dtype: "q8",
            device: "wasm",
          });
        } else {
          throw err;
        }
      }
      return {
        tts: tts as KokoroInstance,
        TextSplitterStream: mod.TextSplitterStream as unknown as new () => TextSplitter,
      };
    })();
  }
  return promise;
}

/**
 * Prime — fire-and-forget model preload. Callers use this during initial
 * engine warm-up so voice mode is warm on first toggle.
 */
export function primeTts(): Promise<unknown> {
  return load().catch(() => {
    // Preload is best-effort; if it fails, the real openStreamingSynthesiser
    // call will surface the error properly at use-time.
  });
}

export interface SpokenClip {
  buffer: AudioBuffer;
  duration: number;
}

/**
 * Non-streaming path — used only for the (currently unused) full-utterance
 * synthesis code path. Kept here as a fallback and for debug tooling.
 */
export async function synthesise(text: string, ctx: AudioContext): Promise<SpokenClip> {
  const { tts } = await load();
  const { audio, sampling_rate } = await tts.generate(text, { voice: "af_heart" });
  const buf = ctx.createBuffer(1, audio.length, sampling_rate);
  const copy = new Float32Array(audio.length);
  copy.set(audio);
  buf.copyToChannel(copy, 0);
  return { buffer: buf, duration: buf.duration };
}

export interface StreamingSynthesiser {
  /** Push a chunk of text (typically an LLM token or short phrase). */
  push(text: string): void;
  /** Signal that no more text is coming. Callers still need to await
   *  `audioChunks` to fully drain and `done()` to await playback end. */
  close(): void;
  /**
   * Async iterator of synthesised audio chunks (one per sentence-ish unit
   * the splitter decides on). Consume in-order.
   */
  audioChunks(): AsyncIterable<KokoroChunk>;
}

/**
 * Open a streaming TTS session. Text pushed in gets segmented by Kokoro's
 * TextSplitterStream and synthesised sentence-by-sentence. Audio chunks are
 * exposed as an async iterable — the caller enqueues them into playback.
 *
 * Design note: we don't return AudioBuffers directly here. Kokoro emits
 * Float32Array + sampling_rate; the caller composes the AudioBuffer via
 * the shared AudioContext (see `useChatController.ts`). This keeps this
 * module free of a hard dependency on Web Audio.
 */
export async function openStreamingSynthesiser(): Promise<StreamingSynthesiser> {
  const { tts, TextSplitterStream } = await load();
  const splitter = new TextSplitterStream();
  const stream = tts.stream(splitter);

  // Adapter: unwrap each StreamedFrame down to the flat KokoroChunk shape
  // the rest of the pipeline expects. Any frame missing an audio buffer
  // (e.g. degenerate empty-sentence outputs) is skipped.
  async function* unwrapped(): AsyncIterable<KokoroChunk> {
    for await (const frame of stream) {
      const raw = frame?.audio;
      if (!raw || !raw.audio || raw.audio.length === 0) continue;
      yield { audio: raw.audio, sampling_rate: raw.sampling_rate };
    }
  }

  return {
    push: (text) => splitter.push(text),
    close: () => splitter.close(),
    audioChunks: () => unwrapped(),
  };
}
