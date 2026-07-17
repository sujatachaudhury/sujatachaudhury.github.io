"use client";

import { useEffect } from "react";
import { activeLocales, defaultLocale } from "@/lib/i18n/config";
import { negotiateFromNavigator } from "@/lib/i18n/resolveLocale";
import { readPreferredLocale } from "@/lib/i18n/preference";

/**
 * Client-side language negotiation. Runs once on mount at the root path.
 * Preferences, in order:
 *   1. localStorage("preferredLocale") — set by the LangSwitcher.
 *   2. navigator.languages (BCP-47 chain) matched against activeLocales.
 *   3. defaultLocale.
 *
 * Uses window.location.replace to avoid polluting history.
 */
export function LocaleRedirect() {
  useEffect(() => {
    const stored = readPreferredLocale();
    if (stored) {
      window.location.replace(`/${stored}/`);
      return;
    }

    const langs = navigator.languages ?? [navigator.language];
    const resolved = negotiateFromNavigator(langs);
    const target = activeLocales.includes(resolved) ? resolved : defaultLocale;
    window.location.replace(`/${target}/`);
  }, []);
  return null;
}
