'use client'

import { useState } from 'react'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Card } from 'primereact/card'
import { Message } from 'primereact/message'
import Link from 'next/link'

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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Forgot Password</h1>
            <p className="text-gray-300">Enter your email to receive a reset link</p>
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

          {/* Reset Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white mb-2">Email</label>
              <InputText
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full"
                required
              />
            </div>

            <Button
              type="submit"
              label="Send Reset Link"
              loading={loading}
              className="w-full p-button-primary"
            />
          </form>

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
