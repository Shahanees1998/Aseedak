import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { pusher } from '@/lib/pusher'
import { GameNotifications } from '@/lib/fcm'
import { checkAndExpireOldRooms } from '@/lib/roomExpiration'


export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    // Check for expired rooms first
    await checkAndExpireOldRooms()
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const room = await prisma.gameRoom.findUnique({
      where: { code: params.code },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json(
        { message: 'Room not found' },
        { status: 404 }
      )
    }

    // Check if user is the creator
    if (room.createdBy !== decoded.userId) {
      return NextResponse.json(
        { message: 'Only room creator can start the game' },
        { status: 403 }
      )
    }

    // Check if room has enough joined players (2-6)
    const joinedPlayers = room.players.filter(p => p.joinStatus === 'JOINED')
    if (joinedPlayers.length < 2 || joinedPlayers.length > 6) {
      return NextResponse.json(
        { message: 'Room must have 2-6 joined players to start' },
        { status: 400 }
      )
    }

    // Check if game is already started
    if (room.status !== 'WAITING') {
      return NextResponse.json(
        { message: 'Game already started or finished' },
        { status: 400 }
      )
    }

    // Get words for the game
    const words = await prisma.word.findMany({
      where: {
        id: { in: room.wordSet }
      }
    })

    if (words.length < joinedPlayers.length) {
      return NextResponse.json(
        { message: 'Not enough words available for this game' },
        { status: 400 }
      )
    }

    // Get creator's available characters (purchased + default unlocked)
    const userCharacters = await (prisma as any).userCharacter.findMany({
      where: { userId: decoded.userId },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      }
    })

    // Get default unlocked characters
    const defaultCharacters = await prisma.character.findMany({
      where: {
        isActive: true,
        isUnlocked: true
      },
      select: {
        id: true,
        name: true
      }
    })

    // Get unpaid (free) characters
    const unpaidCharacters = await prisma.character.findMany({
      where: {
        isActive: true,
        isUnlocked: false
      },
      select: {
        id: true,
        name: true
      }
    })

    // Combine all available characters
    const characters = [
      ...userCharacters.map((uc: { character: { id: string; name: string } }) => uc.character),
      ...defaultCharacters,
      ...unpaidCharacters
    ]

    if (characters.length === 0) {
      return NextResponse.json(
        { message: 'No characters available for the game. Purchase some characters or contact support.' },
        { status: 400 }
      )
    }

    // Shuffle only joined players and assign targets
    const shuffledPlayers = [...joinedPlayers].sort(() => 0.5 - Math.random())
    const shuffledCharacters = [...characters].sort(() => 0.5 - Math.random())
    const shuffledWords = [...words].sort(() => 0.5 - Math.random())
    
    // Check if we have enough unique characters and words
    if (shuffledCharacters.length < joinedPlayers.length) {
      return NextResponse.json(
        { message: `Not enough unique characters available. Need ${joinedPlayers.length} characters, but only ${shuffledCharacters.length} are active.` },
        { status: 400 }
      )
    }

    if (shuffledWords.length < joinedPlayers.length) {
      return NextResponse.json(
        { message: `Not enough unique words available. Need ${joinedPlayers.length} word sets, but only ${shuffledWords.length} are available.` },
        { status: 400 }
      )
    }
    
    // Update players with their own unique word deck, targets, and unique random characters
    for (let i = 0; i < shuffledPlayers.length; i++) {
      const player = shuffledPlayers[i]
      const word = shuffledWords[i] // Each player gets their own unique word deck
      const targetPlayer = shuffledPlayers[(i + 1) % shuffledPlayers.length]
      const assignedCharacter = shuffledCharacters[i] // Each player gets a unique character

      await prisma.gamePlayer.update({
        where: { id: player.id },
        data: {
          word1: word.word1, // Player's own words to speak
          word2: word.word2, // Player's own words to speak
          word3: word.word3, // Player's own words to speak
          targetId: targetPlayer.id, // Who they need to speak to
          position: i + 1,
          characterId: assignedCharacter.id // Assign unique random character
        }
      })
    }

    // Update room status
    const updatedRoom = await prisma.gameRoom.update({
      where: { id: room.id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        currentRound: 1
      },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            },
            character: {
              select: {
                id: true,
                name: true,
                imageUrl: true
              }
            },
            target: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatar: true
                  }
                },
                character: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true
                  }
                }
              }
            }
          },
          orderBy: { position: 'asc' }
        },
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    })

    // Create game log
    await prisma.gameLog.create({
      data: {
        roomId: room.id,
        type: 'game_start',
        message: 'Game started! Players have been assigned their words and targets.',
        data: {
          playerCount: room.players.length,
          wordCount: words.length
        }
      }
    })

    // Notify all players via Pusher
    if (pusher) {
      try {
        await pusher.trigger(`room-${params.code}`, 'game-started', {
          room: updatedRoom
        })
        console.log('✅ Pusher notification sent for mobile game started')
      } catch (pusherError) {
        console.error('❌ Pusher notification failed (non-critical):', pusherError)
        // Don't fail the start operation if Pusher fails
      }
    } else {
      console.warn('⚠️ Pusher not configured - skipping real-time notification')
    }

    // Send FCM notifications to all joined players
    try {
      const joinedPlayers = room.players.filter(p => p.joinStatus === 'JOINED')
      const joinedPlayerIds = joinedPlayers.map(p => p.userId)
      await GameNotifications.gameStarted(
        joinedPlayerIds,
        room.name,
        params.code
      )
      console.log(`✅ FCM notifications sent to ${joinedPlayerIds.length} players about game start`)
    } catch (fcmError) {
      console.error('❌ FCM notification failed (non-critical):', fcmError)
      // Don't fail the start operation if FCM fails
    }

    return NextResponse.json({
      message: 'Game started successfully',
      room: updatedRoom
    })

  } catch (error) {
    console.error('Error starting game:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
