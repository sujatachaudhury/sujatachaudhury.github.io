#!/usr/bin/env node
/**
 * check-locales — validator, no ML.
 *
 * Exits non-zero if any active non-source locale is missing keys that exist
 * in the source (en) namespaces. Used by the pre-commit hook to block commits
 * that would ship untranslated pages.
 *
 * Only enforces locales listed in `activeLocales` in src/lib/i18n/config.ts —
 * scaffolded-but-inactive locales don't gate commits.
 */
import { readActiveLocales, listNamespaces, readNamespace, missingKeys, SOURCE_LOCALE } from "./lib/locales.mjs";

const active = await readActiveLocales();
const targets = active.filter((l) => l !== SOURCE_LOCALE);

if (targets.length === 0) {
  console.log(`check-locales: only ${SOURCE_LOCALE} is active; nothing to enforce.`);
  process.exit(0);
}

const sourceNamespaces = await listNamespaces(SOURCE_LOCALE);
let hadFailure = false;

for (const locale of targets) {
  for (const ns of sourceNamespaces) {
    const source = await readNamespace(SOURCE_LOCALE, ns);
    const target = await readNamespace(locale, ns);
    const missing = missingKeys(source, target);
    if (missing.length > 0) {
      hadFailure = true;
      console.error(`\n  ✖ ${locale}/${ns}.json — ${missing.length} missing key(s):`);
      for (const key of missing) console.error(`      · ${key}`);
    }
  }
}

if (hadFailure) {
  console.error(`\ncheck-locales: missing translations. Run \`npm run translate\` and re-commit.\n`);
  process.exit(1);
}

console.log(`check-locales: all ${targets.length} active target locale(s) up to date.`);
