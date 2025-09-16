'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Card } from 'primereact/card'
import { Message } from 'primereact/message'
import { Dropdown } from 'primereact/dropdown'
import { Checkbox } from 'primereact/checkbox'
import Link from 'next/link'


export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password
        })
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
      } else {
        const data = await response.json()
        setError(data.message || 'Registration failed')
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
            <h1 className="text-3xl font-bold text-white mb-2">Join Aseedak</h1>
            <p className="text-gray-300">Create your account and start playing</p>
          </div>

          {/* Error Message */}
          {error && (
            <Message 
              severity="error" 
              text={error} 
              className="mb-4"
            />
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">First Name</label>
                <InputText
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="First name"
                  className="w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Last Name</label>
                <InputText
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Last name"
                  className="w-full"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white mb-2">Username</label>
              <InputText
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Choose a username"
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">Email</label>
              <InputText
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">Phone Number (Optional)</label>
              <InputText
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder="Enter your phone number"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-white mb-2">Password</label>
              <Password
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Create a password"
                className="w-full"
                inputClassName="w-full"
                toggleMask
                required
              />
            </div>

            <div>
              <label className="block text-white mb-2">Confirm Password</label>
              <Password
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                className="w-full"
                inputClassName="w-full"
                toggleMask
                required
              />
            </div>

            <div className="flex items-center">
              <Checkbox
                inputId="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={(e) => handleInputChange('agreeToTerms', e.checked)}
              />
              <label htmlFor="agreeToTerms" className="ml-2 text-white text-sm">
                I agree to the{' '}
                <Link href="/terms" className="hover:opacity-80" style={{ color: '#CB1122' }}>
                  Terms and Conditions
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              label="Create Account"
              loading={loading}
              className="w-full p-button-primary"
            />
          </form>

          {/* Sign In Link */}
          <div className="text-center mt-6">
            <p className="text-gray-300">
              Already have an account?{' '}
              <Link 
                href="/auth/login" 
                className="font-medium hover:opacity-80"
                style={{ color: '#CB1122' }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}