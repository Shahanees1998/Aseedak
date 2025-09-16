'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Card } from 'primereact/card'
import { Message } from 'primereact/message'
import { Checkbox } from 'primereact/checkbox'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: authLoading, login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already logged in
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (user) {
    // Redirect based on user role instead of always going to dashboard
    if (user.role === 'ADMIN') {
      router.push('/admin')
    } else {
      router.push('/create-room')
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(formData.email, formData.password)
      // Login successful, redirect to dashboard which will handle role-based routing
      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('An error occurred. Please try again.')
      }
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
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1600 800"
        className="fixed left-0 top-0 min-h-screen min-w-screen"
        preserveAspectRatio="none"
      >
        <rect
          fill="var(--primary-900)"
          width="1600"
          height="800"
        />
        <path
          fill="var(--primary-800)"
          d="M478.4 581c3.2 0.8 6.4 1.7 9.5 2.5c196.2 52.5 388.7 133.5 593.5 176.6c174.2 36.6 349.5 29.2 518.6-10.2V0H0v574.9c52.3-17.6 106.5-27.7 161.1-30.9C268.4 537.4 375.7 554.2 478.4 581z"
        />
        <path
          fill="var(--primary-700)"
          d="M181.8 259.4c98.2 6 191.9 35.2 281.3 72.1c2.8 1.1 5.5 2.3 8.3 3.4c171 71.6 342.7 158.5 531.3 207.7c198.8 51.8 403.4 40.8 597.3-14.8V0H0v283.2C59 263.6 120.6 255.7 181.8 259.4z"
        />
        <path
          fill="var(--primary-600)"
          d="M454.9 86.3C600.7 177 751.6 269.3 924.1 325c208.6 67.4 431.3 60.8 637.9-5.3c12.8-4.1 25.4-8.4 38.1-12.9V0H288.1c56 21.3 108.7 50.6 159.7 82C450.2 83.4 452.5 84.9 454.9 86.3z"
        />
        <path
          fill="var(--primary-500)"
          d="M1397.5 154.8c47.2-10.6 93.6-25.3 138.6-43.8c21.7-8.9 43-18.8 63.9-29.5V0H643.4c62.9 41.7 129.7 78.2 202.1 107.4C1020.4 178.1 1214.2 196.1 1397.5 154.8z"
        />
      </svg>
      <div className="min-h-screen flex justify-content-center align-items-center">
        <div className="border-1 surface-border surface-card border-round py-7 px-4 md:px-7 z-1">
          <div className="mb-4">
            <div style={{ display: 'flex', alignItems: 'center' }} className="app-logo flex items-center justify-content-center gap-3">
              <Image src="/images/logo.png" alt="Aseedak" width={100} height={100} />
              <div style={{ fontSize: '2rem' }}>|</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontStyle: 'italic' }}>Aseedak</div>
            </div>
            <div className="text-900 text-xl font-bold mb-2 mt-4">
              Welcome Back
            </div>
            <span className="text-600 font-medium">
              Sign in to continue your word elimination journey
            </span>
          </div>

          <div className="flex flex-column">
            {/* Error Message */}
            {error && (
              <div className="p-error mb-3 p-3 border-round" style={{ background: 'var(--red-50)', border: '1px solid var(--red-200)' }}>
                {error}
              </div>
            )}

            <span className="p-input-icon-left w-full mb-4">
              <i className="pi pi-envelope"></i>
              <InputText
                id="email"
                type="email"
                className="w-full md:w-25rem"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={loading}
                required
              />
            </span>

            <div style={{ position: "relative" }} className="w-full mb-4">
              <Password
                id="password"
                className="w-full"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                toggleMask
                inputClassName="w-full md:w-25rem"
                required
              />
            </div>

            <div className="mb-4 flex flex-wrap gap-3 align-items-center">
              <a
                className="text-600 cursor-pointer hover:text-primary ml-auto transition-colors transition-duration-300"
                onClick={() => router.push('/auth/forgot-password')}
              >
                Forgot password?
              </a>
            </div>

            <Button
              label={loading ? "Signing In..." : "Sign In"}
              className="w-full"
              onClick={handleSubmit}
              loading={loading}
              disabled={loading}
            />
          </div>


          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <p className="text-600">
              Don't have an account?{' '}
              <Link 
                href="/auth/register" 
                className="text-primary hover:text-primary-600 font-medium cursor-pointer"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}