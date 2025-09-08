import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import LanguageSwitcher from '@/components/LanguageSwitcher'

const locales = ['en', 'ar']

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) {
    notFound()
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            {/* Language Switcher */}
            <div className="fixed top-4 right-4 z-50">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                <LanguageSwitcher />
              </div>
            </div>
            {children}
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
