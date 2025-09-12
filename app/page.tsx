'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import Link from 'next/link'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return // Still loading

    if (user) {
      // User is logged in, redirect to dashboard or main game area
      router.push('/create-room')
    }
    // If not logged in, stay on this page to show auth options
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (user) {
    // This will be handled by the useEffect redirect, but show loading while redirecting
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Redirecting...</div>
      </div>
    )
  }

  // User is not logged in, show landing page with auth options
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6">
            Aseedak
          </h1>
          <p className="text-2xl text-gray-300 mb-8">
            Word Elimination Game
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12">
            Join the ultimate word elimination game! Get your target to say specific words in real life, 
            then claim them in the app to eliminate your targets and be the last player standing!
          </p>
        </div>

        {/* Auth Options */}
        <div className="max-w-md mx-auto">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <div className="p-8 text-center">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Get Started
              </h2>
              <p className="text-gray-300 mb-8">
                Sign in to start playing or create a new account
              </p>
              
              <div className="space-y-4">
                <Link href="/auth/login" className="block">
                  <Button
                    label="Sign In"
                    className="w-full p-button-primary"
                    size="large"
                  />
                </Link>
                
                <Link href="/auth/register" className="block">
                  <Button
                    label="Create Account"
                    className="w-full p-button-outlined p-button-secondary"
                    size="large"
                  />
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Game Features */}
        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-time Gameplay</h3>
              <p className="text-gray-400">Play with friends in real-time</p>
            </div>
          </Card>
          
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-white mb-2">Word-based Elimination</h3>
              <p className="text-gray-400">Use words to eliminate targets</p>
            </div>
          </Card>
          
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-white mb-2">Multiplayer Rooms</h3>
              <p className="text-gray-400">Create or join game rooms</p>
            </div>
          </Card>
          
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">🎭</div>
              <h3 className="text-xl font-semibold text-white mb-2">Custom Avatars</h3>
              <p className="text-gray-400">Personalize your gaming experience</p>
            </div>
          </Card>
        </div>

        {/* How to Play */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <div className="p-8">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                How to Play
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Join or Create a Room</h3>
                      <p className="text-gray-300">Start by joining an existing game room or create your own</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Get Your Target & Words</h3>
                      <p className="text-gray-300">Receive 3 words and a target player to eliminate</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Make Them Say the Words</h3>
                      <p className="text-gray-300">Get your target to say those words in real life</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      4
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Claim the Word</h3>
                      <p className="text-gray-300">Claim the word in the app when they say it</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      5
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Target Confirms</h3>
                      <p className="text-gray-300">Your target confirms or rejects the claim</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      6
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Eliminate & Win</h3>
                      <p className="text-gray-300">Eliminate targets until you're the last one standing!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}