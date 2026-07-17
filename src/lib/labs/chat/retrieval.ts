/**
 * Retrieval — client-side semantic search over the pre-built bio-index.
 *
 *   1. Load Xenova/all-MiniLM-L6-v2 once (cached in OPFS by transformers.js).
 *   2. Embed user query.
 *   3. Cosine against every corpus vector (17 chunks — brute force is fine).
 *   4. Return top-K + a scope-check verdict.
 *
 * Scope check: the top-1 similarity acts as a proxy for "does this look like
 * it's about Sujata's work?". If it falls below SCOPE_THRESHOLD, callers
 * short-circuit to the guardrail refusal and never invoke the LLM.
 */
import { EMBEDDER_MODEL_ID, RETRIEVAL_TOP_K, SCOPE_THRESHOLD } from "./config";

export interface IndexedChunk {
  id: string;
  category: string;
  body: string;
  vec: number[];
}

export interface BioIndex {
  model: string;
  dim: number;
  chunks: IndexedChunk[];
}

export interface RetrievalHit {
  chunk: IndexedChunk;
  score: number;
}

export interface RetrievalResult {
  hits: RetrievalHit[];
  topScore: number;
  inScope: boolean;
}

// Feature-extraction pipeline type. `any` here because transformers.js types
// use generics that don't survive a public re-export cleanly; the runtime
// contract (a callable with a data field on the result) is stable.
type Embedder = (
  text: string,
  opts: { pooling: "mean"; normalize: boolean },
) => Promise<{ data: Float32Array | number[] }>;

let embedderPromise: Promise<Embedder> | null = null;
let indexPromise: Promise<BioIndex> | null = null;

async function loadEmbedder(onProgress?: (p: number) => void): Promise<Embedder> {
  if (!embedderPromise) {
    embedderPromise = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");
      env.allowLocalModels = false;
      const pipe = await pipeline("feature-extraction", EMBEDDER_MODEL_ID, {
        dtype: "q8",
        progress_callback: (p) => {
          const progress = (p as { progress?: number }).progress;
          if (onProgress && typeof progress === "number") onProgress(progress / 100);
        },
      });
      return pipe as unknown as Embedder;
    })();
  }
  return embedderPromise;
}

async function loadIndex(): Promise<BioIndex> {
  if (!indexPromise) {
    indexPromise = fetch("/labs/bio-index.json")
      .then((r) => {
        if (!r.ok) throw new Error(`bio-index fetch failed: ${r.status}`);
        return r.json() as Promise<BioIndex>;
      });
  }
  return indexPromise;
}

/** Pre-warms both artifacts. Callers use this during the download phase. */
export async function primeRetrieval(onEmbedderProgress?: (p: number) => void) {
  await Promise.all([loadEmbedder(onEmbedderProgress), loadIndex()]);
}

function cosine(a: number[] | Float32Array, b: number[]): number {
  // Inputs are normalized at index and embed time, so cosine = dot product.
  let dot = 0;
  for (let i = 0; i < b.length; i++) dot += a[i] * b[i];
  return dot;
}

/**
 * Detect a person-name mention that isn't Sujata. Embeddings are
 * insensitive to name tokens on short queries, so a similarity threshold
 * alone can't catch "tell me about Sita's projects" — the sentence looks
 * bio-shaped and passes retrieval.
 *
 * Detection strategy: look only at *mid-sentence* capitalised tokens (skip
 * the sentence-initial one so "Can you tell me about Sujata" doesn't count
 * "Can" as a name), then compare against the allowlist of terms that appear
 * in the bio corpus. Anything left is a suspected off-list proper noun.
 */
const NAME_ALLOWLIST = new Set([
  // Sujata + pronouns
  "sujata", "chaudhury", "she", "her", "hers", "herself",
  // Co-authors on the IEEE paper (appear in bio verbatim)
  "sagnik", "modak", "abhishek", "rawat", "suman", "deb",
  // Institutions and technologies that appear capitalised in bio
  "optum", "ieee", "erasmus", "mundus", "politecnico", "milano", "milan",
  "tampere", "polytechnic", "kharagpur", "iit", "nit", "agartala",
  "bengaluru", "tripura", "india", "finland", "italy",
  "python", "matlab", "sql", "opencv", "pytorch", "tensorflow", "react",
  "angular", "vue", "webrtc", "stun", "turn", "javascript", "html", "css",
  "linux", "git", "latex", "dicom", "cox", "mars", "agatston", "linkedin",
  "github", "gmail", "webgpu", "wasm", "onnx",
  // Degree names & academic terms
  "masters", "master", "bachelor", "bachelors", "msc", "btech",
  "computer", "science", "engineering", "imaging", "vision", "machine",
  "learning", "software", "engineer", "artificial", "intelligence", "ml", "ai",
]);

/** Common English words that are capitalised at the start of a sentence but
 *  aren't names. We only *need* this set for the sentence-initial token,
 *  which we detect and skip regardless — but leaving it here catches cases
 *  like "Can Sujata tell me…" where "Can" is a modal in the second clause. */
const CAPITALISED_NON_NAMES = new Set([
  "the", "a", "an", "is", "are", "was", "were", "do", "does", "did",
  "can", "could", "should", "would", "will", "may", "might", "must",
  "tell", "give", "show", "explain", "describe", "list", "what", "which",
  "who", "when", "where", "why", "how", "i", "you", "we", "they", "he",
  "his", "him", "hers", "them", "monday", "tuesday", "wednesday",
  "thursday", "friday", "saturday", "sunday", "january", "february",
  "march", "april", "may", "june", "july", "august", "september",
  "october", "november", "december", "english", "finnish", "italian",
  "german", "hindi", "us", "usa", "eu", "uk", "hi", "hello", "hey",
]);

function containsOtherPersonName(query: string): boolean {
  // Split on sentence-like boundaries first so we can identify each
  // sentence's leading token and exempt it.
  const sentences = query.split(/[.!?]+/);
  for (const sentence of sentences) {
    const tokens = sentence.trim().split(/[^\p{L}]+/u).filter((t) => t.length >= 3);
    for (let i = 0; i < tokens.length; i++) {
      const raw = tokens[i];
      const first = raw.charCodeAt(0);
      const isCapitalised = first >= 0x41 && first <= 0x5a; // A–Z
      if (!isCapitalised) continue;
      // Skip acronyms (all-caps).
      if (raw === raw.toUpperCase() && raw.length <= 4) continue;
      // Skip the sentence-initial token — grammar, not a name signal.
      if (i === 0) continue;
      const lower = raw.toLowerCase();
      if (NAME_ALLOWLIST.has(lower)) continue;
      if (CAPITALISED_NON_NAMES.has(lower)) continue;
      // Anything left is a suspected off-list proper noun.
      return true;
    }
  }
  return false;
}

export async function retrieve(query: string): Promise<RetrievalResult> {
  const [embedder, index] = await Promise.all([loadEmbedder(), loadIndex()]);
  const embedded = await embedder(query, { pooling: "mean", normalize: true });
  const queryVec = embedded.data;

  const scored: RetrievalHit[] = index.chunks.map((chunk) => ({
    chunk,
    score: cosine(queryVec, chunk.vec),
  }));
  scored.sort((a, b) => b.score - a.score);
  const hits = scored.slice(0, RETRIEVAL_TOP_K);
  const topScore = hits[0]?.score ?? 0;

  const passesSemantic = topScore >= SCOPE_THRESHOLD;
  const namedElsewhere = containsOtherPersonName(query);
  return {
    hits,
    topScore,
    inScope: passesSemantic && !namedElsewhere,
  };
}

/**
 * Compose a system prompt + user message for the LLM given retrieval hits.
 *
 * Layout choices tuned for small (1B) instruction-tuned models:
 *   - System prompt is short and leans toward *answering* — small models
 *     over-refuse under strict "only if in context" instructions.
 *   - Context and question are packed together in the user message. Small
 *     models weight tokens near the end of the prompt more, so putting the
 *     context right next to the question improves grounding.
 *   - Numbered snippets make it easy for the model to attribute mentally.
 */
export function buildPromptMessages(query: string, hits: RetrievalHit[]) {
  const context = hits.map((h, i) => `[${i + 1}] ${h.chunk.body}`).join("\n\n");

  const system =
    "You are a concise assistant answering questions about Sujata Chaudhury. " +
    "Use the CONTEXT snippets to answer. If the answer is directly stated or clearly implied by any snippet, give it. " +
    "Only reply \"I don't know\" if none of the snippets touch on the question. " +
    "Speak about Sujata in the third person. Keep answers under 100 words.";

  const userMessage =
    `CONTEXT:\n${context}\n\n` +
    `Answer the following question using only the CONTEXT above. Be direct.\n\n` +
    `Question: ${query}`;

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: userMessage },
  ];
}

export const REFUSAL_MESSAGE =
  "I only answer questions about Sujata's background, work, and projects. Try asking about her experience at Optum, her research, or her Master's at Tampere.";
