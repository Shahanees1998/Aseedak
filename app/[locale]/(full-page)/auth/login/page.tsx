'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Card } from 'primereact/card'
import { Message } from 'primereact/message'
import { Checkbox } from 'primereact/checkbox'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      })

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError(t('auth.login.invalidCredentials'))
        } else {
          setError(t('auth.login.verifyFirst'))
        }
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{t('auth.login.title')}</h1>
            <p className="text-gray-300">{t('auth.login.subtitle')}</p>
          </div>

          {/* Error Message */}
          {error && (
            <Message 
              severity="error" 
              text={error} 
              className="mb-4"
            />
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white mb-2">{t('auth.login.email')}</label>
              <InputText
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={t('auth.login.email')}
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">{t('auth.login.password')}</label>
              <Password
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder={t('auth.login.password')}
                className="w-full"
                inputClassName="w-full"
                toggleMask
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox
                  inputId="rememberMe"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.checked)}
                />
                <label htmlFor="rememberMe" className="ml-2 text-white">
                  {t('auth.login.rememberMe')}
                </label>
              </div>
              <div className="flex flex-col space-y-1">
                <Link 
                  href="/auth/forgot-password" 
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  {t('auth.login.forgotPassword')}
                </Link>
                <Link 
                  href="/auth/verify-email" 
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  {t('auth.login.verifyEmail')}
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              label={t('auth.login.signIn')}
              loading={loading}
              className="w-full p-button-primary"
            />
          </form>

          {/* Divider */}
          <div className="my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-300">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <Button
              label="Continue with Google"
              icon="pi pi-google"
              className="w-full p-button-outlined p-button-secondary"
              onClick={() => signIn('google')}
            />
          </div>

          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <p className="text-gray-300">
              {t('auth.login.noAccount')}{' '}
              <Link 
                href="/auth/register" 
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                {t('auth.login.signUp')}
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}