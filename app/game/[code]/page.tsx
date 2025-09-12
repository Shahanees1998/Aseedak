'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import AvatarDisplay from '@/components/AvatarDisplay'
import { Badge } from 'primereact/badge'
import { Message } from 'primereact/message'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { ProgressBar } from 'primereact/progressbar'
import { Divider } from 'primereact/divider'
import Pusher from 'pusher-js'
import Link from 'next/link'

interface GamePlayer {
  id: string
  user: {
    id: string
    username: string
    avatar: string
    email?: string
    firstName?: string
  }
  status: 'ALIVE' | 'ELIMINATED' | 'WINNER'
  joinStatus: 'INVITED' | 'JOINED' | 'LEFT'
  position: number
  kills: number
  targetId?: string
  target?: {
    id: string
    user: {
      id: string
      username: string
      avatar: string
    }
  }
  word1?: string
  word2?: string
  word3?: string
}

interface GameRoom {
  id: string
  name: string
  code: string
  maxPlayers: number
  status: 'WAITING' | 'STARTING' | 'IN_PROGRESS' | 'FINISHED'
  currentRound: number
  timeLimit: number
  players: GamePlayer[]
  creator: {
    id: string
    username: string
    avatar: string
  }
  createdAt: string
  startedAt?: string
  finishedAt?: string
}

interface GameLog {
  id: string
  type: string
  message: string
  data?: any
  playerId?: string
  targetId?: string
  createdAt: string
}

export default function GameRoomPage({ params }: { params: { code: string } }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [gameLogs, setGameLogs] = useState<GameLog[]>([])
  const [eliminationDialogVisible, setEliminationDialogVisible] = useState(false)
  const [eliminationRequest, setEliminationRequest] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [pusher, setPusher] = useState<Pusher | null>(null)
  const [pusherConnected, setPusherConnected] = useState(false)
  const [reassigning, setReassigning] = useState(false)

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    fetchRoom()
  }, [user, authLoading, router, params.code])

  useEffect(() => {
    if (user && room) {
      initializePusher()
    }

    return () => {
      if (pusher) {
        pusher.unsubscribe(`room-${params.code}`)
        pusher.unsubscribe(`user-${user?.id}`)
        pusher.disconnect()
      }
    }
  }, [user, room])

  const initializePusher = async () => {
    try {
      // Check if Pusher is configured
      if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
        console.warn('⚠️ Pusher not configured - real-time updates disabled')
        return
      }

      console.log('🔌 Initializing Pusher connection...')
      console.log('  Key:', process.env.NEXT_PUBLIC_PUSHER_KEY)
      console.log('  Cluster:', process.env.NEXT_PUBLIC_PUSHER_CLUSTER)

      // Get the JWT token from cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1]

      console.log('  JWT Token found:', !!token)

      // Try without authentication first to see if basic connection works
      const pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        // Temporarily disable auth to test basic connection
        // authEndpoint: '/api/pusher/auth',
        // auth: {
        //   headers: {
        //     Authorization: `Bearer ${token}`
        //   }
        // }
      })

    const channelName = `room-${params.code}`
    const userChannelName = `user-${user?.id}`
    console.log('📡 Subscribing to channels:', channelName, userChannelName)
    
    const channel = pusherInstance.subscribe(channelName)
    const userChannel = pusherInstance.subscribe(userChannelName)
    
    // Add connection status logging
    pusherInstance.connection.bind('connected', () => {
      console.log('✅ Pusher connected successfully')
      setPusherConnected(true)
    })
    
    pusherInstance.connection.bind('disconnected', () => {
      console.log('❌ Pusher disconnected')
      setPusherConnected(false)
    })
    
    pusherInstance.connection.bind('error', (error: any) => {
      console.error('❌ Pusher connection error:', error)
    })
    
    pusherInstance.connection.bind('state_change', (states: any) => {
      console.log('🔄 Pusher state changed:', states.previous, '->', states.current)
    })
    
    // Channel subscription events
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('✅ Successfully subscribed to room channel:', channelName)
    })
    
    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('❌ Room channel subscription error:', error)
    })

    userChannel.bind('pusher:subscription_succeeded', () => {
      console.log('✅ Successfully subscribed to user channel:', userChannelName)
    })
    
    userChannel.bind('pusher:subscription_error', (error: any) => {
      console.error('❌ User channel subscription error:', error)
    })
    
    channel.bind('player-joined', (data: any) => {
      console.log('🎉 Player joined event received:', data)
      setRoom(data.room)
      setMessage(`🎉 ${data.player.username} joined the room!`)
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000)
    })

    channel.bind('player-left', (data: any) => {
      console.log('👋 Player left event received:', data)
      setRoom(data.room)
      setMessage(`👋 ${data.player.username} left the room!`)
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000)
    })

    channel.bind('game-started', (data: any) => {
      setRoom(data.room)
      setMessage('Game started! Good luck!')
    })


    channel.bind('elimination', (data: any) => {
      setRoom(data.room)
      setMessage(`${data.eliminatedPlayer.username} was eliminated by ${data.killerPlayer.username}!`)
      setGameLogs(prev => [...prev, data.log])
    })

    channel.bind('game-ended', (data: any) => {
      setRoom(data.room)
      setMessage(`Game ended! ${data.winner.username} won!`)
    })

    channel.bind('timer-update', (data: any) => {
      setTimeLeft(data.timeLeft)
    })

    channel.bind('targets-reassigned', (data: any) => {
      setRoom(data.room)
      setMessage('New targets and words have been assigned!')
    })

    // User-specific events (elimination requests)
    userChannel.bind('elimination-request', (data: any) => {
      console.log('🎯 Elimination request received:', data)
      setEliminationRequest(data.elimination)
      setEliminationDialogVisible(true)
    })

    channel.bind('elimination-confirmed', (data: any) => {
      setRoom(data.room)
      setMessage(data.message)
    })

    setPusher(pusherInstance)
    } catch (error) {
      console.error('❌ Failed to initialize Pusher:', error)
      // Don't fail the page load if Pusher fails
    }
  }

  const fetchRoom = async () => {
    try {
      console.log('🔍 Fetching room data for code:', params.code)
      const response = await fetch(`/api/game-rooms/${params.code}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Room data received:', data.room)
        setRoom(data.room)
        
        // Check if user is already in the room
        const isPlayerInRoom = data.room.players.some((player: GamePlayer) => 
          player.user.id === user?.id
        )
        
        console.log('👤 User in room check:', {
          userId: user?.id,
          isPlayerInRoom,
          players: data.room.players.map((p: GamePlayer) => ({ id: p.user.id, username: p.user.username }))
        })
        
        // Don't auto-join - let user decide
        // if (!isPlayerInRoom && data.room.status === 'WAITING') {
        //   // Auto-join if room is waiting and user is not in it
        //   joinRoom()
        // }
      } else {
        const errorData = await response.json()
        console.error('❌ Error fetching room:', errorData)
        setError(errorData.message || 'Room not found')
      }
    } catch (error) {
      console.error('❌ Error loading room:', error)
      setError('Error loading room')
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = async () => {
    if (!user) return
    
    console.log('🎮 Attempting to join room:', params.code)
    setJoining(true)
    try {
      const response = await fetch(`/api/game-rooms/${params.code}/join`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Successfully joined room:', data.room)
        setRoom(data.room)
        setMessage('Successfully joined the room!')
      } else {
        const errorData = await response.json()
        console.error('❌ Failed to join room:', errorData)
        setError(errorData.message || 'Failed to join room')
      }
    } catch (error) {
      console.error('❌ Error joining room:', error)
      setError('Error joining room')
    } finally {
      setJoining(false)
    }
  }

  const leaveRoom = async () => {
    try {
      const response = await fetch(`/api/game-rooms/${params.code}/leave`, {
        method: 'POST'
      })

      if (response.ok) {
        router.push('/')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to leave room')
      }
    } catch (error) {
      setError('Error leaving room')
    }
  }

  const startGame = async () => {
    try {
      const response = await fetch(`/api/game-rooms/${params.code}/start`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setRoom(data.room)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to start game')
      }
    } catch (error) {
      setError('Error starting game')
    }
  }


  const getCurrentPlayer = () => {
    return room?.players.find(player => player.user.id === user?.id)
  }

  const getPlayerWords = () => {
    const player = getCurrentPlayer()
    if (!player) return []
    return [player.word1, player.word2, player.word3].filter(Boolean)
  }

  const getTargetPlayer = () => {
    const player = getCurrentPlayer()
    if (!player) return null
    return player.target
  }

  const isCreator = () => {
    return room?.creator.id === user?.id
  }

  const canStartGame = () => {
    return isCreator() && 
           room?.status === 'WAITING' && 
           room?.players.length >= 2
  }

  const canEliminateTarget = () => {
    const player = getCurrentPlayer()
    return room?.status === 'IN_PROGRESS' && 
           player?.status === 'ALIVE' &&
           player?.targetId
  }

  const eliminateTarget = async () => {
    if (!canEliminateTarget()) return
    
    try {
      const response = await fetch(`/api/game-rooms/${params.code}/eliminate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetId: getCurrentPlayer()?.targetId
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessage('Elimination request sent! Waiting for target confirmation...')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to send elimination request')
      }
    } catch (error) {
      console.error('❌ Error eliminating target:', error)
      setError('Error eliminating target')
    }
  }

  const confirmElimination = async (confirmed: boolean) => {
    if (!eliminationRequest) return
    
    try {
      const response = await fetch(`/api/game-rooms/${params.code}/confirm-elimination`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eliminationId: eliminationRequest.id,
          confirmed: confirmed
        })
      })

      if (response.ok) {
        const data = await response.json()
        setRoom(data.room)
        setEliminationDialogVisible(false)
        setEliminationRequest(null)
        setMessage(confirmed ? 'Elimination confirmed! You have been eliminated.' : 'Elimination denied.')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to confirm elimination')
      }
    } catch (error) {
      console.error('❌ Error confirming elimination:', error)
      setError('Error confirming elimination')
    }
  }

  const reassignTargetsAndWords = async () => {
    if (!isCreator()) return
    
    setReassigning(true)
    try {
      const response = await fetch(`/api/game-rooms/${params.code}/reassign`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setRoom(data.room)
        setMessage('Targets and words have been reassigned!')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to reassign targets')
      }
    } catch (error) {
      console.error('❌ Error reassigning targets:', error)
      setError('Error reassigning targets')
    } finally {
      setReassigning(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className=" text-xl">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20">
          <div className="p-8 text-center">
            <h1 className="text-3xl font-bold  mb-4">Error</h1>
            <p className="text-gray-300 mb-6">{error}</p>
            <Link href="/">
              <Button label="Back to Home" className="p-button-primary" />
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className=" text-xl">Room not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold  mb-2">{room.name}</h1>
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="bg-white/10 px-4 py-2 rounded-lg">
              <span className="text-gray-300 text-sm">Room Code:</span>
              <span className=" font-mono text-xl ml-2">{room.code}</span>
            </div>
            <Button
              icon="pi pi-copy"
              onClick={() => {
                navigator.clipboard.writeText(room.code)
                setMessage('Room code copied to clipboard!')
                setTimeout(() => setMessage(''), 2000)
              }}
              className="p-button-outlined p-button-sm"
              tooltip="Copy room code"
            />
            <Button
              icon="pi pi-share-alt"
              onClick={() => {
                const shareUrl = `${window.location.origin}/game/${room.code}`
                navigator.clipboard.writeText(shareUrl)
                setMessage('Room link copied to clipboard!')
                setTimeout(() => setMessage(''), 2000)
              }}
              className="p-button-outlined p-button-sm"
              tooltip="Copy room link"
            />
          </div>
          <p className="text-gray-400 text-sm">
            Created by {room.creator.username} • {new Date(room.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Status Message */}
        {message && (
          <div className="mb-6">
            <Message 
              severity="success" 
              text={message} 
              className="mb-2 animate-pulse"
            />
            <Button 
              label="Dismiss" 
              size="small"
              onClick={() => setMessage('')}
              className="p-button-text p-button-sm"
            />
          </div>
        )}

        {/* Game Status */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
          <div className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Badge 
                  value={room.status} 
                  severity={
                    room.status === 'WAITING' ? 'info' :
                    room.status === 'IN_PROGRESS' ? 'success' :
                    room.status === 'FINISHED' ? 'secondary' : 'warning'
                  }
                />
                <span className="">
                  Players: {room.players.filter(p => p.joinStatus === 'JOINED').length}/{room.maxPlayers}
                  {room.players.filter(p => p.joinStatus === 'INVITED').length > 0 && (
                    <span className="text-gray-400 ml-2">
                      ({room.players.filter(p => p.joinStatus === 'INVITED').length} invited)
                    </span>
                  )}
                </span>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${pusherConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-gray-300">
                    {pusherConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
                {room.status === 'IN_PROGRESS' && (
                  <span className="">
                    Round: {room.currentRound}
                  </span>
                )}
              </div>
              {room.status === 'IN_PROGRESS' && timeLeft > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="">Time Left:</span>
                  <ProgressBar 
                    value={(timeLeft / room.timeLimit) * 100} 
                    style={{ width: '100px' }}
                  />
                  <span className="">{timeLeft}s</span>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="mt-4 flex justify-center space-x-4">
              {/* Refresh Button */}
              <Button
                icon="pi pi-refresh"
                onClick={() => {
                  console.log('🔄 Manual refresh triggered')
                  fetchRoom()
                }}
                className="p-button-outlined p-button-sm"
                tooltip="Refresh room data"
              />
              
              {(() => {
                const playerInRoom = room.players.find((player: GamePlayer) => 
                  player.user.id === user?.id
                )
                const isPlayerInRoom = playerInRoom && playerInRoom.joinStatus === 'JOINED'
                const isInvited = playerInRoom && playerInRoom.joinStatus === 'INVITED'
                const isCreator = room.creator.id === user?.id
                
                console.log('🔘 Button logic check:', {
                  isPlayerInRoom,
                  isInvited,
                  isCreator,
                  roomStatus: room.status,
                  userId: user?.id,
                  playerJoinStatus: playerInRoom?.joinStatus,
                  players: room.players.map((p: GamePlayer) => ({ 
                    id: p.user.id, 
                    username: p.user.username, 
                    joinStatus: p.joinStatus 
                  }))
                })
                
                if (isPlayerInRoom) {
                  return (
                    <div className="flex space-x-4">
                      <Button
                        label="Leave Room"
                        icon="pi pi-sign-out"
                        onClick={leaveRoom}
                        className="p-button-danger"
                        severity="danger"
                      />
                      {isCreator && room.status === 'WAITING' && (
                        <Button
                          label="Start Game"
                          icon="pi pi-play"
                          onClick={startGame}
                          className="p-button-success"
                          disabled={room.players.length < 2}
                        />
                      )}
                    </div>
                  )
                } else if (isInvited) {
                  return (
                    <Button
                      label="Accept Invitation"
                      icon="pi pi-check"
                      onClick={joinRoom}
                      loading={joining}
                      className="p-button-success"
                    />
                  )
                } else if (room.status === 'WAITING') {
                  return (
                    <Button
                      label="Join Room"
                      icon="pi pi-sign-in"
                      onClick={joinRoom}
                      loading={joining}
                      className="p-button-primary"
                      disabled={room.players.filter(p => p.joinStatus === 'JOINED').length >= room.maxPlayers}
                    />
                  )
                } else {
                  return (
                    <div className="text-center">
                      <p className="text-gray-400 mb-2">Game is in progress</p>
                      <Button
                        label="Leave"
                        icon="pi pi-sign-out"
                        onClick={leaveRoom}
                        className="p-button-secondary"
                      />
                    </div>
                  )
                }
              })()}
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Players List */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <div className="p-6">
              <h2 className="text-xl font-semibold  mb-4">Players</h2>
              <div className="space-y-3">
                {room.players
                  .sort((a, b) => a.position - b.position)
                  .map((player, index) => (
                  <div key={player.id} className={`flex items-center justify-between p-3 rounded transition-all duration-300 ${
                    player.status === 'ALIVE' ? 'bg-white/10 ring-2 ring-green-500/50' : 'bg-white/5 opacity-70'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <AvatarDisplay 
                          avatarType={player.user.avatar}
                          size="normal"
                          className={player.status === 'ALIVE' ? 'ring-2 ring-green-500' : 'opacity-50'}
                        />
                        {player.user.id === room.creator.id && (
                          <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs px-1 rounded-full">
                            👑
                          </div>
                        )}
                      </div>
                      <div>
                        <div className=" font-medium flex items-center space-x-2">
                          <span>{player.user.username}</span>
                          {player.user.id === user?.id && (
                            <Badge value="You" severity="info" className="text-xs" />
                          )}
                        </div>
                        <div className="text-gray-400 text-sm flex items-center space-x-2">
                          <span>
                            {player.status === 'ALIVE' ? '🟢 Alive' : 
                             player.status === 'ELIMINATED' ? '🔴 Eliminated' : '🏆 Winner'}
                          </span>
                          <span>•</span>
                          <span>
                            {player.joinStatus === 'JOINED' ? '✅ Joined' : 
                             player.joinStatus === 'INVITED' ? '📧 Invited' : '❌ Left'}
                          </span>
                          <span>•</span>
                          <span>Position #{player.position}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className=" text-sm font-medium">Kills: {player.kills}</div>
                      {player.status === 'ALIVE' && (
                        <div className="text-green-400 text-xs">Active</div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Show empty slots */}
                {room.players.length < room.maxPlayers && (
                  <div className="text-center py-4">
                    <div className="text-gray-400 text-sm">
                      {room.maxPlayers - room.players.length} more player{room.maxPlayers - room.players.length !== 1 ? 's' : ''} can join
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Game Info */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <div className="p-6">
              <h2 className="text-xl font-semibold  mb-4">Game Info</h2>
              
              {room.status === 'WAITING' && (
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Waiting for players to join. Game will start when room is full or creator starts the game.
                  </p>
                  <div className="text-center">
                    <div className="text-4xl font-bold  mb-2">
                      {room.players.length}/{room.maxPlayers}
                    </div>
                    <div className="text-gray-400">Players Joined</div>
                  </div>
                </div>
              )}

              {/* Always show game assignments section */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">My Words to Speak:</h3>
                  <div className="space-y-2">
                    {room.status === 'IN_PROGRESS' && getPlayerWords().length > 0 ? (
                      getPlayerWords().map((word, index) => (
                        <div key={index} className="p-2 bg-white/10 roundedtext-center">
                          {word}
                        </div>
                      ))
                    ) : (
                      <div className="space-y-2">
                        <div className="p-2 bg-white/5 rounded text-gray-400 text-center border-2 border-dashed border-gray-600">
                          Word 1 - Not assigned yet
                        </div>
                        <div className="p-2 bg-white/5 rounded text-gray-400 text-center border-2 border-dashed border-gray-600">
                          Word 2 - Not assigned yet
                        </div>
                        <div className="p-2 bg-white/5 rounded text-gray-400 text-center border-2 border-dashed border-gray-600">
                          Word 3 - Not assigned yet
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    {room.status === 'IN_PROGRESS' ? 
                      "Speak these words to your target user in real life!" : 
                      "Words will be assigned when the game starts"
                    }
                  </p>
                </div>
                
                <Divider className="border-white/20" />
                
                <div>
                  <h3 className="font-medium mb-2">My Target User:</h3>
                  {room.status === 'IN_PROGRESS' && getTargetPlayer() ? (
                    <div className="flex items-center space-x-2 p-2 bg-white/10 rounded">
                      <AvatarDisplay 
                        avatarType={getTargetPlayer()?.user.avatar || 'IMAGE1'}
                        size="normal"
                      />
                      <span >{getTargetPlayer()?.user.username}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 p-2 bg-white/5 rounded border-2 border-dashed border-gray-600">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-gray-400 text-xs">?</span>
                      </div>
                      <span className="text-gray-400">
                        {room.status === 'IN_PROGRESS' ? 'No target assigned' : 'Target will be assigned when game starts'}
                      </span>
                    </div>
                  )}
                </div>

                {room.status === 'IN_PROGRESS' && canEliminateTarget() && (
                  <Button
                    label="I Achieve My Target"
                    onClick={eliminateTarget}
                    className="w-full p-button-primary"
                  />
                )}

                {isCreator() && room.status === 'IN_PROGRESS' && (
                  <Button
                    label={reassigning ? "Reassigning..." : "Reassign Targets & Words"}
                    onClick={reassignTargetsAndWords}
                    disabled={reassigning}
                    className="w-full p-button-secondary"
                  />
                )}
              </div>

              {room.status === 'FINISHED' && (
                <div className="space-y-4">
                  <h3 className=" font-medium">Game Results</h3>
                  <div className="space-y-2">
                    {room.players
                      .sort((a, b) => b.kills - a.kills)
                      .map((player, index) => (
                        <div key={player.id} className="flex justify-between items-center p-2 bg-white/10 rounded">
                          <span className="">#{index + 1} {player.user.username}</span>
                          <span className="text-gray-400">{player.kills} kills</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Game Logs */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <div className="p-6">
              <h2 className="text-xl font-semibold  mb-4">Game Log</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {gameLogs.length === 0 ? (
                  <p className="text-gray-400">No game events yet</p>
                ) : (
                  gameLogs.map((log, index) => (
                    <div key={index} className="p-2 bg-white/5 rounded text-sm">
                      <div className="">{log.message}</div>
                      <div className="text-gray-400 text-xs">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Elimination Confirmation Dialog */}
        <Dialog
          header="Elimination Request"
          visible={eliminationDialogVisible}
          style={{ width: '400px' }}
          onHide={() => setEliminationDialogVisible(false)}
        >
          <div className="space-y-4">
            <p className="">
              <strong>{eliminationRequest?.killer?.user?.username}</strong> claims they achieved their target and says you said these words:
            </p>
            <div className="space-y-2">
              {eliminationRequest?.words?.map((word: string, index: number) => (
                <div key={index} className="p-2 bg-white/10 rounded  text-center">
                  {word}
                </div>
              ))}
            </div>
            <p className="text-gray-300">
              Did you actually say these words to them?
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                label="No, I didn't say them"
                onClick={() => confirmElimination(false)}
                className="p-button-secondary"
              />
              <Button
                label="Yes, I said them"
                onClick={() => confirmElimination(true)}
                className="p-button-success"
              />
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  )
}
