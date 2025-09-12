import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, requireAuth, AuthenticatedUser } from '@/lib/jwt-auth'
import { PrismaClient } from '@prisma/client'
import { pusher } from '@/lib/pusher'
import { z } from 'zod'

const prisma = new PrismaClient()

const killRequestSchema = z.object({
  message: z.string().optional()
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
    const validatedData = killRequestSchema.parse(body)

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

    // Check if there's already a pending kill request
    const existingRequest = await prisma.killConfirmation.findFirst({
      where: {
        roomId: room.id,
        killerId: player.id,
        targetId: targetPlayer.id,
        status: 'pending'
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        { message: 'You already have a pending kill request for this target' },
        { status: 400 }
      )
    }

    // Create kill confirmation request
    const killRequest = await prisma.killConfirmation.create({
      data: {
        roomId: room.id,
        killerId: player.id,
        targetId: targetPlayer.id,
        status: 'pending',
        message: validatedData.message
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
        type: 'kill_request',
        message: `${player.user.username} requests to kill ${targetPlayer.user.username}`,
        playerId: player.id,
        targetId: targetPlayer.id,
        data: {
          killRequestId: killRequest.id,
          message: validatedData.message
        }
      }
    })

    // Notify target player
    if (pusher) {
      await pusher.trigger(`room-${params.code}`, 'kill-request', {
        killRequest,
        killer: player.user,
        target: targetPlayer.user
      })
    }

    return NextResponse.json(
      { 
        message: 'Kill request sent successfully',
        killRequestId: killRequest.id
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

    console.error('Error creating kill request:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
