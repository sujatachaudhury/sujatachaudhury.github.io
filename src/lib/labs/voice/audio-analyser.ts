/**
 * AmplitudeMeter — drives the VAD orb's reactive scale.
 *
 * Wraps a Web Audio AnalyserNode. Given a MediaStream (mic) or an
 * AudioBuffer (TTS output routed through Web Audio), it produces a running
 * normalized amplitude value 0..1 the orb can subscribe to.
 *
 * Uses a single AudioContext, resumed lazily on first use (Autoplay Policy).
 * Subscribers get the current amplitude via requestAnimationFrame so React
 * consumers can drive CSS transforms without setState churn.
 */
type Listener = (amp: number) => void;

let ctx: AudioContext | null = null;

async function getContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (ctx.state === "suspended") await ctx.resume();
  return ctx;
}

/** Public accessor for the shared context — used by TTS to build AudioBuffers
 *  in the same context the analyser lives in. */
export async function sharedAudioContext() {
  return getContext();
}

export class AmplitudeMeter {
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | AudioBufferSourceNode | null = null;
  private buffer: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(0));
  private raf = 0;
  private listeners = new Set<Listener>();
  private running = false;

  async attachStream(stream: MediaStream) {
    const c = await getContext();
    this.detach();
    this.source = c.createMediaStreamSource(stream);
    this.analyser = c.createAnalyser();
    this.analyser.fftSize = 512;
    this.buffer = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
    this.source.connect(this.analyser);
  }

  /**
   * Play an AudioBuffer through the shared context and drive the analyser
   * off it. Resolves when playback ends (or when detach() is called mid-way,
   * whichever comes first). Used for TTS output.
   */
  async playBuffer(buf: AudioBuffer): Promise<void> {
    const c = await getContext();
    this.detach();
    const src = c.createBufferSource();
    src.buffer = buf;
    this.analyser = c.createAnalyser();
    this.analyser.fftSize = 512;
    this.buffer = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
    src.connect(this.analyser);
    this.analyser.connect(c.destination);
    this.source = src;
    return new Promise((resolve) => {
      src.onended = () => resolve();
      src.start();
    });
  }

  /**
   * Start a streaming-playback session. Returns a controller that lets the
   * caller enqueue AudioBuffer chunks as they arrive (from a TTS stream) and
   * signal completion.
   *
   * Design:
   *   - A single Analyser + destination graph is set up once. Chunks feed
   *     through independent BufferSourceNodes but share the analyser, so the
   *     orb's amplitude signal stays continuous across chunk boundaries.
   *   - Chunks are scheduled back-to-back using the AudioContext's clock
   *     (schedule at max(currentTime, endOfPreviousChunk)). This is gap-free
   *     playback even if enqueue() is called from a slow producer.
   *   - `onFirstPlay` fires the moment audio actually starts flowing —
   *     useful for flipping UI state from "thinking" to "speaking" only
   *     when there's sound to hear.
   *   - `end()` returns a promise that resolves after the last enqueued
   *     chunk finishes playing.
   */
  async openPlaybackStream(hooks: { onFirstPlay?: () => void } = {}) {
    const c = await getContext();
    this.detach();
    this.analyser = c.createAnalyser();
    this.analyser.fftSize = 512;
    this.buffer = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
    this.analyser.connect(c.destination);

    let nextStartAt = 0;
    let firstPlayFired = false;
    let lastSource: AudioBufferSourceNode | null = null;
    let ended = false;
    let endResolve: (() => void) | null = null;
    const endedPromise = new Promise<void>((r) => (endResolve = r));

    const enqueue = (buf: AudioBuffer) => {
      if (ended || !this.analyser) return;
      const src = c.createBufferSource();
      src.buffer = buf;
      src.connect(this.analyser);
      const startAt = Math.max(c.currentTime + 0.02, nextStartAt);
      src.start(startAt);
      nextStartAt = startAt + buf.duration;
      lastSource = src;
      // First-play detection: schedule at the exact moment playback begins.
      if (!firstPlayFired) {
        firstPlayFired = true;
        const delay = Math.max(0, (startAt - c.currentTime) * 1000);
        window.setTimeout(() => hooks.onFirstPlay?.(), delay);
      }
      src.onended = () => {
        if (src === lastSource && ended) endResolve?.();
      };
    };

    const end = () => {
      ended = true;
      // If nothing was ever enqueued, resolve immediately.
      if (!lastSource) {
        endResolve?.();
        return endedPromise;
      }
      // If the last chunk already finished before end() was called, resolve.
      if (nextStartAt <= c.currentTime) {
        endResolve?.();
      }
      return endedPromise;
    };

    return { enqueue, end };
  }

  start() {
    if (this.running) return;
    this.running = true;
    const tick = () => {
      if (!this.running || !this.analyser) return;
      this.analyser.getByteFrequencyData(this.buffer);
      let sum = 0;
      for (let i = 0; i < this.buffer.length; i++) sum += this.buffer[i];
      const avg = sum / this.buffer.length / 255;
      for (const l of this.listeners) l(avg);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  }

  detach() {
    this.stop();
    this.source?.disconnect();
    this.analyser?.disconnect();
    this.source = null;
    this.analyser = null;
  }
}
