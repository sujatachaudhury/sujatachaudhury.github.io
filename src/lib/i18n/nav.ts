import type { Locale } from "./config";
import type { TranslateFn } from "./format";

export interface NavRoute {
  href: string;
  labelKey: string;
  segment: string;
}

export const routes: NavRoute[] = [
  { href: "",         labelKey: "nav.home",     segment: "/" },
  { href: "work",     labelKey: "nav.work",     segment: "/work" },
  { href: "projects", labelKey: "nav.projects", segment: "/projects" },
];

export function buildNavItems(locale: Locale, t: TranslateFn) {
  return routes.map((r) => ({
    href: r.href ? `/${locale}/${r.href}` : `/${locale}/`,
    label: t(r.labelKey),
  }));
}
