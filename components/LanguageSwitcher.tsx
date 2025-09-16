'use client';

import React from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useTranslation } from '../hooks/useTranslation';
import { Locale, localeNames, localeFlags } from '../lib/i18n';

interface LanguageSwitcherProps {
  variant?: 'button' | 'dropdown';
  showFlags?: boolean;
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  showFlags = true,
  className = '',
}) => {
  const { locale, changeLanguage } = useTranslation();

  const languageOptions = [
    { label: `${showFlags ? localeFlags.en + ' ' : ''}${localeNames.en}`, value: 'en' as Locale },
    { label: `${showFlags ? localeFlags.ar + ' ' : ''}${localeNames.ar}`, value: 'ar' as Locale },
  ];

  const handleLanguageChange = (newLocale: Locale) => {
    changeLanguage(newLocale);
  };

  if (variant === 'button') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {languageOptions.map((option) => (
          <Button
            key={option.value}
            label={option.label}
            size="small"
            severity={locale === option.value ? 'info' : 'secondary'}
            outlined={locale !== option.value}
            onClick={() => handleLanguageChange(option.value)}
            className="p-button-sm"
          />
        ))}
      </div>
    );
  }

  return (
    <Dropdown
      value={locale}
      options={languageOptions}
      onChange={(e) => handleLanguageChange(e.value)}
      placeholder="Select Language"
      className={`w-full ${className}`}
      style={{ minWidth: '150px' }}
    />
  );
};

export default LanguageSwitcher;
