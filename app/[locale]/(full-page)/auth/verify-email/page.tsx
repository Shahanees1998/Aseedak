'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Card } from 'primereact/card'
import { Message } from 'primereact/message'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp })
      })

      if (response.ok) {
        setMessage('Email verified successfully! Redirecting to login...')
        setTimeout(() => {
          router.push('/auth/login?message=Email verified successfully! Please sign in.')
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to verify email')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (!email.trim()) {
      setError('Please enter your email address first')
      return
    }

    setResendLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        setMessage('New OTP sent to your email!')
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to resend OTP')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
            <p className="text-gray-300">Enter the 6-digit code sent to your email</p>
          </div>

          {/* Success Message */}
          {message && (
            <Message 
              severity="success" 
              text={message} 
              className="mb-4"
            />
          )}

          {/* Error Message */}
          {error && (
            <Message 
              severity="error" 
              text={error} 
              className="mb-4"
            />
          )}

          {/* Verification Form */}
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-white mb-2">Email Address</label>
              <InputText
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">Verification Code</label>
              <InputText
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="w-full text-center text-2xl tracking-widest"
                maxLength={6}
                required
              />
            </div>

            <Button
              type="submit"
              label="Verify Email"
              loading={loading}
              className="w-full p-button-primary"
            />
          </form>

          {/* Resend OTP */}
          <div className="text-center mt-6">
            <p className="text-gray-300 mb-2">Didn't receive the code?</p>
            <Button
              label="Resend OTP"
              onClick={handleResendOTP}
              loading={resendLoading}
              className="p-button-outlined p-button-secondary"
            />
          </div>

          {/* Back to Login */}
          <div className="text-center mt-6">
            <Link 
              href="/auth/login" 
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
