'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'

interface LanguageOption {
  label: string
  value: string
  flag: string
}

const languageOptions: LanguageOption[] = [
  { label: 'English', value: 'en', flag: '🇺🇸' },
  { label: 'العربية', value: 'ar', flag: '🇸🇦' }
]

export default function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const [loading, setLoading] = useState(false)

  const handleLanguageChange = async (newLocale: string) => {
    if (newLocale === locale) return

    setLoading(true)
    
    try {
      // Remove current locale from pathname
      const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
      
      // Navigate to new locale
      router.push(`/${newLocale}${pathWithoutLocale}`)
    } catch (error) {
      console.error('Language switch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedLanguage = languageOptions.find(option => option.value === locale) || languageOptions[0]

  return (
    <div className="language-switcher">
      <Dropdown
        value={selectedLanguage}
        options={languageOptions}
        onChange={(e) => handleLanguageChange(e.value.value)}
        optionLabel="label"
        optionValue="value"
        loading={loading}
        className="w-full"
        panelClassName="language-dropdown"
        itemTemplate={(option) => (
          <div className="flex items-center gap-2 p-2">
            <span className="text-lg">{option.flag}</span>
            <span>{option.label}</span>
          </div>
        )}
        valueTemplate={(option) => (
          <div className="flex items-center gap-2">
            <span className="text-lg">{option.flag}</span>
            <span>{option.label}</span>
          </div>
        )}
      />
    </div>
  )
}
