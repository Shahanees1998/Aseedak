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
import Image from 'next/image'


export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
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
    <>
      <div className="min-h-screen bg-black flex justify-content-center align-items-center" style={{backgroundColor:'black'}}>
        <div className="border-1 surface-border surface-card border-round py-7 px-4 md:px-7 z-1">
          <div className="mb-4">
            <div style={{ display: 'flex', alignItems: 'center' }} className="w-full bg-white flex items-center justify-content-center gap-3">
              <Image className='bg-white' src="/images/logo.png" alt="Aseedak" width={100} height={100} />
            </div>
            <div className="text-900 text-3xl font-bold mb-2 mt-4">
              Join Aseedak
            </div>
            <span className="text-600 font-medium text-lg">
              Create your account and start playing
            </span>
          </div>

          <div className="flex flex-column">
            {/* Error Message */}
            {error && (
              <div className="p-error mb-3 p-3 border-round" style={{ background: 'var(--red-50)', border: '1px solid var(--red-200)' }}>
                {error}
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit}>
              <div className="flex gap-3 mb-4">
                <span className="p-input-icon-left flex-1">
                  <InputText
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="First Name"
                    className="w-full text-lg"
                    required
                  />
                </span>
                <span className="p-input-icon-left flex-1">
                  <InputText
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Last Name"
                    className="w-full text-lg"
                    required
                  />
                </span>
              </div>

              <div className="flex gap-3 mb-4">
                <span className="p-input-icon-left flex-1">
                  <InputText
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Username"
                    className="w-full text-lg"
                    required
                  />
                </span>
                <span className="p-input-icon-left flex-1">
                  <InputText
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="Phone Number (Optional)"
                    className="w-full text-lg"
                  />
                </span>
              </div>

              <span className="p-input-icon-left w-full mb-4">
                <InputText
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Email"
                  className="w-full text-lg"
                  required
                />
              </span>

              <div className="flex gap-3 mb-4">
                <div style={{ position: "relative" }} className="flex-1">
                  <Password
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Password"
                    className="w-full"
                    inputClassName="w-full text-lg"
                    toggleMask
                    required
                  />
                </div>
                <div style={{ position: "relative" }} className="flex-1">
                  <Password
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full"
                    inputClassName="w-full text-lg"
                    toggleMask
                    required
                  />
                </div>
              </div>


              <Button
                type="submit"
                label={loading ? "Creating Account..." : "Create Account"}
                className="w-full text-lg"
                loading={loading}
                disabled={loading}
              />
            </form>
          </div>

          {/* Sign In Link */}
          <div className="text-center mt-6">
            <p className="text-600 text-lg">
              Already have an account?{' '}
              <Link 
                href="/auth/login" 
                className="text-primary hover:text-primary-600 font-medium cursor-pointer text-lg"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}