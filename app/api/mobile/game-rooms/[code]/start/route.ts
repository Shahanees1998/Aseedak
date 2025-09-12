import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
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

    // Shuffle only joined players and assign targets
    const shuffledPlayers = [...joinedPlayers].sort(() => 0.5 - Math.random())
    
    // Update players with their own word deck and targets
    for (let i = 0; i < shuffledPlayers.length; i++) {
      const player = shuffledPlayers[i]
      const word = words[i] // Each player gets their own word deck
      const targetPlayer = shuffledPlayers[(i + 1) % shuffledPlayers.length]

      await prisma.gamePlayer.update({
        where: { id: player.id },
        data: {
          word1: word.word1, // Player's own words to speak
          word2: word.word2, // Player's own words to speak
          word3: word.word3, // Player's own words to speak
          targetId: targetPlayer.id, // Who they need to speak to
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
            },
            target: {
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
  } finally {
    await prisma.$disconnect()
  }
}
