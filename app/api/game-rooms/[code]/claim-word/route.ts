import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { pusher } from '@/lib/pusher'
import { z } from 'zod'

const prisma = new PrismaClient()

const claimWordSchema = z.object({
  word: z.string().min(1, 'Word is required')
})

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

    const body = await request.json()
    const validatedData = claimWordSchema.parse(body)

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

    const player = room.players.find(p => p.userId === session.user.id)
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

    // Check if there's already a pending word claim
    const existingClaim = await prisma.killConfirmation.findFirst({
      where: {
        roomId: room.id,
        killerId: player.id,
        targetId: targetPlayer.id,
        status: 'pending'
      }
    })

    if (existingClaim) {
      return NextResponse.json(
        { message: 'You already have a pending word claim for this target' },
        { status: 400 }
      )
    }

    // Create word claim
    const wordClaim = await prisma.killConfirmation.create({
      data: {
        roomId: room.id,
        killerId: player.id,
        targetId: targetPlayer.id,
        status: 'pending',
        message: validatedData.word
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
        message: `${player.user.username} claims ${targetPlayer.user.username} said "${validatedData.word}"`,
        playerId: player.id,
        targetId: targetPlayer.id,
        data: {
          wordClaimId: wordClaim.id,
          word: validatedData.word
        }
      }
    })

    // Notify target player
    await pusher.trigger(`room-${params.code}`, 'word-claim', {
      wordClaim,
      killer: player.user,
      target: targetPlayer.user,
      word: validatedData.word
    })

    return NextResponse.json(
      { 
        message: 'Word claim sent successfully',
        wordClaimId: wordClaim.id
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

    console.error('Error claiming word:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
