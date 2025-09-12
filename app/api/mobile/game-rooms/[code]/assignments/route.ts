import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function GET(
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
          where: { userId: decoded.userId },
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

    const player = room.players[0]
    if (!player) {
      return NextResponse.json(
        { message: 'You are not in this room' },
        { status: 403 }
      )
    }

    // Return player's private assignments
    return NextResponse.json({
      assignments: {
        player: {
          id: player.id,
          username: player.user.username,
          avatar: player.user.avatar,
          status: player.status,
          position: player.position
        },
        target: player.target ? {
          id: player.target.id,
          username: player.target.user.username,
          avatar: player.target.user.avatar
        } : null,
        myWords: {
          word1: player.word1,
          word2: player.word2,
          word3: player.word3
        },
        character: {
          // TODO: Add character assignment when implemented
          name: 'Default Character',
          description: 'A mysterious character'
        },
        gameStatus: room.status,
        currentRound: room.currentRound
      }
    })

  } catch (error) {
    console.error('Error getting assignments:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
