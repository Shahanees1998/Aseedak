'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, defaultLocale, createTranslationFunction, isRTL, getDirection } from '../lib/i18n';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  // Load saved locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'ar')) {
      setLocale(savedLocale);
    } else {
      // Default to English
      setLocale('en');
      localStorage.setItem('locale', 'en');
    }
  }, []);

  // Save locale to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('locale', locale);
  }, [locale]);

  const t = createTranslationFunction(locale);

  const value: LocaleContextType = {
    locale,
    setLocale,
    t,
    isRTL: isRTL(locale),
    direction: getDirection(locale),
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = (): LocaleContextType => {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
