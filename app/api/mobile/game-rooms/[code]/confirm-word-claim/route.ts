import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { pusher } from '@/lib/pusher'

const prisma = new PrismaClient()

const confirmWordClaimSchema = z.object({
  killConfirmationId: z.string(),
  accepted: z.boolean()
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
    const validatedData = confirmWordClaimSchema.parse(body)

    // Get kill confirmation
    const killConfirmation = await prisma.killConfirmation.findUnique({
      where: { id: validatedData.killConfirmationId },
      include: {
        room: true,
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

    if (!killConfirmation) {
      return NextResponse.json(
        { message: 'Kill confirmation not found' },
        { status: 404 }
      )
    }

    if (killConfirmation.target.userId !== user.userId) {
      return NextResponse.json(
        { message: 'You are not the target of this claim' },
        { status: 403 }
      )
    }

    if (killConfirmation.status !== 'pending') {
      return NextResponse.json(
        { message: 'This claim has already been processed' },
        { status: 400 }
      )
    }

    // Update kill confirmation status
    const status = validatedData.accepted ? 'accepted' : 'rejected'
    await prisma.killConfirmation.update({
      where: { id: validatedData.killConfirmationId },
      data: {
        status,
        respondedAt: new Date()
      }
    })

    if (validatedData.accepted) {
      // Target is eliminated
      await prisma.gamePlayer.update({
        where: { id: killConfirmation.target.id },
        data: {
          status: 'ELIMINATED',
          eliminatedAt: new Date()
        }
      })

      // Transfer target to killer
      await prisma.gamePlayer.update({
        where: { id: killConfirmation.killer.id },
        data: {
          targetId: killConfirmation.target.targetId,
          kills: { increment: 1 }
        }
      })

      // Create elimination log
      await prisma.gameLog.create({
        data: {
          roomId: killConfirmation.room.id,
          type: 'elimination',
          message: `${killConfirmation.target.user.username} was eliminated by ${killConfirmation.killer.user.username}`,
          playerId: killConfirmation.killer.id,
          targetId: killConfirmation.target.id
        }
      })

      // Check if game is over (only one player left)
      const alivePlayers = await prisma.gamePlayer.findMany({
        where: {
          roomId: killConfirmation.room.id,
          status: 'ALIVE'
        }
      })

      if (alivePlayers.length === 1) {
        // Game over - declare winner
        await prisma.gamePlayer.update({
          where: { id: alivePlayers[0].id },
          data: { status: 'WINNER' }
        })

        await prisma.gameRoom.update({
          where: { id: killConfirmation.room.id },
          data: {
            status: 'FINISHED',
            finishedAt: new Date()
          }
        })

        await prisma.gameLog.create({
          data: {
            roomId: killConfirmation.room.id,
            type: 'game_end',
            message: `Game over! ${alivePlayers[0].user.username} wins!`,
            playerId: alivePlayers[0].id
          }
        })

        // Notify all players
        await pusher.trigger(`room-${params.code}`, 'game-ended', {
          winner: alivePlayers[0].user,
          message: 'Game over!'
        })
      } else {
        // Notify elimination
        await pusher.trigger(`room-${params.code}`, 'elimination', {
          eliminatedPlayer: killConfirmation.target.user,
          killer: killConfirmation.killer.user,
          message: `${killConfirmation.target.user.username} was eliminated!`
        })
      }
    } else {
      // Create rejection log
      await prisma.gameLog.create({
        data: {
          roomId: killConfirmation.room.id,
          type: 'word_claim',
          message: `${killConfirmation.killer.user.username}'s claim was rejected by ${killConfirmation.target.user.username}`,
          playerId: killConfirmation.killer.id,
          targetId: killConfirmation.target.id
        }
      })

      // Notify rejection
      await pusher.trigger(`room-${params.code}`, 'claim-rejected', {
        killer: killConfirmation.killer.user,
        target: killConfirmation.target.user,
        message: 'Word claim was rejected'
      })
    }

    return NextResponse.json({
      message: validatedData.accepted ? 'Target eliminated!' : 'Claim rejected',
      accepted: validatedData.accepted
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Mobile word claim confirmation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
