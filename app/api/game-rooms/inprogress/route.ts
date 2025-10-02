import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndExpiration } from '@/lib/apiMiddleware'
import { AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  return withAuthAndExpiration(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!

      // Get all rooms where status is IN_PROGRESS and user has joined
      const inProgressRooms = await prisma.gameRoom.findMany({
        where: {
          status: 'IN_PROGRESS',
          players: {
            some: {
              userId: user.userId,
              joinStatus: 'JOINED'
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
            },
            orderBy: { position: 'asc' }
          }
        },
        orderBy: { startedAt: 'desc' }
      })

      // Transform the data to include user-specific information
      const roomsWithUserInfo = inProgressRooms.map(room => {
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
          userTarget: userPlayer?.target ? {
            id: userPlayer.target.id,
            position: userPlayer.target.position,
            status: userPlayer.target.status,
            user: userPlayer.target.user
          } : null,
          userKills: userPlayer?.kills || 0,
          userEliminatedAt: userPlayer?.eliminatedAt?.toISOString() || null,
          createdAt: room.createdAt.toISOString(),
          startedAt: room.startedAt?.toISOString(),
          finishedAt: room.finishedAt?.toISOString(),
          players: room.players.map(p => ({
            id: p.id,
            position: p.position,
            status: p.status,
            joinStatus: p.joinStatus,
            kills: p.kills,
            eliminatedAt: p.eliminatedAt?.toISOString(),
            user: p.user,
            target: p.target ? {
              id: p.target.id,
              position: p.target.position,
              status: p.target.status,
              user: p.target.user
            } : null
          }))
        }
      })

      return NextResponse.json({ 
        rooms: roomsWithUserInfo,
        total: roomsWithUserInfo.length
      })

    } catch (error) {
      console.error('Error fetching in-progress rooms:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}
