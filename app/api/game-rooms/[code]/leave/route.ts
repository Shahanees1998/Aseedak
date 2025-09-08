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

    const player = room.players.find(p => p.userId === session.user.id)
    if (!player) {
      return NextResponse.json(
        { message: 'You are not in this room' },
        { status: 400 }
      )
    }

    // Remove player from room
    await prisma.gamePlayer.delete({
      where: { id: player.id }
    })

    // If this was the creator and there are other players, transfer ownership
    if (room.createdBy === session.user.id && room.players.length > 1) {
      const nextPlayer = room.players.find(p => p.userId !== session.user.id)
      if (nextPlayer) {
        await prisma.gameRoom.update({
          where: { id: room.id },
          data: { createdBy: nextPlayer.userId }
        })
      }
    }

    // If no players left, delete the room
    if (room.players.length === 1) {
      await prisma.gameRoom.delete({
        where: { id: room.id }
      })
    } else {
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
      await pusher.trigger(`room-${params.code}`, 'player-left', {
        room: updatedRoom,
        player: player.user
      })
    }

    return NextResponse.json(
      { message: 'Successfully left room' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error leaving room:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
