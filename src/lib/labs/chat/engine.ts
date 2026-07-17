/**
 * ChatEngine — thin wrapper around @mlc-ai/web-llm.
 *
 * Owns:
 *   - Model init with progress reporting.
 *   - Streamed inference with abort.
 *   - No conversation state — the caller passes the full message array each
 *     time so the engine stays stateless and easy to reason about.
 *
 * Client-only: dynamic-imports web-llm so the SSR / static-export build never
 * pulls it into the server bundle. Callers should only construct this from
 * inside a "use client" boundary.
 */
import type { MLCEngineInterface, ChatCompletionMessageParam, InitProgressReport } from "@mlc-ai/web-llm";
import { LLM_MODEL_ID, MAX_NEW_TOKENS, TEMPERATURE } from "./config";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface EngineInit {
  onProgress?: (p: { text: string; progress: number }) => void;
  signal?: AbortSignal;
}

export interface StreamOptions {
  onToken: (delta: string) => void;
  signal?: AbortSignal;
}

/**
 * WebGPU probe. Returns true iff the browser can actually acquire a WebLLM-
 * compatible adapter. Feature-detects at both `navigator.gpu` and
 * `requestAdapter` levels — the second call is where Safari and legacy
 * browsers really fail.
 */
interface GPULike {
  requestAdapter: () => Promise<unknown>;
}

export async function detectWebGPU(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  const gpu = (navigator as Navigator & { gpu?: GPULike }).gpu;
  if (!gpu) return false;
  try {
    const adapter = await gpu.requestAdapter();
    return adapter !== null && adapter !== undefined;
  } catch {
    return false;
  }
}

export class ChatEngine {
  private engine: MLCEngineInterface | null = null;
  private ready = false;

  isReady() {
    return this.ready;
  }

  async init({ onProgress, signal }: EngineInit = {}) {
    if (this.ready) return;
    const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
    const initProgressCallback = onProgress
      ? (report: InitProgressReport) => onProgress({ text: report.text, progress: report.progress })
      : undefined;

    this.engine = await CreateMLCEngine(LLM_MODEL_ID, {
      initProgressCallback,
    });

    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    this.ready = true;
  }

  /**
   * Stream a completion. Calls onToken with incremental deltas until done.
   * Returns the full concatenated response.
   * Aborting mid-stream cancels generation cleanly on the WebLLM side via
   * `interruptGenerate` — no leaked GPU work.
   */
  async stream(messages: ChatMessage[], { onToken, signal }: StreamOptions): Promise<string> {
    if (!this.engine || !this.ready) throw new Error("ChatEngine.stream called before init");

    const onAbort = () => {
      this.engine?.interruptGenerate();
    };
    if (signal) {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      signal.addEventListener("abort", onAbort, { once: true });
    }

    let full = "";
    try {
      const chunks = await this.engine.chat.completions.create({
        messages: messages as ChatCompletionMessageParam[],
        stream: true,
        max_tokens: MAX_NEW_TOKENS,
        temperature: TEMPERATURE,
      });
      for await (const chunk of chunks) {
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
        const delta = chunk.choices[0]?.delta?.content ?? "";
        if (delta) {
          full += delta;
          onToken(delta);
        }
      }
      return full;
    } finally {
      signal?.removeEventListener("abort", onAbort);
    }
  }

  async unload() {
    await this.engine?.unload();
    this.engine = null;
    this.ready = false;
  }
}
