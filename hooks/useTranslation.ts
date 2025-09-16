'use client';

import { useLocale } from '../contexts/LocaleContext';

export const useTranslation = () => {
  const { locale, setLocale, t, isRTL, direction } = useLocale();

  const changeLanguage = (newLocale: typeof locale) => {
    setLocale(newLocale);
  };

  return {
    t,
    locale,
    changeLanguage,
    isRTL,
    direction,
  };
};

export default useTranslation;
