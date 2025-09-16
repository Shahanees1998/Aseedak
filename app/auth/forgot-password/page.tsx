'use client'

import { useState } from 'react'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Card } from 'primereact/card'
import { Message } from 'primereact/message'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        setMessage('Password reset link sent to your email!')
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to send reset email')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
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
              Forgot Password
            </div>
            <span className="text-600 font-medium text-lg">
              Enter your email to receive a reset link
            </span>
          </div>

          <div className="flex flex-column">
            {/* Success Message */}
            {message && (
              <div className="p-success mb-3 p-3 border-round" style={{ background: 'var(--green-50)', border: '1px solid var(--green-200)' }}>
                {message}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-error mb-3 p-3 border-round" style={{ background: 'var(--red-50)', border: '1px solid var(--red-200)' }}>
                {error}
              </div>
            )}

            {/* Reset Form */}
            <form onSubmit={handleSubmit}>
              <span className="p-input-icon-left w-full mb-4">
                <InputText
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full md:w-25rem text-lg"
                  required
                />
              </span>

              <Button
                type="submit"
                label={loading ? "Sending..." : "Send Reset Link"}
                className="w-full text-lg"
                loading={loading}
                disabled={loading}
              />
            </form>
          </div>

          {/* Back to Login */}
          <div className="text-center mt-6">
            <Link 
              href="/auth/login" 
              className="text-primary hover:text-primary-600 font-medium cursor-pointer text-lg"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
