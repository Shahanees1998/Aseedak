import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndExpiration } from '@/lib/apiMiddleware'
import { AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  return withAuthAndExpiration(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!

      // Get complete room details with all related data
      const room = await prisma.gameRoom.findUnique({
        where: { code: params.code },
        include: {
          players: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                  email: true,
                  firstName: true,
                  lastName: true
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
              },
              character: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  imageUrl: true,
                  isActive: true
                }
              },
              killerConfirmations: {
                include: {
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
                orderBy: { createdAt: 'desc' }
              },
              targetConfirmations: {
                include: {
                  killer: {
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
                orderBy: { createdAt: 'desc' }
              }
            },
            orderBy: { position: 'asc' }
          },
          creator: {
            select: {
              id: true,
              username: true,
              avatar: true,
              firstName: true,
              lastName: true
            }
          },
          gameLogs: {
            orderBy: { createdAt: 'desc' }
          },
          killConfirmations: {
            include: {
              killer: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                      avatar: true
                    }
                  }
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
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!room) {
        return NextResponse.json(
          { message: 'Room not found' },
          { status: 404 }
        )
      }

      // Get word details for the word set
      const wordDetails = await prisma.word.findMany({
        where: {
          id: { in: room.wordSet }
        },
        select: {
          id: true,
          word1: true,
          word2: true,
          word3: true,
          deck: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      })

      // Find current user's player data
      const currentUserPlayer = room.players.find(p => p.userId === user.userId)

      // Calculate game statistics
      const alivePlayers = room.players.filter(p => p.status === 'ALIVE')
      const eliminatedPlayers = room.players.filter(p => p.status === 'ELIMINATED')
      const joinedPlayers = room.players.filter(p => p.joinStatus === 'JOINED')
      const pendingPlayers = room.players.filter(p => p.joinStatus === 'INVITED')

      // Get recent activity (last 10 game logs)
      const recentActivity = room.gameLogs.slice(0, 10)

      // Get pending confirmations for current user
      const userPendingConfirmations = room.killConfirmations.filter(
        confirmation => 
          (confirmation.killerId === currentUserPlayer?.id && confirmation.status === 'pending') ||
          (confirmation.targetId === currentUserPlayer?.id && confirmation.status === 'pending')
      )

      // Build complete response
      const completeRoomData = {
        // Basic room info
        id: room.id,
        name: room.name,
        code: room.code,
        maxPlayers: room.maxPlayers,
        status: room.status,
        currentRound: room.currentRound,
        timeLimit: room.timeLimit,
        createdAt: room.createdAt.toISOString(),
        startedAt: room.startedAt?.toISOString(),
        finishedAt: room.finishedAt?.toISOString(),
        updatedAt: room.updatedAt.toISOString(),

        // Creator info
        creator: room.creator,

        // Game statistics
        statistics: {
          totalPlayers: room.players.length,
          joinedPlayers: joinedPlayers.length,
          pendingPlayers: pendingPlayers.length,
          alivePlayers: alivePlayers.length,
          eliminatedPlayers: eliminatedPlayers.length,
          totalKills: room.players.reduce((sum, p) => sum + p.kills, 0),
          gameDuration: room.startedAt ? 
            (room.finishedAt ? 
              Math.floor((room.finishedAt.getTime() - room.startedAt.getTime()) / 1000) :
              Math.floor((new Date().getTime() - room.startedAt.getTime()) / 1000)
            ) : 0
        },

        // Word set details
        wordSet: {
          wordIds: room.wordSet,
          words: wordDetails.map(word => ({
            id: word.id,
            word1: word.word1,
            word2: word.word2,
            word3: word.word3,
            deck: word.deck
          }))
        },

        // Players with complete details
        players: room.players.map(player => ({
          id: player.id,
          position: player.position,
          status: player.status,
          joinStatus: player.joinStatus,
          kills: player.kills,
          eliminatedAt: player.eliminatedAt?.toISOString(),
          createdAt: player.createdAt.toISOString(),
          updatedAt: player.updatedAt.toISOString(),
          
          // User details
          user: player.user,
          
          // Target information
          target: player.target ? {
            id: player.target.id,
            position: player.target.position,
            status: player.target.status,
            user: player.target.user
          } : null,
          
          // Character assignment
          character: player.character,
          
          // Assigned words (only show to the player themselves or if game is finished)
          words: (currentUserPlayer?.id === player.id || room.status === 'FINISHED') ? {
            word1: player.word1,
            word2: player.word2,
            word3: player.word3
          } : null,
          
          // Pending confirmations for this player
          pendingConfirmations: {
            asKiller: player.killerConfirmations.filter(c => c.status === 'pending'),
            asTarget: player.targetConfirmations.filter(c => c.status === 'pending')
          }
        })),

        // Game logs (activity history)
        gameLogs: room.gameLogs.map(log => {
          // Find player and target from the players array using playerId and targetId
          const player = log.playerId ? room.players.find(p => p.id === log.playerId) : null
          const target = log.targetId ? room.players.find(p => p.id === log.targetId) : null
          
          return {
            id: log.id,
            type: log.type,
            message: log.message,
            data: log.data,
            createdAt: log.createdAt.toISOString(),
            player: player ? {
              id: player.id,
              user: player.user
            } : null,
            target: target ? {
              id: target.id,
              user: target.user
            } : null
          }
        }),

        // Recent activity (for quick overview)
        recentActivity: recentActivity.map(log => {
          const player = log.playerId ? room.players.find(p => p.id === log.playerId) : null
          const target = log.targetId ? room.players.find(p => p.id === log.targetId) : null
          
          return {
            id: log.id,
            type: log.type,
            message: log.message,
            createdAt: log.createdAt.toISOString(),
            player: player?.user.username,
            target: target?.user.username
          }
        }),

        // All kill confirmations
        killConfirmations: room.killConfirmations.map(confirmation => ({
          id: confirmation.id,
          status: confirmation.status,
          message: confirmation.message,
          createdAt: confirmation.createdAt.toISOString(),
          respondedAt: confirmation.respondedAt?.toISOString(),
          killer: {
            id: confirmation.killer.id,
            user: confirmation.killer.user
          },
          target: {
            id: confirmation.target.id,
            user: confirmation.target.user
          }
        })),

        // Current user specific data
        currentUser: currentUserPlayer ? {
          playerId: currentUserPlayer.id,
          position: currentUserPlayer.position,
          status: currentUserPlayer.status,
          joinStatus: currentUserPlayer.joinStatus,
          kills: currentUserPlayer.kills,
          isCreator: currentUserPlayer.userId === room.createdBy,
          target: currentUserPlayer.target ? {
            id: currentUserPlayer.target.id,
            user: currentUserPlayer.target.user
          } : null,
          character: currentUserPlayer.character,
          words: {
            word1: currentUserPlayer.word1,
            word2: currentUserPlayer.word2,
            word3: currentUserPlayer.word3
          },
          pendingConfirmations: userPendingConfirmations
        } : null
      }

      return NextResponse.json({ 
        success: true,
        room: completeRoomData
      })

    } catch (error) {
      console.error('Error fetching complete room details:', error)
      return NextResponse.json(
        { 
          success: false,
          message: 'Internal server error' 
        },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}
