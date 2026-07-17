import { activeLocales, isLocale, type Locale } from "./config";

/**
 * Locale-preference persistence — single source of truth for the storage key
 * and validation. LocaleRedirect and LangSwitcher both call these so the
 * key can't drift and stored garbage (from a removed locale) can't slip
 * through the read path.
 *
 * SSR-safe: every helper no-ops on the server. Never throws.
 */
const STORAGE_KEY = "preferredLocale";

export function readPreferredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    if (!isLocale(raw)) return null;
    if (!activeLocales.includes(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

export function writePreferredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Storage may be blocked (private mode, quota, disabled) — degrade silently.
  }
}
