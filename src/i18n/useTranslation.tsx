'use client';

import { createContext, useContext, ReactNode } from 'react';
import { getTranslations, type Locale, defaultLocale } from './index';

type TranslationContextType = {
  t: ReturnType<typeof getTranslations>;
  locale: Locale;
};

const TranslationContext = createContext<TranslationContextType>({
  t: getTranslations(defaultLocale),
  locale: defaultLocale,
});

export function TranslationProvider({ 
  children, 
  locale = defaultLocale 
}: { 
  children: ReactNode; 
  locale?: Locale;
}) {
  const t = getTranslations(locale);
  
  return (
    <TranslationContext.Provider value={{ t, locale }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  return useContext(TranslationContext);
}