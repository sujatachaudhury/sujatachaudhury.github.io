import type { Metadata } from "next";
import Image from "next/image";
import {
  activeLocales,
  createTranslator,
  isLocale,
  loadMessages,
  localeMeta,
  type Locale,
} from "@/lib/i18n";
import { Section } from "@/components/layout";
import { Button, TextLink } from "@/components/primitives";
import { profile } from "@/content/profile";
import { PersonJsonLd, WebSiteJsonLd } from "@/lib/seo/jsonld";
import styles from "./landing.module.css";

export function generateStaticParams() {
  return activeLocales.map((locale) => ({ locale }));
}

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const messages = await loadMessages(locale, ["common", "landing"]);
  const t = createTranslator(locale, messages);
  return {
    title: t("site.name"),
    description: t("hero.summary", { years: profile.yearsOfIndustryExperience }),
    alternates: {
      canonical: `/${locale}/`,
      languages: Object.fromEntries(
        activeLocales.map((code) => [localeMeta[code].bcp47, `/${code}/`]),
      ),
    },
  };
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const messages = await loadMessages(locale as Locale, ["common", "landing"]);
  const t = createTranslator(locale as Locale, messages);

  return (
    <>
      <PersonJsonLd />
      <WebSiteJsonLd />
      <Section labelledBy="hero-title" className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroLead}>
            <p className={`eyebrow ${styles.eyebrow}`}>{t("hero.eyebrow")}</p>
            <h1 id="hero-title" className={styles.heroTitle}>
              {t("hero.title")}
            </h1>
          </div>
          <div className={styles.heroBody}>
            <p className={styles.heroSummary}>
              {t("hero.summary", { years: profile.yearsOfIndustryExperience })}
            </p>
            <div className={styles.heroCta}>
              <Button href={`mailto:${profile.email}`} size="lg">
                {t("hero.cta.primary")}
              </Button>
              <Button href={`/${locale}/work`} size="lg" variant="ghost">{t("hero.cta.secondary")}</Button>
            </div>
          </div>
          <figure className={styles.portrait}>
            <Image
              className={styles.portraitImage}
              src={profile.photo.src}
              alt={profile.photo.alt}
              width={800}
              height={1000}
              priority
              sizes="(max-width: 860px) 80vw, 360px"
            />
            <figcaption className={styles.portraitCaption}>
              {profile.location.city}, {profile.location.country}
            </figcaption>
          </figure>
        </div>
      </Section>

      <Section labelledBy="signals-title" className={styles.signals}>
        <p className="eyebrow">{t("signals.title")}</p>
        <div className={styles.signalGrid} role="list">
          <div className={styles.signalCard} role="listitem">
            <p className="eyebrow">{t("signals.education.eyebrow")}</p>
            <h3>{t("signals.education.title")}</h3>
            <p>{t("signals.education.body")}</p>
          </div>
          <div className={styles.signalCard} role="listitem">
            <p className="eyebrow">{t("signals.industry.eyebrow")}</p>
            <h3>{t("signals.industry.title")}</h3>
            <p>{t("signals.industry.body")}</p>
          </div>
          <div className={styles.signalCard} role="listitem">
            <p className="eyebrow">{t("signals.research.eyebrow")}</p>
            <h3>{t("signals.research.title")}</h3>
            <p>{t("signals.research.body")}</p>
          </div>
        </div>
      </Section>

      <Section labelledBy="focus-title" className={styles.focus}>
        <h2 id="focus-title">{t("focus.title")}</h2>
        <p className={styles.focusIntro}>{t("focus.intro")}</p>
        <ul className={styles.focusList} role="list">
          <li className={styles.focusItem}>
            <h3 className={styles.focusTitle}>{t("focus.items.cv.title")}</h3>
            <p className={styles.focusBody}>{t("focus.items.cv.body")}</p>
          </li>
          <li className={styles.focusItem}>
            <h3 className={styles.focusTitle}>{t("focus.items.ml.title")}</h3>
            <p className={styles.focusBody}>{t("focus.items.ml.body")}</p>
          </li>
          <li className={styles.focusItem}>
            <h3 className={styles.focusTitle}>{t("focus.items.systems.title")}</h3>
            <p className={styles.focusBody}>{t("focus.items.systems.body")}</p>
          </li>
        </ul>
      </Section>

      <Section labelledBy="contact-title" className={styles.contact}>
        <div className={styles.contactHead}>
          <p className="eyebrow">{t("contact.eyebrow")}</p>
          <div>
            <h2 id="contact-title">{t("contact.title")}</h2>
            <p>{t("contact.body")}</p>
          </div>
        </div>
        <dl className={styles.contactList}>
          <dt>{t("contact.email.label")}</dt>
          <dd>
            <TextLink href={`mailto:${profile.email}`}>{t("contact.email.value")}</TextLink>
          </dd>
          <dt>{t("contact.location.label")}</dt>
          <dd>{t("contact.location.value")}</dd>
        </dl>
      </Section>
    </>
  );
}
