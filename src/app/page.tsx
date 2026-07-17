import { activeLocales, defaultLocale, localeMeta } from "@/lib/i18n";
import { LocaleRedirect } from "@/components/i18n/LocaleRedirect";
import styles from "./page.module.css";

/**
 * Root landing (/). Emits a static page that:
 *   1. Advertises hreflang alternates so crawlers reach every locale directly.
 *   2. Runs client-side language negotiation and redirects to /{locale}/.
 *   3. Falls back to a plain list of locale links for no-JS clients.
 *
 * No middleware — this works entirely under `output: 'export'`.
 */
export default function RootPage() {
  return (
    <>
      <LocaleRedirect />
      <noscript>
        <meta httpEquiv="refresh" content={`0; url=/${defaultLocale}/`} />
      </noscript>
      <div className={styles.root}>
        <div>
          <h1 className={styles.title}>Sujata Chaudhury</h1>
          <p className={styles.body}>Choose a language.</p>
          <ul className={styles.links}>
            {activeLocales.map((code) => (
              <li key={code}>
                <a href={`/${code}/`}>{localeMeta[code].native}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

export const metadata = {
  alternates: {
    canonical: "/",
    languages: Object.fromEntries(
      activeLocales.map((code) => [localeMeta[code].bcp47, `/${code}/`]),
    ),
  },
};
