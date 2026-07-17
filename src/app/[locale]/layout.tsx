import { notFound } from "next/navigation";
import {
  activeLocales,
  createTranslator,
  isLocale,
  loadMessages,
  localeMeta,
  type Locale,
} from "@/lib/i18n";
import { buildNavItems } from "@/lib/i18n/nav";
import {
  Container,
  Footer,
  Header,
  LangSwitcher,
  PageShell,
  SkipLink,
  ThemeToggle,
  type LangOption,
} from "@/components/layout";
import { profile } from "@/content/profile";
import { LabsChat } from "@/components/labs/LabsChat";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return activeLocales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale) || !activeLocales.includes(locale)) notFound();

  const messages = await loadMessages(locale, ["common", "labs"]);
  const t = createTranslator(locale, messages);
  const navItems = buildNavItems(locale, t);

  const labsStrings = {
    dotPrimary: t("chat.dot.primary"),
    dotMeta: t("chat.dot.meta"),
    dotAria: t("chat.dot.aria"),
    panelTitle: t("chat.panel.title"),
    panelMeta: t("chat.panel.meta"),
    disclosureIntro: t("chat.disclosure.intro"),
    disclosureLines: [
      t("chat.disclosure.line.download"),
      t("chat.disclosure.line.webgpu"),
      t("chat.disclosure.line.accuracy"),
      t("chat.disclosure.line.voice"),
    ],
    disclosureStart: t("chat.disclosure.start"),
    disclosureDismiss: t("chat.disclosure.dismiss"),
    seed: t("chat.seed"),
    refusal: t("chat.refusal"),
    labelUser: t("chat.label.user"),
    labelAssistant: t("chat.label.assistant"),
    inputPlaceholder: t("chat.input.placeholder"),
    sendLabel: t("chat.action.send"),
    expandLabel: t("chat.action.expand"),
    collapseLabel: t("chat.action.collapse"),
    closeLabel: t("chat.action.close"),
    overflowHint: t("chat.action.overflow"),
    voiceLabelOn: t("chat.voice.on"),
    voiceLabelOff: t("chat.voice.off"),
    voiceIdle: t("chat.voice.state.idle"),
    voiceListening: t("chat.voice.state.listening"),
    voiceThinking: t("chat.voice.state.thinking"),
    voiceSpeaking: t("chat.voice.state.speaking"),
    voiceError: t("chat.voice.state.error"),
    voiceOrbLabel: t("chat.voice.orbLabel"),
    voiceBackToChat: t("chat.voice.backToChat"),
    progressReady: t("chat.progress.ready"),
    webgpuMissing: t("chat.webgpuMissing"),
  };

  const langOptions: LangOption[] = activeLocales.map((code) => ({
    code,
    label: localeMeta[code].label,
    native: localeMeta[code].native,
  }));

  const year = new Date().getFullYear();

  return (
    <>
      <SkipLink label={t("a11y.skip")} />
      <PageShell
        header={
          <Header
            brand={t("site.name")}
            locale={locale}
            homeHref={`/${locale}/`}
            items={navItems}
            currentPath="/"
            controls={
              <>
                <LangSwitcher current={locale} options={langOptions} ariaLabel={t("a11y.langSwitcher")} />
                <ThemeToggle labelLight={t("a11y.themeLight")} labelDark={t("a11y.themeDark")} />
              </>
            }
          />
        }
        footer={
          <Footer
            name={t("site.name")}
            tagline={t("footer.tagline")}
            colophon={t("footer.colophon", { year })}
            links={[
              { href: `mailto:${profile.email}`, label: t("footer.links.email") },
              { href: profile.urls.linkedin, label: t("footer.links.linkedin"), external: true },
              { href: profile.urls.github, label: t("footer.links.github"), external: true },
            ]}
          />
        }
      >
        <Container>{children}</Container>
      </PageShell>
      <LabsChat strings={labsStrings} />
      <LocaleHtmlLang locale={locale} />
    </>
  );
}

// The root <html lang> is set on <html> element in root layout ("en") and
// updated via a small script here so screen readers reflect the actual page
// locale without needing a per-route root layout.
function LocaleHtmlLang({ locale }: { locale: Locale }) {
  const bcp47 = localeMeta[locale].bcp47;
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.lang=${JSON.stringify(bcp47)};document.documentElement.dir=${JSON.stringify(
          localeMeta[locale].direction,
        )};`,
      }}
    />
  );
}
