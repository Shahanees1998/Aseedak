'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Card } from 'primereact/card'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { Checkbox } from 'primereact/checkbox'
import { Message } from 'primereact/message'
import Link from 'next/link'

const difficultyOptions = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' }
]

const categoryOptions = [
  { label: 'All Categories', value: 'all' },
  { label: 'Animals', value: 'animals' },
  { label: 'Food', value: 'food' },
  { label: 'Objects', value: 'objects' },
  { label: 'Places', value: 'places' },
  { label: 'Actions', value: 'actions' },
  { label: 'Colors', value: 'colors' }
]

export default function CreateRoomPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    maxPlayers: 8,
    difficulty: 'easy',
    category: 'all',
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
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/game/${data.room.code}`)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to create room')
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

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20">
          <div className="p-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Login Required</h1>
            <p className="text-gray-300 mb-6">
              You need to be logged in to create a game room.
            </p>
            <div className="space-y-3">
              <Link href="/auth/login">
                <Button label="Sign In" className="w-full p-button-primary" />
              </Link>
              <Link href="/auth/register">
                <Button label="Sign Up" className="w-full p-button-outlined p-button-secondary" />
              </Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Create Game Room</h1>
          <p className="text-gray-300">Set up your word elimination game</p>
        </div>

        {/* Error Message */}
        {error && (
          <Message 
            severity="error" 
            text={error} 
            className="mb-6"
          />
        )}

        {/* Create Room Form */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white mb-2">Room Name</label>
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
                  <label className="block text-white mb-2">Max Players</label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2">Difficulty</label>
                  <Dropdown
                    value={formData.difficulty}
                    onChange={(e) => handleInputChange('difficulty', e.value)}
                    options={difficultyOptions}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Category</label>
                  <Dropdown
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.value)}
                    options={categoryOptions}
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
                    label="Cancel"
                    className="w-full p-button-outlined p-button-secondary"
                  />
                </Link>
                <Button
                  type="submit"
                  label="Create Room"
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
              <li>• Game starts when room reaches max players</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}
