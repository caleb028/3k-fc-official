'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, t as translateKey } from '@/lib/i18n';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key: string) => translateKey(key, 'en'),
});

export function LanguageProvider({
  children,
  initialLocale = 'en',
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('3kfc_locale') : null;
    if (saved === 'en' || saved === 'sw') {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('3kfc_locale', next);
      document.cookie = `3kfc_locale=${next}; path=/; max-age=31536000; SameSite=Lax`;
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t: (key: string) => translateKey(key, locale),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
