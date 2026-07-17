import { readFile } from "node:fs/promises";
import path from "node:path";
import { defaultLocale, namespaces, type Locale, type Namespace } from "./config";

/**
 * loadMessages — server-only. Reads translation bundles from disk during
 * static generation. Never bundled into the client — the `node:fs` import
 * ensures webpack keeps this on the server side.
 *
 * Per-locale isolation: only the requested locale's bundles are read.
 * When a page renders /en, /fi bundles are never touched.
 *
 * Fallback: if a message is missing in the requested locale, the loader
 * merges in the defaultLocale bundle so keys never resolve to undefined.
 */
export type Messages = Record<string, string>;

async function readNamespace(locale: Locale, ns: Namespace): Promise<Messages> {
  const filePath = path.join(process.cwd(), "public", "locales", locale, `${ns}.json`);
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as Messages;
  } catch {
    return {};
  }
}

export async function loadMessages(
  locale: Locale,
  requested: readonly Namespace[] = namespaces,
): Promise<Messages> {
  const results = await Promise.all(
    requested.map(async (ns) => {
      const primary = await readNamespace(locale, ns);
      if (locale === defaultLocale) return primary;
      const fallback = await readNamespace(defaultLocale, ns);
      return { ...fallback, ...primary };
    }),
  );
  return Object.assign({}, ...results) as Messages;
}
