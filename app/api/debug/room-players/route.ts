import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomCode = searchParams.get('code')
    
    if (!roomCode) {
      return NextResponse.json({ error: 'Room code is required' }, { status: 400 })
    }

    // Get room with all players
    const room = await prisma.gameRoom.findUnique({
      where: { code: roomCode },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { position: 'asc' }
        },
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Format the response to show join tracking
    const response = {
      room: {
        id: room.id,
        name: room.name,
        code: room.code,
        status: room.status,
        maxPlayers: room.maxPlayers,
        createdAt: room.createdAt,
        creator: room.creator
      },
      players: room.players.map((player, index) => ({
        playerId: player.id,
        position: player.position,
        status: player.status,
        kills: player.kills,
        joinedAt: player.createdAt,
        user: {
          id: player.user.id,
          username: player.user.username,
          email: player.user.email,
          firstName: player.user.firstName,
          lastName: player.user.lastName,
          avatar: player.user.avatar
        },
        isCreator: player.userId === room.createdBy
      })),
      summary: {
        totalPlayers: room.players.length,
        maxPlayers: room.maxPlayers,
        availableSlots: room.maxPlayers - room.players.length,
        playersByStatus: {
          alive: room.players.filter(p => p.status === 'ALIVE').length,
          eliminated: room.players.filter(p => p.status === 'ELIMINATED').length,
          winner: room.players.filter(p => p.status === 'WINNER').length
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching room players:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

