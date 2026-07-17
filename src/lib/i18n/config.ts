/**
 * i18n configuration — single source of truth for locales.
 *
 * To add a new locale:
 *   1. Add its code to `locales` and a matching entry to `localeMeta`.
 *   2. Create `public/locales/{code}/*.json` mirroring en/.
 *   3. Ship. No component changes needed.
 */

export const locales = ["en", "fi", "hi", "it", "de"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/**
 * Locales the site is *ready to serve now*. Others exist in config for future
 * scaffolding but are hidden from routing and the language switcher until
 * their bundles are translated.
 */
export const activeLocales: readonly Locale[] = ["en", "fi"] as const;

export interface LocaleMetadata {
  code: Locale;
  label: string;
  native: string;
  direction: "ltr" | "rtl";
  bcp47: string;
}

export const localeMeta: Record<Locale, LocaleMetadata> = {
  en: { code: "en", label: "English",  native: "English",   direction: "ltr", bcp47: "en" },
  fi: { code: "fi", label: "Finnish",  native: "Suomi",     direction: "ltr", bcp47: "fi" },
  hi: { code: "hi", label: "Hindi",    native: "हिन्दी",       direction: "ltr", bcp47: "hi" },
  it: { code: "it", label: "Italian",  native: "Italiano",  direction: "ltr", bcp47: "it" },
  de: { code: "de", label: "German",   native: "Deutsch",   direction: "ltr", bcp47: "de" },
};

export const namespaces = ["common", "landing", "work", "projects"] as const;
export type Namespace = (typeof namespaces)[number];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
