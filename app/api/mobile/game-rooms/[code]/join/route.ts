import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

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

    if (room.status !== 'WAITING') {
      return NextResponse.json(
        { message: 'Game has already started' },
        { status: 400 }
      )
    }

    if (room.players.length >= room.maxPlayers) {
      return NextResponse.json(
        { message: 'Room is full' },
        { status: 400 }
      )
    }

    // Check if user is already in the room
    const existingPlayer = room.players.find(player => player.userId === user.userId)
    if (existingPlayer) {
      return NextResponse.json(
        { message: 'You are already in this room' },
        { status: 400 }
      )
    }

    // Add player to room
    const newPlayer = await prisma.gamePlayer.create({
      data: {
        userId: user.userId,
        roomId: room.id,
        position: room.players.length + 1,
        status: 'ALIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    })

    // Get updated room data
    const updatedRoom = await prisma.gameRoom.findUnique({
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

    return NextResponse.json({
      message: 'Successfully joined room',
      room: updatedRoom
    })

  } catch (error) {
    console.error('Mobile join room error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
