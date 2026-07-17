import { activeLocales, defaultLocale, isLocale, type Locale } from "./config";

/**
 * Best-effort match of a BCP-47 language tag against supported locales.
 * Falls through to defaultLocale if nothing matches.
 *
 * Chain:  exact match → primary subtag → default
 */
export function resolveLocale(candidate: string | undefined | null): Locale {
  if (!candidate) return defaultLocale;

  const tag = candidate.toLowerCase().split(",")[0]?.trim();
  if (!tag) return defaultLocale;

  if (isLocale(tag) && activeLocales.includes(tag)) return tag;

  const primary = tag.split("-")[0];
  if (isLocale(primary) && activeLocales.includes(primary)) return primary;

  return defaultLocale;
}

export function negotiateFromNavigator(langs: readonly string[]): Locale {
  for (const lang of langs) {
    const resolved = resolveLocale(lang);
    if (resolved !== defaultLocale) return resolved;
    const primary = lang.split("-")[0];
    if (activeLocales.includes(primary as Locale)) return primary as Locale;
  }
  return defaultLocale;
}
