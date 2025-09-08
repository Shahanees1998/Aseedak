import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { pusher } from '@/lib/pusher'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

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

    if (room.createdBy !== session.user.id) {
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

    if (room.players.length < 2) {
      return NextResponse.json(
        { message: 'Need at least 2 players to start the game' },
        { status: 400 }
      )
    }

    // Get words for the game
    const words = await prisma.word.findMany({
      where: {
        id: { in: room.wordSet }
      }
    })

    if (words.length < room.players.length) {
      return NextResponse.json(
        { message: 'Not enough words available' },
        { status: 400 }
      )
    }

    // Shuffle players and assign targets
    const shuffledPlayers = [...room.players].sort(() => 0.5 - Math.random())
    
    // Update players with words and targets
    for (let i = 0; i < shuffledPlayers.length; i++) {
      const player = shuffledPlayers[i]
      const word = words[i]
      const targetPlayer = shuffledPlayers[(i + 1) % shuffledPlayers.length]

      await prisma.gamePlayer.update({
        where: { id: player.id },
        data: {
          word1: word.word1,
          word2: word.word2,
          word3: word.word3,
          targetId: targetPlayer.id,
          position: i + 1
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
    await pusher.trigger(`room-${params.code}`, 'game-started', {
      room: updatedRoom
    })

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
}
