import enMessages from '../messages/en.json';
import arMessages from '../messages/ar.json';

export type Locale = 'en' | 'ar';

export const messages = {
  en: enMessages,
  ar: arMessages,
};

export const defaultLocale: Locale = 'en';

export const locales: Locale[] = ['en', 'ar'];

export const localeNames = {
  en: 'English',
  ar: 'العربية',
};

export const localeFlags = {
  en: '🇺🇸',
  ar: '🇸🇦',
};

export const isRTL = (locale: Locale): boolean => {
  return locale === 'ar';
};

export const getDirection = (locale: Locale): 'ltr' | 'rtl' => {
  return isRTL(locale) ? 'rtl' : 'ltr';
};

export const getOppositeLocale = (locale: Locale): Locale => {
  return locale === 'en' ? 'ar' : 'en';
};

export const getNestedValue = (obj: any, path: string): string => {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
};

export const createTranslationFunction = (locale: Locale) => {
  const t = (key: string, params?: Record<string, string | number>): string => {
    const message = getNestedValue(messages[locale], key);
    
    if (params) {
      return message.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }
    
    return message;
  };

  return t;
};

export const getStaticProps = async (locale: Locale) => {
  return {
    props: {
      messages: messages[locale],
    },
  };
};

export const getStaticPaths = () => {
  return {
    paths: locales.map((locale) => ({ params: { locale } })),
    fallback: false,
  };
};
