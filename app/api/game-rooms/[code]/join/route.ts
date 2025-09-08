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
    const existingPlayer = room.players.find(player => player.userId === session.user.id)
    if (existingPlayer) {
      return NextResponse.json(
        { message: 'You are already in this room' },
        { status: 400 }
      )
    }

    // Add player to room
    const newPlayer = await prisma.gamePlayer.create({
      data: {
        userId: session.user.id,
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
      where: { id: room.id },
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

    // Notify other players
    await pusher.trigger(`room-${params.code}`, 'player-joined', {
      room: updatedRoom,
      player: newPlayer.user
    })

    return NextResponse.json(
      { 
        message: 'Successfully joined room',
        room: updatedRoom 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error joining room:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
