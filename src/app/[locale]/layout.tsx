import { TranslationProvider } from "@/i18n/useTranslation";
import { LocalizationProps, type Locale } from "@/i18n";
import { Navigation } from "@/components";

export interface LocaleLayoutProps extends LocalizationProps {
  children: React.ReactNode;
}

export default async function LocaleLayout(props: LocaleLayoutProps) {
  const { locale } = await props.params;
  
  return (
    <TranslationProvider locale={locale as Locale}>
      <Navigation locale={locale as Locale} />
      {props.children}
    </TranslationProvider>
  );
}