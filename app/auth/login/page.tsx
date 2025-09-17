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
      <div className="min-h-screen bg-black flex justify-content-center align-items-center" style={{backgroundColor:'black'}}>
        <div className="border-1 surface-border surface-card border-round py-7 px-4 md:px-7 z-1">
          <div className="mb-4">
            <div style={{ display: 'flex', alignItems: 'center' }} className="w-full bg-white flex items-center justify-content-center gap-3">
              <Image className='bg-white' src="/images/logo.png" alt="Aseedak" width={100} height={100} />
            </div>
            <div className="text-900 text-3xl font-bold mb-2 mt-4">
              Welcome Back
            </div>
            <span className="text-600 font-medium text-lg">
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
              <InputText
                id="email"
                type="email"
                className="w-full md:w-25rem text-lg"
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
                inputClassName="w-full md:w-25rem text-lg"
                required
              />
            </div>

            <div className="mb-4 flex flex-wrap gap-3 align-items-center">
              <a
                className="text-600 cursor-pointer hover:text-primary ml-auto transition-colors transition-duration-300 text-lg"
                onClick={() => router.push('/auth/forgot-password')}
              >
                Forgot password?
              </a>
            </div>

            <Button
              label={loading ? "Signing In..." : "Sign In"}
              className="w-full text-lg"
              onClick={handleSubmit}
              loading={loading}
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </>
  )
}