import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndExpiration, AuthenticatedRequest } from '@/lib/apiMiddleware'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  return withAuthAndExpiration(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const gameRooms = await prisma.gameRoom.findMany({
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          },
          players: {
            select: {
              id: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Transform the data to include player count
      const gameRoomsWithPlayerCount = gameRooms.map(room => ({
        id: room.id,
        name: room.name,
        code: room.code,
        maxPlayers: room.maxPlayers,
        status: room.status,
        currentRound: room.currentRound,
        timeLimit: room.timeLimit,
        playerCount: room.players.length,
        creator: room.creator,
        createdAt: room.createdAt.toISOString(),
        startedAt: room.startedAt?.toISOString(),
        finishedAt: room.finishedAt?.toISOString()
      }))

      return NextResponse.json({ gameRooms: gameRoomsWithPlayerCount })

    } catch (error) {
      console.error('Error fetching game rooms:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  });
}
