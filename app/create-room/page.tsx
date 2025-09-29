'use client'

import { useState, useEffect } from 'react'
import { useRequireAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Card } from 'primereact/card'
import { InputNumber } from 'primereact/inputnumber'
import { Checkbox } from 'primereact/checkbox'
import { Message } from 'primereact/message'
import { useToast } from '@/store/toast.context'
import { useTranslation } from '@/hooks/useTranslation'
import Link from 'next/link'



export default function CreateRoomPage() {
  const { user, loading: authLoading } = useRequireAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    maxPlayers: 8,
    timeLimit: 60,
    privateRoom: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/game-rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData
        })
      })

      if (response.ok) {
        const data = await response.json()
        showToast('success', 'Success', 'Room created successfully!')
        router.push(`/game/${data.room.code}`)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to create room')
        showToast('error', 'Error', errorData.message || 'Failed to create room')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
      showToast('error', 'Error', 'An error occurred. Please try again.')
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



  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // The useRequireAuth hook will handle redirecting to login if user is not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Create Game Room</h1>
          <p className="text-gray-300">Set up your word elimination game - anyone can join with the room code</p>
        </div>

        {/* Error Message */}
        {error && (
          <Message 
            severity="error" 
            text={error} 
            className="mb-6"
          />
        )}

        {/* Room Creation Form */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white mb-2">{t('game.createRoom.roomName')}</label>
                <InputText
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter room name"
                  className="w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2">{t('game.createRoom.maxPlayers')}</label>
                  <InputNumber
                    value={formData.maxPlayers}
                    onValueChange={(e) => handleInputChange('maxPlayers', e.value)}
                    min={2}
                    max={8}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Time Limit (seconds)</label>
                  <InputNumber
                    value={formData.timeLimit}
                    onValueChange={(e) => handleInputChange('timeLimit', e.value)}
                    min={30}
                    max={300}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <Checkbox
                  inputId="privateRoom"
                  checked={formData.privateRoom}
                  onChange={(e) => handleInputChange('privateRoom', e.checked)}
                />
                <label htmlFor="privateRoom" className="ml-2 text-white">
                  Private room (requires room code to join)
                </label>
              </div>

              <div className="flex space-x-4">
                <Link href="/" className="flex-1">
                  <Button
                    label={t('common.cancel')}
                    className="w-full p-button-outlined p-button-secondary"
                  />
                </Link>
                <Button
                  type="submit"
                  label={t('game.createRoom.createRoom')}
                  loading={loading}
                  className="flex-1 p-button-primary"
                />
              </div>
            </form>
          </div>
        </Card>

        {/* Game Rules */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 mt-8">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Game Rules</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Each player gets 3 words and a target to eliminate</li>
              <li>• Guess words to eliminate your target</li>
              <li>• Target confirms if the guess is correct</li>
              <li>• Eliminated player's target becomes yours</li>
              <li>• Last player standing wins!</li>
              <li>• Anyone can join with the room code until it's full</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}
