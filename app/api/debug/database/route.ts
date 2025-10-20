import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get all game rooms with their players
    const gameRooms = await prisma.gameRoom.findMany({
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true
          }
        },
        players: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatar: true
              }
            }
          },
          orderBy: {
            position: 'asc'
          }
        },
        _count: {
          select: {
            players: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get all game players with room info
    const gamePlayers = await prisma.gamePlayer.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true
          }
        },
        room: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
            maxPlayers: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get recent activity (last 10 player joins)
    const recentJoins = await prisma.gamePlayer.findMany({
      include: {
        user: {
          select: {
            username: true,
            avatar: true
          }
        },
        room: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    return NextResponse.json({
      message: 'Database debug information',
      summary: {
        totalRooms: gameRooms.length,
        totalPlayers: gamePlayers.length,
        activeRooms: gameRooms.filter(room => room.status === 'WAITING').length,
        gamesInProgress: gameRooms.filter(room => room.status === 'IN_PROGRESS').length
      },
      gameRooms: gameRooms.map(room => ({
        id: room.id,
        name: room.name,
        code: room.code,
        status: room.status,
        maxPlayers: room.maxPlayers,
        currentPlayers: room._count.players,
        creator: room.creator,
        players: room.players.map(player => ({
          id: player.id,
          position: player.position,
          status: player.status,
          kills: player.kills,
          user: player.user,
          joinedAt: player.createdAt
        })),
        createdAt: room.createdAt,
        startedAt: room.startedAt
      })),
      recentJoins: recentJoins.map(join => ({
        id: join.id,
        username: join.user.username,
        avatar: join.user.avatar,
        roomName: join.room.name,
        roomCode: join.room.code,
        position: join.position,
        joinedAt: join.createdAt
      }))
    })

  } catch (error) {
    console.error('Database debug error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch database information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

