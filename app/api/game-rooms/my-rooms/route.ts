import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!

      // Get all rooms where the user is a player
      const userRooms = await prisma.gameRoom.findMany({
        where: {
          players: {
            some: {
              userId: user.userId
            }
          }
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
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
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Transform the data to include user-specific information
      const roomsWithUserInfo = userRooms.map(room => {
        const userPlayer = room.players.find(p => p.userId === user.userId)
        const joinedPlayers = room.players.filter(p => p.joinStatus === 'JOINED')
        
        return {
          id: room.id,
          name: room.name,
          code: room.code,
          maxPlayers: room.maxPlayers,
          status: room.status,
          currentRound: room.currentRound,
          timeLimit: room.timeLimit,
          playerCount: joinedPlayers.length,
          totalPlayers: room.players.length,
          creator: room.creator,
          userRole: userPlayer?.userId === room.createdBy ? 'CREATOR' : 'PLAYER',
          userJoinStatus: userPlayer?.joinStatus || 'NOT_JOINED',
          userPosition: userPlayer?.position || null,
          userStatus: userPlayer?.status || null,
          createdAt: room.createdAt.toISOString(),
          startedAt: room.startedAt?.toISOString(),
          finishedAt: room.finishedAt?.toISOString(),
          players: room.players.map(p => ({
            id: p.id,
            position: p.position,
            status: p.status,
            joinStatus: p.joinStatus,
            kills: p.kills,
            eliminatedAt: p.eliminatedAt,
            user: p.user
          }))
        }
      })

      return NextResponse.json({ 
        rooms: roomsWithUserInfo,
        total: roomsWithUserInfo.length
      })

    } catch (error) {
      console.error('Error fetching user rooms:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}
