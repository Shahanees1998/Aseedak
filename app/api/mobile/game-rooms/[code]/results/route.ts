import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'


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
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          },
          orderBy: [
            { status: 'asc' }, // WINNER first, then ALIVE, then ELIMINATED
            { kills: 'desc' },
            { createdAt: 'asc' }
          ]
        },
        gameLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20 // Last 20 game events
        }
      }
    })

    if (!room) {
      return NextResponse.json(
        { message: 'Room not found' },
        { status: 404 }
      )
    }

    // Check if user was in this room
    const userPlayer = room.players.find(p => p.userId === decoded.userId)
    if (!userPlayer) {
      return NextResponse.json(
        { message: 'You were not in this room' },
        { status: 403 }
      )
    }

    // Determine winner
    const winner = room.players.find(p => p.status === 'WINNER')
    const alivePlayers = room.players.filter(p => p.status === 'ALIVE')
    const eliminatedPlayers = room.players.filter(p => p.status === 'ELIMINATED')

    // Calculate game statistics
    const gameStats = {
      totalPlayers: room.players.length,
      alivePlayers: alivePlayers.length,
      eliminatedPlayers: eliminatedPlayers.length,
      gameDuration: room.startedAt && room.finishedAt 
        ? Math.floor((room.finishedAt.getTime() - room.startedAt.getTime()) / 1000)
        : null,
      totalKills: room.players.reduce((sum, p) => sum + p.kills, 0)
    }

    return NextResponse.json({
      results: {
        room: {
          id: room.id,
          code: room.code,
          name: room.name,
          status: room.status,
          startedAt: room.startedAt,
          finishedAt: room.finishedAt,
          currentRound: room.currentRound
        },
        winner: winner ? {
          id: winner.id,
          username: winner.user.username,
          avatar: winner.user.avatar,
          kills: winner.kills,
          position: winner.position
        } : null,
        leaderboard: room.players.map((player, index) => ({
          rank: index + 1,
          id: player.id,
          username: player.user.username,
          avatar: player.user.avatar,
          status: player.status,
          kills: player.kills,
          position: player.position,
          eliminatedAt: player.eliminatedAt
        })),
        gameStats,
        gameLogs: room.gameLogs.map(log => ({
          id: log.id,
          type: log.type,
          message: log.message,
          createdAt: log.createdAt,
          playerId: log.playerId,
          targetId: log.targetId
        })),
        userResult: {
          rank: room.players.findIndex(p => p.id === userPlayer.id) + 1,
          status: userPlayer.status,
          kills: userPlayer.kills,
          position: userPlayer.position,
          eliminatedAt: userPlayer.eliminatedAt
        }
      }
    })

  } catch (error) {
    console.error('Error getting game results:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
