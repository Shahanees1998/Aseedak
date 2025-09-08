'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
  }
  status: 'ALIVE' | 'ELIMINATED' | 'WINNER'
  position: number
  kills: number
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
  const { data: session, status } = useSession()
  const router = useRouter()
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [gameLogs, setGameLogs] = useState<GameLog[]>([])
  const [wordClaimDialogVisible, setWordClaimDialogVisible] = useState(false)
  const [claimWord, setClaimWord] = useState('')
  const [confirmWordDialogVisible, setConfirmWordDialogVisible] = useState(false)
  const [pendingWordClaim, setPendingWordClaim] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [pusher, setPusher] = useState<Pusher | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    fetchRoom()
    initializePusher()

    return () => {
      if (pusher) {
        pusher.disconnect()
      }
    }
  }, [session, status, router, params.code])

  const initializePusher = () => {
    const pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
          Authorization: `Bearer ${session?.user?.id}`
        }
      }
    })

    const channel = pusherInstance.subscribe(`room-${params.code}`)
    
    channel.bind('player-joined', (data: any) => {
      setRoom(data.room)
      setMessage(`${data.player.username} joined the room!`)
    })

    channel.bind('player-left', (data: any) => {
      setRoom(data.room)
      setMessage(`${data.player.username} left the room!`)
    })

    channel.bind('game-started', (data: any) => {
      setRoom(data.room)
      setMessage('Game started! Good luck!')
    })

    channel.bind('word-claim', (data: any) => {
      setPendingWordClaim(data.wordClaim)
      setConfirmWordDialogVisible(true)
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

    setPusher(pusherInstance)
  }

  const fetchRoom = async () => {
    try {
      const response = await fetch(`/api/game-rooms/${params.code}`)
      
      if (response.ok) {
        const data = await response.json()
        setRoom(data.room)
        
        // Check if user is already in the room
        const isPlayerInRoom = data.room.players.some((player: GamePlayer) => 
          player.user.id === session?.user?.id
        )
        
        if (!isPlayerInRoom && data.room.status === 'WAITING') {
          // Auto-join if room is waiting and user is not in it
          joinRoom()
        }
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Room not found')
      }
    } catch (error) {
      setError('Error loading room')
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = async () => {
    if (!session) return
    
    setJoining(true)
    try {
      const response = await fetch(`/api/game-rooms/${params.code}/join`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setRoom(data.room)
        setMessage('Successfully joined the room!')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to join room')
      }
    } catch (error) {
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

  const claimWord = async () => {
    if (!claimWord.trim()) return

    try {
      const response = await fetch(`/api/game-rooms/${params.code}/claim-word`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word: claimWord.trim() })
      })

      if (response.ok) {
        setWordClaimDialogVisible(false)
        setClaimWord('')
        setMessage('Word claim sent! Waiting for target confirmation...')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to claim word')
      }
    } catch (error) {
      setError('Error claiming word')
    }
  }

  const confirmWordClaim = async (isCorrect: boolean) => {
    try {
      const response = await fetch(`/api/game-rooms/${params.code}/confirm-word-claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          wordClaimId: pendingWordClaim.id,
          isCorrect 
        })
      })

      if (response.ok) {
        setConfirmWordDialogVisible(false)
        setPendingWordClaim(null)
        setMessage(isCorrect ? 'Word confirmed! Player eliminated!' : 'Word claim rejected!')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to confirm word claim')
      }
    } catch (error) {
      setError('Error confirming word claim')
    }
  }

  const getCurrentPlayer = () => {
    return room?.players.find(player => player.user.id === session?.user?.id)
  }

  const getPlayerWords = () => {
    const player = getCurrentPlayer()
    if (!player) return []
    return [player.word1, player.word2, player.word3].filter(Boolean)
  }

  const getTargetPlayer = () => {
    const player = getCurrentPlayer()
    if (!player) return null
    return room?.players.find(p => p.id === player.targetId)
  }

  const isCreator = () => {
    return room?.creator.id === session?.user?.id
  }

  const canStartGame = () => {
    return isCreator() && 
           room?.status === 'WAITING' && 
           room?.players.length >= 2
  }

  const canClaimWord = () => {
    const player = getCurrentPlayer()
    return room?.status === 'IN_PROGRESS' && 
           player?.status === 'ALIVE' &&
           player?.targetId
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20">
          <div className="p-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Error</h1>
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
        <div className="text-white text-xl">Room not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">{room.name}</h1>
            <p className="text-gray-300">Room Code: {room.code}</p>
          </div>
          <div className="flex space-x-3">
            {room.status === 'WAITING' && !getCurrentPlayer() && (
              <Button
                label="Join Room"
                loading={joining}
                onClick={joinRoom}
                className="p-button-primary"
              />
            )}
            {getCurrentPlayer() && (
              <Button
                label="Leave Room"
                onClick={leaveRoom}
                className="p-button-outlined p-button-secondary"
              />
            )}
            {canStartGame() && (
              <Button
                label="Start Game"
                onClick={startGame}
                className="p-button-success"
              />
            )}
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <Message 
            severity="info" 
            text={message} 
            className="mb-6"
            onClose={() => setMessage('')}
          />
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
                <span className="text-white">
                  Players: {room.players.length}/{room.maxPlayers}
                </span>
                {room.status === 'IN_PROGRESS' && (
                  <span className="text-white">
                    Round: {room.currentRound}
                  </span>
                )}
              </div>
              {room.status === 'IN_PROGRESS' && timeLeft > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-white">Time Left:</span>
                  <ProgressBar 
                    value={(timeLeft / room.timeLimit) * 100} 
                    style={{ width: '100px' }}
                  />
                  <span className="text-white">{timeLeft}s</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Players List */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Players</h2>
              <div className="space-y-3">
                {room.players.map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-3 bg-white/5 rounded">
                    <div className="flex items-center space-x-3">
                      <AvatarDisplay 
                        avatarType={player.user.avatar}
                        size="small"
                        className={player.status === 'ALIVE' ? 'ring-2 ring-green-500' : 'opacity-50'}
                      />
                      <div>
                        <div className="text-white font-medium">{player.user.username}</div>
                        <div className="text-gray-400 text-sm">
                          {player.status === 'ALIVE' ? 'Alive' : 
                           player.status === 'ELIMINATED' ? 'Eliminated' : 'Winner'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-sm">Kills: {player.kills}</div>
                      {player.user.id === session?.user?.id && (
                        <Badge value="You" severity="info" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Game Info */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Game Info</h2>
              
              {room.status === 'WAITING' && (
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Waiting for players to join. Game will start when room is full or creator starts the game.
                  </p>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white mb-2">
                      {room.players.length}/{room.maxPlayers}
                    </div>
                    <div className="text-gray-400">Players Joined</div>
                  </div>
                </div>
              )}

              {room.status === 'IN_PROGRESS' && getCurrentPlayer() && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-medium mb-2">Your Target's Words:</h3>
                    <div className="space-y-2">
                      {getPlayerWords().map((word, index) => (
                        <div key={index} className="p-2 bg-white/10 rounded text-white text-center">
                          {word}
                        </div>
                      ))}
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                      Try to get your target to say these words in real life!
                    </p>
                  </div>
                  
                  <Divider className="border-white/20" />
                  
                  <div>
                    <h3 className="text-white font-medium mb-2">Your Target:</h3>
                    {getTargetPlayer() ? (
                      <div className="flex items-center space-x-2 p-2 bg-white/10 rounded">
                        <AvatarDisplay 
                          avatarType={getTargetPlayer()?.user.avatar || 'IMAGE1'}
                          size="small"
                        />
                        <span className="text-white">{getTargetPlayer()?.user.username}</span>
                      </div>
                    ) : (
                      <div className="text-gray-400">No target assigned</div>
                    )}
                  </div>

                  {canClaimWord() && (
                    <Button
                      label="Claim Word"
                      onClick={() => setWordClaimDialogVisible(true)}
                      className="w-full p-button-primary"
                    />
                  )}
                </div>
              )}

              {room.status === 'FINISHED' && (
                <div className="space-y-4">
                  <h3 className="text-white font-medium">Game Results</h3>
                  <div className="space-y-2">
                    {room.players
                      .sort((a, b) => b.kills - a.kills)
                      .map((player, index) => (
                        <div key={player.id} className="flex justify-between items-center p-2 bg-white/10 rounded">
                          <span className="text-white">#{index + 1} {player.user.username}</span>
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
              <h2 className="text-xl font-semibold text-white mb-4">Game Log</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {gameLogs.length === 0 ? (
                  <p className="text-gray-400">No game events yet</p>
                ) : (
                  gameLogs.map((log, index) => (
                    <div key={index} className="p-2 bg-white/5 rounded text-sm">
                      <div className="text-white">{log.message}</div>
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

        {/* Word Claim Dialog */}
        <Dialog
          header="Claim Word"
          visible={wordClaimDialogVisible}
          style={{ width: '400px' }}
          onHide={() => setWordClaimDialogVisible(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-white mb-2">Enter the word your target said:</label>
              <InputText
                value={claimWord}
                onChange={(e) => setClaimWord(e.target.value)}
                placeholder="Type the word here"
                className="w-full"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                label="Cancel"
                onClick={() => setWordClaimDialogVisible(false)}
                className="p-button-secondary"
              />
              <Button
                label="Claim Word"
                onClick={claimWord}
                disabled={!claimWord.trim()}
                className="p-button-primary"
              />
            </div>
          </div>
        </Dialog>

        {/* Confirm Word Claim Dialog */}
        <Dialog
          header="Word Claim"
          visible={confirmWordDialogVisible}
          style={{ width: '400px' }}
          onHide={() => setConfirmWordDialogVisible(false)}
        >
          <div className="space-y-4">
            <p className="text-white">
              <strong>{pendingWordClaim?.killer?.user?.username}</strong> claims you said: <strong>"{pendingWordClaim?.word}"</strong>
            </p>
            <p className="text-gray-300">
              Did you actually say this word?
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                label="No"
                onClick={() => confirmWordClaim(false)}
                className="p-button-secondary"
              />
              <Button
                label="Yes"
                onClick={() => confirmWordClaim(true)}
                className="p-button-success"
              />
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  )
}
