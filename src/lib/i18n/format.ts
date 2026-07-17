import IntlMessageFormat from "intl-messageformat";
import type { Locale } from "./config";
import type { Messages } from "./loader";

/**
 * createTranslator — ICU MessageFormat renderer.
 *
 *   const t = createTranslator("en", messages);
 *   t("landing.summary", { years: 3 })
 *   // "Computer Vision engineer with 3 years of industry experience..."
 *
 * Handles plural, select, number, and date formatting per CLDR data for the
 * requested locale. Missing keys return the key itself as a visible
 * translation-debt marker (rather than empty or throwing).
 */
export type TranslateFn = (key: string, values?: Record<string, string | number | Date>) => string;

const cache = new Map<string, IntlMessageFormat>();

/**
 * Machine-translation review marker. Strings produced by translate-locales
 * are stored on disk prefixed with "[mt] " so unreviewed copy is greppable
 * in source. The prefix is stripped at render time so users never see it.
 */
const MT_PREFIX = "[mt] ";

function stripMtPrefix(value: string): string {
  return value.startsWith(MT_PREFIX) ? value.slice(MT_PREFIX.length) : value;
}

export function createTranslator(locale: Locale, messages: Messages): TranslateFn {
  return (key, values) => {
    const rawValue = messages[key];
    if (!rawValue) return key;
    const raw = stripMtPrefix(rawValue);
    // Fast path: no ICU syntax, skip parser.
    if (!raw.includes("{")) return raw;

    const cacheKey = `${locale}::${key}::${raw}`;
    let formatter = cache.get(cacheKey);
    if (!formatter) {
      formatter = new IntlMessageFormat(raw, locale, undefined, { ignoreTag: true });
      cache.set(cacheKey, formatter);
    }
    return formatter.format(values ?? {}) as string;
  };
}
