import en from './locales/en.json';
import fi from './locales/fi.json';

export const locales = [
  'en',
  'fi'
] as const;
export type Locale = typeof locales[number];

export const translations = {
  en,
  fi,
};

export const defaultLocale: Locale = 'en';

export type LocalizationProps = { params: Promise<{ locale: string }> };

export function getTranslations(locale: Locale = defaultLocale) {
  return translations[locale] || translations[defaultLocale];
}

export async function getTranslationsFromProps(props: LocalizationProps) {
  return getTranslations((await props.params).locale as Locale);
}

