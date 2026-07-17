/**
 * VoiceActivityDetector — thin wrapper around @ricky0123/vad-web (Silero VAD).
 *
 * The library expects to fetch three runtime artifacts by URL:
 *   1. silero_vad_legacy.onnx (the model weights)
 *   2. vad.worklet.bundle.min.js (the AudioWorklet processor)
 *   3. onnxruntime-web's ort-wasm-simd-threaded.wasm (+ .mjs)
 *
 * We stage all of those into /labs/vad/ at build time via
 * scripts/copy-labs-assets.mjs and point the library there. Without this,
 * the browser fetches from the site root and 404s.
 *
 * Emits `onSpeechEnd(audio)` when a full utterance has been captured. Audio is
 * 16kHz mono Float32 — the same shape Whisper wants.
 */
type MicVADModule = typeof import("@ricky0123/vad-web");
type MicVADInstance = Awaited<ReturnType<MicVADModule["MicVAD"]["new"]>>;

const VAD_ASSETS_BASE = "/labs/vad/";

export interface VadHandlers {
  onSpeechStart?: () => void;
  onSpeechEnd?: (audio: Float32Array) => void;
  onError?: (err: Error) => void;
}

async function configureOrtPaths() {
  // onnxruntime-web reads env.wasm.wasmPaths at module load. Set it before
  // vad-web (which imports ORT internally) starts fetching. The trailing
  // slash matters — ORT concatenates without normalizing.
  const ort = await import("onnxruntime-web");
  const wasm = (ort as unknown as { env: { wasm: { wasmPaths: string } } }).env.wasm;
  if (!wasm.wasmPaths) wasm.wasmPaths = VAD_ASSETS_BASE;
}

export class VoiceActivityDetector {
  private vad: MicVADInstance | null = null;

  async start(handlers: VadHandlers) {
    await configureOrtPaths();
    const { MicVAD } = (await import("@ricky0123/vad-web")) as MicVADModule;
    this.vad = await MicVAD.new({
      // Tell vad-web where to fetch its ONNX weights and AudioWorklet from.
      baseAssetPath: VAD_ASSETS_BASE,
      onnxWASMBasePath: VAD_ASSETS_BASE,
      // Default speech thresholds (0.3 / 0.25) trigger on ambient noise
      // like fans, typing, or breathing — the "redemption" window then
      // never expires, so onSpeechEnd never fires. Raising them makes
      // the VAD demand clearer speech to trigger.
      positiveSpeechThreshold: 0.55,
      negativeSpeechThreshold: 0.4,
      // How long of silence (post-speech) before we consider the utterance
      // finished. Default 1400ms — a bit long for a conversational feel.
      redemptionMs: 900,
      // Minimum utterance length to accept — filters coughs and clicks.
      minSpeechMs: 300,
      onSpeechStart: () => handlers.onSpeechStart?.(),
      onSpeechEnd: (audio: Float32Array) => handlers.onSpeechEnd?.(audio),
      onVADMisfire: () => {
        // Very short blip; ignored.
      },
    });
    await this.vad.start();
  }

  pause() {
    this.vad?.pause();
  }

  resume() {
    this.vad?.start();
  }

  destroy() {
    this.vad?.destroy();
    this.vad = null;
  }
}
