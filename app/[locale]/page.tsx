'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Card } from 'primereact/card'
import { Divider } from 'primereact/divider'
import { Badge } from 'primereact/badge'
import AvatarDisplay from '@/components/AvatarDisplay'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const t = useTranslations()
  const [roomCode, setRoomCode] = useState('')

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      router.push(`/game/${roomCode}`)
    }
  }

  const handleCreateRoom = () => {
    router.push('/create-room')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <AvatarDisplay 
              avatarType="IMAGE1"
              size="large" 
              className="ring-4 ring-purple-500"
            />
            <h1 className="text-3xl font-bold text-white">{t('landing.title')}</h1>
          </div>
          <div className="flex space-x-4">
            <Link href="/auth/login">
              <Button label={t('auth.login.signIn')} className="p-button-outlined p-button-secondary" />
            </Link>
            <Link href="/auth/register">
              <Button label={t('auth.register.createAccount')} className="p-button-primary" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-6xl font-bold text-white mb-6">
            {t('landing.subtitle')}
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {t('landing.description')}
          </p>
        </div>

        {/* Game Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center bg-white/10 backdrop-blur-sm border-white/20">
            <div className="p-6">
              <AvatarDisplay 
                avatarType="IMAGE2"
                size="xlarge" 
                className="mb-4"
              />
              <h3 className="text-xl font-semibold text-white mb-2">Multiplayer Rooms</h3>
              <p className="text-gray-300">
                Create or join rooms with up to 8 players for intense elimination battles
              </p>
            </div>
          </Card>

          <Card className="text-center bg-white/10 backdrop-blur-sm border-white/20">
            <div className="p-6">
              <AvatarDisplay 
                avatarType="IMAGE3"
                size="xlarge" 
                className="mb-4"
              />
              <h3 className="text-xl font-semibold text-white mb-2">Real-time Action</h3>
              <p className="text-gray-300">
                Experience live eliminations and word claiming with instant updates
              </p>
            </div>
          </Card>

          <Card className="text-center bg-white/10 backdrop-blur-sm border-white/20">
            <div className="p-6">
              <AvatarDisplay 
                avatarType="IMAGE4"
                size="xlarge" 
                className="mb-4"
              />
              <h3 className="text-xl font-semibold text-white mb-2">Custom Avatars</h3>
              <p className="text-gray-300">
                Choose from various avatars and track your game statistics
              </p>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="max-w-md mx-auto">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <div className="p-6">
              <h3 className="text-2xl font-semibold text-white mb-6 text-center">
                Quick Start
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white mb-2">Join Room</label>
                  <div className="flex space-x-2">
                    <InputText
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      placeholder="Enter room code"
                      className="flex-1"
                    />
                    <Button 
                      label="Join" 
                      onClick={handleJoinRoom}
                      disabled={!roomCode.trim()}
                      className="p-button-primary"
                    />
                  </div>
                </div>

                <Divider className="border-white/20" />

                <div className="text-center">
                  <Button 
                    label="Create New Room" 
                    onClick={handleCreateRoom}
                    className="p-button-success w-full"
                    icon="pi pi-plus"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Game Rules */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <div className="p-8">
              <h3 className="text-3xl font-semibold text-white mb-6 text-center">
                How to Play
              </h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xl font-semibold text-white mb-4">Game Setup</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• Join a room with other players</li>
              <li>• Each player gets assigned 3 words from their target</li>
              <li>• You get a target player to eliminate</li>
              <li>• Game starts when room is full</li>
            </ul>
                </div>
                
                <div>
                  <h4 className="text-xl font-semibold text-white mb-4">Gameplay</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li>• Get your target to say their words in real life</li>
                    <li>• Claim the word in the app when they say it</li>
                    <li>• Target confirms if they actually said it</li>
                    <li>• Eliminated player's target becomes yours</li>
                    <li>• Last player standing wins!</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16">
        <div className="text-center text-gray-400">
          <p>&copy; 2024 Aseedak. All rights reserved.</p>
          <div className="mt-4 space-x-6">
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/contact" className="hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}