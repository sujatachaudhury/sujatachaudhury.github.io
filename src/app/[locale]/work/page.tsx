import type { Metadata } from "next";
import {
  activeLocales,
  createTranslator,
  isLocale,
  loadMessages,
  localeMeta,
  type Locale,
  type TranslateFn,
} from "@/lib/i18n";
import { TextLink } from "@/components/primitives";
import { roles, degrees, publications } from "@/content/work";
import styles from "./work.module.css";

export function generateStaticParams() {
  return activeLocales.map((locale) => ({ locale }));
}

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const messages = await loadMessages(locale, ["work"]);
  const t = createTranslator(locale, messages);
  return {
    title: t("page.title"),
    description: t("page.summary"),
    alternates: {
      canonical: `/${locale}/work/`,
      languages: Object.fromEntries(
        activeLocales.map((code) => [localeMeta[code].bcp47, `/${code}/work/`]),
      ),
    },
  };
}

function formatDateRange(locale: string, start: string, end: string | null, t: TranslateFn) {
  const fmt = new Intl.DateTimeFormat(locale, { year: "numeric", month: "short" });
  const s = fmt.format(new Date(start));
  const e = end ? fmt.format(new Date(end)) : t("present");
  return `${s} — ${e}`;
}

export default async function WorkPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const messages = await loadMessages(locale as Locale, ["work"]);
  const t = createTranslator(locale as Locale, messages);

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("page.title")}</h1>
        <p className={styles.summary}>{t("page.summary")}</p>
      </header>

      <section className={styles.section} aria-labelledby="section-experience">
        <div className={styles.sectionHead}>
          <span className={styles.label}>01 · {t("meta.role")}</span>
          <h2 id="section-experience">{t("sections.experience")}</h2>
        </div>
        {roles.map((role) => (
          <article key={role.id} className={styles.entry}>
            <div className={styles.entryDate}>{formatDateRange(locale, role.start, role.end, t)}</div>
            <div className={styles.entryBody}>
              <h3>{t(`${role.key}.title`)}</h3>
              <div className={styles.entryOrg}>
                {t(`${role.key}.org`)} · {t(`${role.key}.location`)}
              </div>
              <p className={styles.entrySummary}>{t(`${role.key}.summary`)}</p>
              {role.bulletCount > 0 && (
                <ul className={styles.bullets}>
                  {Array.from({ length: role.bulletCount }).map((_, i) => (
                    <li key={i}>{t(`${role.key}.bullets.${i}`)}</li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className={styles.section} aria-labelledby="section-education">
        <div className={styles.sectionHead}>
          <span className={styles.label}>02 · {t("meta.institution")}</span>
          <h2 id="section-education">{t("sections.education")}</h2>
        </div>
        {degrees.map((d) => (
          <article key={d.id} className={styles.entry}>
            <div className={styles.entryDate}>{formatDateRange(locale, d.start, d.end, t)}</div>
            <div className={styles.entryBody}>
              <h3>{t(`${d.key}.title`)}</h3>
              <div className={styles.entryOrg}>
                {t(`${d.key}.institution`)} · {t(`${d.key}.location`)}
              </div>
              {t(`${d.key}.summary`) !== `${d.key}.summary` && (
                <p className={styles.entrySummary}>{t(`${d.key}.summary`)}</p>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className={styles.section} aria-labelledby="section-publications">
        <div className={styles.sectionHead}>
          <span className={styles.label}>03 · {t("meta.publisher")}</span>
          <h2 id="section-publications">{t("sections.publications")}</h2>
        </div>
        {publications.map((pub) => (
          <article key={pub.id} className={styles.entry}>
            <div className={styles.entryDate}>{t(`${pub.key}.date`)}</div>
            <div className={styles.entryBody}>
              <h3>
                <TextLink href={pub.href} external plain>
                  {t(`${pub.key}.title`)}
                </TextLink>
              </h3>
              <div className={styles.entryOrg}>{t(`${pub.key}.authors`)}</div>
              <dl className={styles.pubMeta}>
                <dt>{t("meta.journal")}</dt>
                <dd>{t(`${pub.key}.venue`)}</dd>
                <dt>{t("meta.publisher")}</dt>
                <dd>{t(`${pub.key}.publisher`)}</dd>
                <dt>{t("meta.doi")}</dt>
                <dd>
                  <TextLink href={pub.href} external>
                    {t(`${pub.key}.doi`)}
                  </TextLink>
                </dd>
              </dl>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
