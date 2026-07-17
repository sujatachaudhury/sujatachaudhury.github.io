/**
 * TranscriptStore — external store for the streaming transcript.
 *
 * Motivation: putting the transcript in React state means every LLM token
 * (20–30/s) forces a `setState` on the whole controller. Downstream
 * components — layout, panel, unrelated consumers — re-render on every
 * token. On the same main thread that WebLLM is churning through inference,
 * that stacks up into visible jank.
 *
 * This store keeps the transcript in a plain object, notifies subscribers
 * explicitly, and expects consumers to use `useSyncExternalStore` so only
 * the specific components that read the transcript re-render.
 *
 * Turn identity: each turn has a stable `id` so subscribers can key on it.
 * `snapshot()` returns a reference-stable array between mutations, so
 * useSyncExternalStore's identity check works.
 */

export interface Turn {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export class TranscriptStore {
  private turns: Turn[] = [];
  private listeners = new Set<() => void>();
  private nextId = 0;

  snapshot = (): Turn[] => this.turns;
  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };

  private emit() {
    for (const cb of this.listeners) cb();
  }

  append(role: Turn["role"], content: string): string {
    const id = `t${this.nextId++}`;
    this.turns = [...this.turns, { id, role, content }];
    this.emit();
    return id;
  }

  /**
   * Mutate the *content* of an existing turn in place. Reference of the
   * turns array still changes so useSyncExternalStore sees an update, but
   * only the identified turn's content field is touched — components can
   * memoize per-id and skip renders for other turns.
   */
  appendToTurn(id: string, delta: string): void {
    const idx = this.turns.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const updated = { ...this.turns[idx], content: this.turns[idx].content + delta };
    this.turns = [...this.turns.slice(0, idx), updated, ...this.turns.slice(idx + 1)];
    this.emit();
  }

  /**
   * Buffered variant of appendToTurn for token-stream hot paths.
   *
   * Coalesces per-token deltas into a single per-frame flush via
   * requestAnimationFrame. At 30 tok/s the raw call rate is 30Hz; rAF caps
   * effective UI updates at ~60Hz and (importantly) *skips flushes when
   * the tab is backgrounded* — where React reconciles would otherwise still
   * fire and starve WebLLM.
   *
   * Guaranteed to flush any pending buffer on `flushPending()` — callers
   * MUST call this on stream completion so the final tokens aren't lost.
   */
  private pendingBuffers = new Map<string, string>();
  private raf = 0;

  appendToTurnBuffered(id: string, delta: string): void {
    const existing = this.pendingBuffers.get(id) ?? "";
    this.pendingBuffers.set(id, existing + delta);
    if (!this.raf) {
      this.raf = requestAnimationFrame(() => this.flushPending());
    }
  }

  flushPending(): void {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    if (this.pendingBuffers.size === 0) return;
    // Apply every buffered delta in one atomic array rebuild, then emit
    // once. If a stream produced tokens for multiple turns (unusual but
    // possible), they all land in the same flush.
    let mutated = false;
    for (const [id, delta] of this.pendingBuffers) {
      const idx = this.turns.findIndex((t) => t.id === id);
      if (idx < 0) continue;
      const updated = { ...this.turns[idx], content: this.turns[idx].content + delta };
      this.turns = [...this.turns.slice(0, idx), updated, ...this.turns.slice(idx + 1)];
      mutated = true;
    }
    this.pendingBuffers.clear();
    if (mutated) this.emit();
  }

  clear() {
    this.turns = [];
    this.emit();
  }

  length() {
    return this.turns.length;
  }
}
