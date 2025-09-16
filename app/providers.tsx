'use client'

import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/hooks/useAuth'
import { ToastProvider } from '@/store/toast.context'
import { LocaleProvider } from '@/contexts/LocaleContext'
import ClientOnly from '@/components/ClientOnly'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <ClientOnly>
          <ToastProvider>
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </ToastProvider>
        </ClientOnly>
      </AuthProvider>
    </LocaleProvider>
  )
}
