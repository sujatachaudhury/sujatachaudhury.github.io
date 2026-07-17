/**
 * SpeechToText — Whisper-base via transformers.js.
 *
 * Lazy-loaded on first use so text-only sessions never pay the ~80MB cost.
 * Accepts a Float32Array of 16kHz mono audio (VAD produces exactly that
 * shape after resampling) and returns the transcript.
 */
import {
  WHISPER_LANGUAGE,
  WHISPER_MODEL_ID,
  WHISPER_SAMPLE_RATE,
  WHISPER_SILENCE_PAD_SEC,
} from "../chat/config";

type Transcriber = (
  audio: Float32Array,
  opts?: { language?: string; task?: string; return_timestamps?: boolean },
) => Promise<{ text: string } | { text: string }[]>;

let promise: Promise<Transcriber> | null = null;

/**
 * WebGPU probe scoped to STT. Same shape as the check in chat/engine.ts but
 * duplicated here to keep this module tree-shakable from the LLM engine.
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

export async function loadTranscriber(onProgress?: (p: number) => void): Promise<Transcriber> {
  if (!promise) {
    promise = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");
      env.allowLocalModels = false;

      const device = await pickDevice();
      // Whisper on WebGPU can use fp16 encoder + q4 decoder for a big
      // speedup vs fp32 CPU. On wasm we're stuck with fp32 (q8 has missing-
      // scale issues in ORT for Whisper).
      const config =
        device === "webgpu"
          ? ({ device: "webgpu", dtype: { encoder_model: "fp16", decoder_model_merged: "q4" } } as const)
          : ({ dtype: "fp32" } as const);

      const progress_callback = (p: unknown) => {
        const progress = (p as { progress?: number }).progress;
        if (onProgress && typeof progress === "number") onProgress(progress / 100);
      };

      try {
        const pipe = await pipeline("automatic-speech-recognition", WHISPER_MODEL_ID, {
          ...config,
          progress_callback,
        });
        return pipe as unknown as Transcriber;
      } catch (err) {
        // WebGPU can fail after adapter-probe on some device/driver combos
        // that don't have kernels for all Whisper ops. Fall back to wasm.
        if (device === "webgpu") {
          console.warn("Whisper WebGPU init failed, falling back to wasm:", err);
          const pipe = await pipeline("automatic-speech-recognition", WHISPER_MODEL_ID, {
            dtype: "fp32",
            progress_callback,
          });
          return pipe as unknown as Transcriber;
        }
        throw err;
      }
    })();
  }
  return promise;
}

/**
 * Prime — fire-and-forget preload. Called during initial engine warm-up so
 * the first voice-toggle doesn't pay the download+init cost mid-turn.
 */
export function primeStt(): Promise<unknown> {
  return loadTranscriber().catch(() => {
    // Best-effort; real errors surface at transcribe() time.
  });
}

/**
 * Prepend a short silence buffer to the VAD-captured audio.
 * Whisper attends most to the beginning of the clip; without padding it
 * frequently clips or misreads the first word on short utterances
 * (VAD-captured audio starts *right* at speech onset — no natural lead-in).
 */
function padWithSilence(audio: Float32Array): Float32Array {
  const padSamples = Math.round(WHISPER_SILENCE_PAD_SEC * WHISPER_SAMPLE_RATE);
  const out = new Float32Array(audio.length + padSamples);
  // Leading zeros are silence; then copy the utterance.
  out.set(audio, padSamples);
  return out;
}

/**
 * English-only Whisper builds (the `.en` suffix) reject `task` and `language`
 * generation options — the model isn't multilingual, so specifying them is
 * an error. Multilingual builds require them to prevent language drift. We
 * pass them only for multilingual models.
 */
const IS_ENGLISH_ONLY_WHISPER = WHISPER_MODEL_ID.endsWith(".en");

export async function transcribe(audio: Float32Array): Promise<string> {
  const transcriber = await loadTranscriber();
  const padded = padWithSilence(audio);
  const opts = IS_ENGLISH_ONLY_WHISPER
    ? undefined
    : { task: "transcribe", language: WHISPER_LANGUAGE };
  const result = await transcriber(padded, opts);
  const first = Array.isArray(result) ? result[0] : result;
  return first.text.trim();
}
