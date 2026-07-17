/**
 * Shared helpers used by both translate-locales.mjs and check-locales.mjs.
 * Keep this file dependency-free (only Node built-ins) so `check-locales` can
 * run in the pre-commit hook without loading the ML runtime.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const MT_PREFIX = "[mt] ";
export const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
export const LOCALES_DIR = path.join(REPO_ROOT, "public", "locales");
export const SOURCE_LOCALE = "en";

/**
 * Read the i18n config's `activeLocales` list without importing the TS module.
 * We parse the file textually because scripts/ runs under plain Node and can't
 * consume TypeScript directly. Config is intentionally simple so this parse
 * stays robust: an array literal of string codes.
 */
export async function readActiveLocales() {
  const configPath = path.join(REPO_ROOT, "src", "lib", "i18n", "config.ts");
  const src = await readFile(configPath, "utf8");
  const match = src.match(/activeLocales\s*:\s*readonly\s+Locale\[\]\s*=\s*\[([^\]]*)\]/);
  if (!match) throw new Error("Could not parse activeLocales from config.ts");
  return match[1]
    .split(",")
    .map((s) => s.trim().replace(/["']/g, ""))
    .filter(Boolean);
}

export async function listNamespaces(locale) {
  const dir = path.join(LOCALES_DIR, locale);
  try {
    const files = await readdir(dir);
    return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
  } catch {
    return [];
  }
}

export async function readNamespace(locale, ns) {
  const p = path.join(LOCALES_DIR, locale, `${ns}.json`);
  try {
    const raw = await readFile(p, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Diff a target locale against the source. Returns keys that either don't
 * exist in the target or exist but are empty strings.
 */
export function missingKeys(source, target) {
  const missing = [];
  for (const key of Object.keys(source)) {
    const value = target[key];
    if (value === undefined || value === null || value === "") missing.push(key);
  }
  return missing;
}

export function toFileUrl(p) {
  return pathToFileURL(p).href;
}
