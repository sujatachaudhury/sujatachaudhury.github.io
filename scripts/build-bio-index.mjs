#!/usr/bin/env node
/**
 * build-bio-index.mjs — postbuild step for the labs chat feature.
 *
 * Reads src/content/bio.ts, embeds each chunk (body + queries) with a small
 * sentence transformer, and writes public/labs/bio-index.json. The client
 * fetches this on Start so it can do retrieval without re-running the
 * embedder for every chunk at page load.
 *
 * The client still needs to embed the *user's query* at runtime — same model
 * runs there. Baking the corpus vectors at build time is what keeps the
 * client hot path fast.
 *
 * Model: Xenova/all-MiniLM-L6-v2 — 384-dim, ~25MB q8, standard for retrieval
 * over short passages. Deterministic: same input string → same vector.
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const BIO_TS = path.join(REPO_ROOT, "src", "content", "bio.ts");
const OUT_DIR = path.join(REPO_ROOT, "public", "labs");
const OUT_FILE = path.join(OUT_DIR, "bio-index.json");

/**
 * Extract bio chunks from the .ts file without a TS runtime. The file is a
 * single const array of literals with a known shape; regex-parse is robust
 * enough and keeps the build tooling minimal.
 */
async function loadChunks() {
  const src = await readFile(BIO_TS, "utf8");
  const arrayMatch = src.match(/bioChunks: readonly BioChunk\[\] = \[([\s\S]*?)\n\];/);
  if (!arrayMatch) throw new Error("Could not locate bioChunks array in bio.ts");
  const body = arrayMatch[1];

  // Parse each { id, category, queries: [...], body } block.
  const chunks = [];
  const entryRe = /\{\s*id:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*queries:\s*\[([\s\S]*?)\],\s*body:\s*"([\s\S]*?)",?\s*\}/g;
  let m;
  while ((m = entryRe.exec(body)) !== null) {
    const [, id, category, queriesRaw, bodyText] = m;
    const queries = [...queriesRaw.matchAll(/"([^"]+)"/g)].map((q) => q[1]);
    chunks.push({ id, category, queries, body: bodyText.replace(/\\"/g, '"') });
  }
  if (chunks.length === 0) throw new Error("Parsed zero bio chunks — check the regex.");
  return chunks;
}

async function main() {
  const chunks = await loadChunks();
  console.log(`Embedding ${chunks.length} bio chunk(s) with all-MiniLM-L6-v2…`);

  const { pipeline, env } = await import("@huggingface/transformers");
  env.allowLocalModels = false;
  env.useBrowserCache = false;
  const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
    dtype: "q8",
  });

  const out = [];
  for (const chunk of chunks) {
    // Compose the embedding input: the queries (paraphrase seeds) plus the
    // body itself. This warms retrieval on paraphrased user prompts.
    const composite = [...chunk.queries, chunk.body].join(" \n ");
    const result = await embedder(composite, { pooling: "mean", normalize: true });
    const vec = Array.from(result.data);
    out.push({ id: chunk.id, category: chunk.category, body: chunk.body, vec });
  }

  await mkdir(OUT_DIR, { recursive: true });
  const payload = { model: "Xenova/all-MiniLM-L6-v2", dim: out[0].vec.length, chunks: out };
  await writeFile(OUT_FILE, JSON.stringify(payload) + "\n", "utf8");
  console.log(`Wrote ${OUT_FILE} (${out.length} chunks, ${payload.dim}-dim)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
