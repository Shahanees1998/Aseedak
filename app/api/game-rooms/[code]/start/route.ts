import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'
import { pusher } from '@/lib/pusher'
import { GameNotifications } from '@/lib/fcm'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!

    const room = await prisma.gameRoom.findUnique({
      where: { code: params.code },
      include: {
        players: true
      }
    })

    if (!room) {
      return NextResponse.json(
        { message: 'Room not found' },
        { status: 404 }
      )
    }

      if (room.createdBy !== user.userId) {
        return NextResponse.json(
          { message: 'Only the room creator can start the game' },
          { status: 403 }
        )
      }

    if (room.status !== 'WAITING') {
      return NextResponse.json(
        { message: 'Game has already started' },
        { status: 400 }
      )
    }

    // Check if there are enough joined players to start
    const joinedPlayers = room.players.filter(p => p.joinStatus === 'JOINED')
    if (joinedPlayers.length < 2) {
      return NextResponse.json(
        { message: 'Need at least 2 joined players to start the game' },
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
        { message: 'Not enough words available' },
        { status: 400 }
      )
    }

    // Get active characters for random assignment
    const characters = await prisma.character.findMany({
      where: { isActive: true }
    })

    if (characters.length === 0) {
      return NextResponse.json(
        { message: 'No active characters available for the game' },
        { status: 400 }
      )
    }

    // Shuffle only joined players and assign targets
    const shuffledPlayers = [...joinedPlayers].sort(() => 0.5 - Math.random())
    const shuffledCharacters = [...characters].sort(() => 0.5 - Math.random())
    
    // Update players with their own word deck, targets, and random characters
    for (let i = 0; i < shuffledPlayers.length; i++) {
      const player = shuffledPlayers[i]
      const word = words[i] // Each player gets their own word deck
      const targetPlayer = shuffledPlayers[(i + 1) % shuffledPlayers.length]
      const assignedCharacter = shuffledCharacters[i % shuffledCharacters.length] // Cycle through characters

      await prisma.gamePlayer.update({
        where: { id: player.id },
        data: {
          word1: word.word1, // Player's own words to speak
          word2: word.word2, // Player's own words to speak  
          word3: word.word3, // Player's own words to speak
          targetId: targetPlayer.id, // Who they need to speak to
          position: i + 1,
          characterId: assignedCharacter.id // Assign random character
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

    // Notify all players
    if (pusher) {
      await pusher.trigger(`room-${params.code}`, 'game-started', {
        room: updatedRoom
      })
    }

    // Send FCM notifications to all joined players
    for (const player of joinedPlayers) {
      try {
        await GameNotifications.gameStarted(
          player.userId,
          room.name,
          room.code
        )
      } catch (error) {
        console.error(`Failed to send game start notification to user ${player.userId}:`, error)
      }
    }

      return NextResponse.json(
        { 
          message: 'Game started successfully',
          room: updatedRoom 
        },
        { status: 200 }
      )

    } catch (error) {
      console.error('Error starting game:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}
