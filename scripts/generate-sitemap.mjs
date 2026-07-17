#!/usr/bin/env node
/**
 * generate-sitemap.mjs — postbuild step. Writes dist/sitemap.xml with one URL
 * per (locale, route) pair plus hreflang alternates.
 *
 * Locales come from src/lib/i18n/config.ts#activeLocales so the sitemap can't
 * drift from what the site actually serves. Adding a page is still a
 * one-line change to the `routes` array below.
 */
import { readActiveLocales } from "./lib/locales.mjs";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const SITE = "https://sujatachaudhury.github.io";
const activeLocales = await readActiveLocales();
const routes = ["", "work", "projects"];

const urls = activeLocales.flatMap((locale) =>
  routes.map((route) => {
    const loc = `${SITE}/${locale}${route ? `/${route}` : ""}/`;
    const alternates = activeLocales
      .map(
        (alt) =>
          `    <xhtml:link rel="alternate" hreflang="${alt}" href="${SITE}/${alt}${route ? `/${route}` : ""}/" />`,
      )
      .join("\n");
    return `  <url>
    <loc>${loc}</loc>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/${activeLocales[0]}${route ? `/${route}` : ""}/" />
  </url>`;
  }),
);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;

const out = path.join(process.cwd(), "dist", "sitemap.xml");
await writeFile(out, xml, "utf8");
console.log(`Wrote ${out}`);
