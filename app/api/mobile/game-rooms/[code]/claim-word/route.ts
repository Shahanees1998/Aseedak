import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { pusher } from '@/lib/pusher'

const prisma = new PrismaClient()

const claimWordSchema = z.object({
  claimedWord: z.string().min(1, 'Word is required')
})

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
  } catch (error) {
    return null
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = claimWordSchema.parse(body)

    // Get room and player info
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

    if (room.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { message: 'Game is not in progress' },
        { status: 400 }
      )
    }

    // Find current player
    const currentPlayer = room.players.find(p => p.userId === user.userId)
    if (!currentPlayer) {
      return NextResponse.json(
        { message: 'You are not in this room' },
        { status: 403 }
      )
    }

    if (currentPlayer.status !== 'ALIVE') {
      return NextResponse.json(
        { message: 'You are not alive' },
        { status: 400 }
      )
    }

    if (!currentPlayer.target) {
      return NextResponse.json(
        { message: 'No target assigned' },
        { status: 400 }
      )
    }

    // Check if claimed word matches target's words
    const targetWords = [
      currentPlayer.target.word1,
      currentPlayer.target.word2,
      currentPlayer.target.word3
    ].filter(Boolean)

    if (!targetWords.includes(validatedData.claimedWord)) {
      return NextResponse.json(
        { message: 'Word does not match target\'s assigned words' },
        { status: 400 }
      )
    }

    // Create kill confirmation
    const killConfirmation = await prisma.killConfirmation.create({
      data: {
        roomId: room.id,
        killerId: currentPlayer.id,
        targetId: currentPlayer.target.id,
        status: 'pending',
        message: `Claims target said: "${validatedData.claimedWord}"`
      },
      include: {
        killer: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
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
      }
    })

    // Create game log
    await prisma.gameLog.create({
      data: {
        roomId: room.id,
        type: 'word_claim',
        message: `${currentPlayer.user.username} claims ${currentPlayer.target.user.username} said "${validatedData.claimedWord}"`,
        playerId: currentPlayer.id,
        targetId: currentPlayer.target.id,
        data: {
          claimedWord: validatedData.claimedWord
        }
      }
    })

    // Notify target via Pusher
    await pusher.trigger(`room-${params.code}`, 'word-claim', {
      killConfirmation,
      claimedWord: validatedData.claimedWord
    })

    return NextResponse.json({
      message: 'Word claim submitted. Waiting for target confirmation.',
      killConfirmation: {
        id: killConfirmation.id,
        status: killConfirmation.status,
        claimedWord: validatedData.claimedWord,
        target: killConfirmation.target.user
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Mobile word claim error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
