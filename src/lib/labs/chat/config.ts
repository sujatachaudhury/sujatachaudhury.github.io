/**
 * Chat configuration — single source of truth for model choices and
 * download budgets. Change here to swap models across the whole feature.
 */

/**
 * WebLLM model id. Llama-3.2-1B-Instruct at q4f16_1 is the size/quality
 * sweet spot for retrieval-anchored Q&A over a small bio corpus (~500MB).
 * See lib/labs/README for the reasoning.
 */
export const LLM_MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

/** Sentence-transformer used for query embedding at runtime. Must match the
 *  model used in scripts/build-bio-index.mjs — otherwise vectors are
 *  incomparable and retrieval fails silently.
 */
export const EMBEDDER_MODEL_ID = "Xenova/all-MiniLM-L6-v2";

/**
 * Whisper build for STT. The `.en` variants are English-only but ~30% more
 * accurate than the multilingual builds on English audio; `small` is the
 * next size tier above `base` and materially better on short utterances
 * and accented speech. ~460MB at fp32 vs ~160MB for base — the size cost
 * is what buys reliable transcription in voice mode.
 */
export const WHISPER_MODEL_ID = "Xenova/whisper-small.en";
/** BCP-47 language passed to Whisper's `generate`. Pinning stops language
 *  drift on short utterances (Whisper's autodetect is unreliable on <2s). */
export const WHISPER_LANGUAGE = "en";
/** Silence padding prepended to captured audio, in seconds. Whisper often
 *  clips the first word of very short clips; padding recovers it. */
export const WHISPER_SILENCE_PAD_SEC = 0.2;
/** Sample rate the VAD emits at (silero-vad is fixed 16kHz mono). */
export const WHISPER_SAMPLE_RATE = 16000;

/** Voice-activity detection: Silero VAD ONNX build. */
export const VAD_MODEL_ID = "onnx-community/silero-vad";

/** Neural TTS. Kokoro-82M is the smallest voice that doesn't sound robotic. */
export const TTS_MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

/** Retrieval knobs. */
export const RETRIEVAL_TOP_K = 5;
/** Cosine similarity below this = the question is probably off-topic. Tune
 *  after real-user testing; conservative default. */
export const SCOPE_THRESHOLD = 0.28;

/** Generation knobs. */
export const MAX_NEW_TOKENS = 320;
export const TEMPERATURE = 0.3;
