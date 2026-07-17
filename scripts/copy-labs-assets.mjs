#!/usr/bin/env node
/**
 * copy-labs-assets.mjs — stages runtime files that live inside node_modules
 * but need to be reachable at fixed URLs from the deployed site.
 *
 * Currently:
 *   - @ricky0123/vad-web ONNX weights + audio worklet
 *   - onnxruntime-web WASM binaries (needed by vad-web at runtime)
 *
 * Output goes into public/labs/vad/, which is copied into the export as-is.
 * The client is configured to look here via the `baseAssetPath` /
 * `onnxWASMBasePath` options in scripts using MicVAD.
 *
 * Run after `npm install` (via npm's `postinstall` hook), before every build,
 * and any time you upgrade @ricky0123/vad-web or onnxruntime-web.
 */
import { copyFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const VAD_SRC = path.join(REPO_ROOT, "node_modules", "@ricky0123", "vad-web", "dist");
const ORT_SRC = path.join(REPO_ROOT, "node_modules", "onnxruntime-web", "dist");
const OUT = path.join(REPO_ROOT, "public", "labs", "vad");

const VAD_FILES = [
  "silero_vad_legacy.onnx",
  "silero_vad_v5.onnx",
  "vad.worklet.bundle.min.js",
];

async function copyMatching(dir, out, predicate) {
  const entries = await readdir(dir);
  const targets = entries.filter(predicate);
  for (const name of targets) {
    await copyFile(path.join(dir, name), path.join(out, name));
  }
  return targets;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  for (const name of VAD_FILES) {
    await copyFile(path.join(VAD_SRC, name), path.join(OUT, name));
  }

  // onnxruntime-web ships many builds; the vad-web worklet only needs the
  // simd-threaded WASM pair. Copy just those.
  const ortCopied = await copyMatching(ORT_SRC, OUT, (name) =>
    /^ort-wasm-simd-threaded(\.jsep)?\.(wasm|mjs)$/.test(name),
  );

  console.log(`Copied ${VAD_FILES.length} vad-web file(s) + ${ortCopied.length} onnxruntime-web file(s) → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
