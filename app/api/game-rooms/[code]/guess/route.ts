import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, requireAuth, AuthenticatedUser } from '@/lib/jwt-auth'
import { PrismaClient } from '@prisma/client'
import { pusher } from '@/lib/pusher'
import { z } from 'zod'

const prisma = new PrismaClient()

const guessSchema = z.object({
  word: z.string().min(1, 'Word is required')
})

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = guessSchema.parse(body)

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

    if (room.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { message: 'Game is not in progress' },
        { status: 400 }
      )
    }

    const player = room.players.find(p => p.userId === user.userId)
    if (!player) {
      return NextResponse.json(
        { message: 'You are not in this room' },
        { status: 400 }
      )
    }

    if (player.status !== 'ALIVE') {
      return NextResponse.json(
        { message: 'You are eliminated' },
        { status: 400 }
      )
    }

    if (!player.targetId) {
      return NextResponse.json(
        { message: 'No target assigned' },
        { status: 400 }
      )
    }

    const targetPlayer = room.players.find(p => p.id === player.targetId)
    if (!targetPlayer) {
      return NextResponse.json(
        { message: 'Target player not found' },
        { status: 400 }
      )
    }

    // Create guess log
    const guessLog = await prisma.gameLog.create({
      data: {
        roomId: room.id,
        type: 'word_guess',
        message: `${player.user.username} guessed "${validatedData.word}"`,
        playerId: player.id,
        targetId: targetPlayer.id,
        data: {
          word: validatedData.word,
          guesserId: player.id,
          targetId: targetPlayer.id
        }
      }
    })

    // Notify target player
    if (pusher) {
      await pusher.trigger(`room-${params.code}`, 'word-guess', {
        id: guessLog.id,
        word: validatedData.word,
        guesser: player.user,
        target: targetPlayer.user,
        log: guessLog
      })
    }

    return NextResponse.json(
      { 
        message: 'Guess sent successfully',
        guessId: guessLog.id
      },
      { status: 200 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error making guess:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
