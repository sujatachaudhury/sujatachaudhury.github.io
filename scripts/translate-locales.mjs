#!/usr/bin/env node
/**
 * translate-locales — fills missing translations via the SMALL-100 model
 * (casawolice/small100-onnx) running under @xenova/transformers.
 *
 * Behavior:
 *   1. Reads every namespace file under public/locales/en/.
 *   2. For every locale in src/lib/i18n/config.ts#locales (not just active),
 *      compares against the source and identifies missing keys.
 *   3. Loads the model once, translates only missing values.
 *   4. Prefixes each machine-translated value with `[mt] ` so unreviewed copy
 *      is greppable. The runtime translator strips the prefix at render time
 *      (see src/lib/i18n/format.ts).
 *
 * ICU safety:
 *   Message bodies can contain ICU MessageFormat syntax like
 *   `{years, plural, one {# year} other {# years}}`. Feeding those raw to an
 *   MT model produces nonsense. We tokenize the value: braced spans and bare
 *   `{name}` placeholders are replaced with opaque sentinels of the form
 *   ⟪N⟫ before translation, then restored verbatim afterwards. Result: the
 *   MT model only sees prose; ICU structure is preserved byte-for-byte.
 *
 * First run downloads ~330MB to ~/.cache/huggingface/. Subsequent runs are
 * instant model-load and process only the missing keys.
 *
 * CLI:
 *   node scripts/translate-locales.mjs                # all non-en locales
 *   node scripts/translate-locales.mjs --locale fi    # single locale
 *   node scripts/translate-locales.mjs --all-locales  # include inactive ones
 *   node scripts/translate-locales.mjs --dry-run      # report, don't write
 */
import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  LOCALES_DIR,
  MT_PREFIX,
  SOURCE_LOCALE,
  listNamespaces,
  missingKeys,
  readNamespace,
} from "./lib/locales.mjs";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const DRY_RUN = flag("--dry-run");
const SINGLE_LOCALE = value("--locale");
const INCLUDE_INACTIVE = flag("--all-locales");

/**
 * SMALL-100 accepts a source token via prefix. Xenova's port uses the same
 * convention: set `src_lang` in tokenizer options; the model then generates
 * with the requested `tgt_lang`.
 */
/**
 * NLLB-200 uses BCP-47-with-script codes on the tokenizer's `src_lang` and
 * `tgt_lang`. Map our simple locale codes here. Add entries when a new locale
 * is added to config.ts.
 */
const NLLB_LANG = {
  en: "eng_Latn",
  fi: "fin_Latn",
  hi: "hin_Deva",
  it: "ita_Latn",
  de: "deu_Latn",
};

async function loadTranslator() {
  console.log("Loading translator (this may take a moment on first run)…");
  const { pipeline, env } = await import("@huggingface/transformers");
  env.allowLocalModels = false;
  env.useBrowserCache = false;
  const translator = await pipeline("translation", "Xenova/nllb-200-distilled-600M", {
    dtype: "q8",
  });
  return translator;
}

async function readLocalesFromConfig() {
  const configPath = path.resolve("src/lib/i18n/config.ts");
  const src = await readFile(configPath, "utf8");
  const match = src.match(/export const locales\s*=\s*\[([^\]]*)\]/);
  if (!match) throw new Error("Could not parse locales from config.ts");
  return match[1]
    .split(",")
    .map((s) => s.trim().replace(/["']/g, ""))
    .filter(Boolean);
}

async function readActiveFromConfig() {
  const configPath = path.resolve("src/lib/i18n/config.ts");
  const src = await readFile(configPath, "utf8");
  const match = src.match(/activeLocales\s*:\s*readonly\s+Locale\[\]\s*=\s*\[([^\]]*)\]/);
  if (!match) return [SOURCE_LOCALE];
  return match[1]
    .split(",")
    .map((s) => s.trim().replace(/["']/g, ""))
    .filter(Boolean);
}

/**
 * Tokenize ICU braced spans and bare {name} placeholders out of a string
 * before MT, and splice them back in afterwards. Returns { prose, restore }.
 *
 * The regex captures balanced-ish braces at one level of nesting — enough
 * for the ICU forms we use ({plural,…{#…}}). If deeper nesting is ever
 * needed, replace with a small hand-rolled scanner.
 */
function tokenizeICU(input) {
  const spans = [];
  // Match ICU braced spans: allow one nested pair inside.
  const re = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
  let prose = "";
  let last = 0;
  let m;
  while ((m = re.exec(input)) !== null) {
    prose += input.slice(last, m.index);
    // Uppercase ASCII sentinels survive sentencepiece tokenization intact.
    prose += ` XPLACEHOLDER${spans.length}X `;
    spans.push(m[0]);
    last = m.index + m[0].length;
  }
  prose += input.slice(last);
  return {
    prose: prose.replace(/\s+/g, " ").trim(),
    restore: (translated) =>
      translated.replace(/XPLACEHOLDER(\d+)X/gi, (_, i) => spans[Number(i)] ?? ""),
  };
}

async function translateBatch(translator, texts, targetLang) {
  const tgt = NLLB_LANG[targetLang];
  if (!tgt) throw new Error(`No NLLB mapping for locale "${targetLang}". Add it to NLLB_LANG.`);
  const outputs = [];
  for (const text of texts) {
    // Skip empty and pure-placeholder strings.
    if (!text || /^⟪\d+⟫$/.test(text.trim())) {
      outputs.push(text);
      continue;
    }
    const result = await translator(text, {
      src_lang: NLLB_LANG[SOURCE_LOCALE],
      tgt_lang: tgt,
    });
    const out = Array.isArray(result) ? result[0] : result;
    outputs.push(out.translation_text ?? out.generated_text ?? text);
  }
  return outputs;
}

async function main() {
  const allLocales = await readLocalesFromConfig();
  const active = await readActiveFromConfig();

  let targets = allLocales.filter((l) => l !== SOURCE_LOCALE);
  if (!INCLUDE_INACTIVE) targets = targets.filter((l) => active.includes(l));
  if (SINGLE_LOCALE) targets = [SINGLE_LOCALE];

  if (targets.length === 0) {
    console.log("No target locales to translate. Use --all-locales to include inactive ones.");
    return;
  }

  const namespaces = await listNamespaces(SOURCE_LOCALE);
  const workByLocale = new Map();

  for (const locale of targets) {
    for (const ns of namespaces) {
      const source = await readNamespace(SOURCE_LOCALE, ns);
      const target = await readNamespace(locale, ns);
      const missing = missingKeys(source, target);
      if (missing.length === 0) continue;
      if (!workByLocale.has(locale)) workByLocale.set(locale, []);
      workByLocale.get(locale).push({ ns, source, target, missing });
    }
  }

  const totalMissing = [...workByLocale.values()].flat().reduce((n, w) => n + w.missing.length, 0);
  if (totalMissing === 0) {
    console.log("All target locales already have every key. Nothing to do.");
    return;
  }

  console.log(
    `Found ${totalMissing} missing translation(s) across ${workByLocale.size} locale(s): ${[...workByLocale.keys()].join(", ")}`,
  );

  if (DRY_RUN) {
    for (const [locale, items] of workByLocale) {
      for (const { ns, missing } of items) {
        console.log(`  ${locale}/${ns}: ${missing.length} key(s)`);
      }
    }
    return;
  }

  const translator = await loadTranslator();

  for (const [locale, items] of workByLocale) {
    for (const { ns, source, target, missing } of items) {
      console.log(`\n→ ${locale}/${ns}.json  (${missing.length} key(s))`);
      const tokenized = missing.map((key) => tokenizeICU(source[key]));
      const translatedProse = await translateBatch(
        translator,
        tokenized.map((t) => t.prose),
        locale,
      );
      const updated = { ...target };
      missing.forEach((key, i) => {
        const restored = tokenized[i].restore(translatedProse[i]);
        updated[key] = `${MT_PREFIX}${restored}`;
      });

      const outDir = path.join(LOCALES_DIR, locale);
      await mkdir(outDir, { recursive: true });
      const outPath = path.join(outDir, `${ns}.json`);
      // Preserve source key order — walk the source, take target's value if present.
      const ordered = {};
      for (const key of Object.keys(source)) ordered[key] = updated[key] ?? source[key];
      // Preserve any target-only keys (e.g. locale-specific overrides).
      for (const key of Object.keys(updated)) if (!(key in ordered)) ordered[key] = updated[key];
      await writeFile(outPath, JSON.stringify(ordered, null, 2) + "\n", "utf8");
      console.log(`  wrote ${outPath}`);
    }
  }

  console.log(`\nDone. Review [mt]-prefixed strings in the modified JSON files before committing.`);
}

// Only run when invoked directly (not on import — makes the module testable).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
