import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, requireAuth, AuthenticatedUser } from '@/lib/jwt-auth'
import { PrismaClient } from '@prisma/client'
import { pusher } from '@/lib/pusher'
import { GameNotifications } from '@/lib/fcm'
import { z } from 'zod'

const prisma = new PrismaClient()

const confirmKillSchema = z.object({
  killRequestId: z.string().min(1, 'Kill request ID is required'),
  accepted: z.boolean()
})

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = confirmKillSchema.parse(body)

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

    if (room.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { message: 'Game is not in progress' },
        { status: 400 }
      )
    }

    // Get the kill request
    const killRequest = await prisma.killConfirmation.findUnique({
      where: { id: validatedData.killRequestId },
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
      }
    })

    if (!killRequest) {
      return NextResponse.json(
        { message: 'Kill request not found' },
        { status: 404 }
      )
    }

    // Verify the target player is confirming
    if (killRequest.target.userId !== user.userId) {
      return NextResponse.json(
        { message: 'Only the target player can confirm the kill request' },
        { status: 403 }
      )
    }

    if (killRequest.status !== 'pending') {
      return NextResponse.json(
        { message: 'Kill request has already been responded to' },
        { status: 400 }
      )
    }

    // Update kill request status
    await prisma.killConfirmation.update({
      where: { id: validatedData.killRequestId },
      data: {
        status: validatedData.accepted ? 'accepted' : 'rejected',
        respondedAt: new Date()
      }
    })

    if (validatedData.accepted) {
      // Eliminate target player
      await prisma.gamePlayer.update({
        where: { id: killRequest.targetId },
        data: {
          status: 'ELIMINATED',
          eliminatedAt: new Date()
        }
      })

      // Update killer's kills and transfer target's target AND words to killer
      await prisma.gamePlayer.update({
        where: { id: killRequest.killerId },
        data: {
          kills: killRequest.killer.kills + 1,
          targetId: killRequest.target.targetId,
          word1: killRequest.target.word1,
          word2: killRequest.target.word2,
          word3: killRequest.target.word3
        }
      })

      // Create elimination log
      await prisma.gameLog.create({
        data: {
          roomId: room.id,
          type: 'elimination',
          message: `${killRequest.target.user.username} was eliminated by ${killRequest.killer.user.username}!`,
          playerId: killRequest.killerId,
          targetId: killRequest.targetId,
          data: {
            eliminatedPlayer: killRequest.target.user,
            killerPlayer: killRequest.killer.user,
            killRequestId: validatedData.killRequestId
          }
        }
      })

      // Check if game should end
      const alivePlayers = await prisma.gamePlayer.count({
        where: {
          roomId: room.id,
          status: 'ALIVE'
        }
      })

      if (alivePlayers <= 1) {
        // Game ended - find winner
        const winner = await prisma.gamePlayer.findFirst({
          where: {
            roomId: room.id,
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

        if (winner) {
          // Update winner status
          await prisma.gamePlayer.update({
            where: { id: winner.id },
            data: { status: 'WINNER' }
          })

          // Update room status
          await prisma.gameRoom.update({
            where: { id: room.id },
            data: {
              status: 'FINISHED',
              finishedAt: new Date()
            }
          })

          // Update user statistics
          await prisma.user.update({
            where: { id: winner.userId },
            data: {
              gamesPlayed: { increment: 1 },
              gamesWon: { increment: 1 }
            }
          })

          // Update other JOINED players' statistics (exclude INVITED players)
          await prisma.user.updateMany({
            where: {
              id: {
                in: room.players
                  .filter(p => p.userId !== winner.userId && p.joinStatus === 'JOINED')
                  .map(p => p.userId)
              }
            },
            data: {
              gamesPlayed: { increment: 1 }
            }
          })

          // Create game end log
          await prisma.gameLog.create({
            data: {
              roomId: room.id,
              type: 'game_end',
              message: `Game ended! ${winner.user.username} won!`,
              playerId: winner.id,
              data: {
                winner: winner.user
              }
            }
          })

          // Notify all players
          if (pusher) {
            await pusher.trigger(`room-${params.code}`, 'game-ended', {
            room: await prisma.gameRoom.findUnique({
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
            }),
            winner: winner.user
          })
          }

          // Send FCM notifications to all joined players about game end and winner
          const joinedPlayers = room.players.filter(p => p.joinStatus === 'JOINED')
          const participantIds = joinedPlayers.map(p => p.userId)
          
          try {
            // Notify about game end
            await GameNotifications.gameEnded(participantIds, room.name, room.code)
            
            // Notify about winner
            await GameNotifications.gameWinner(participantIds, winner.user.username, room.name, room.code)
            
            console.log(`✅ FCM notifications sent to ${participantIds.length} players about game end and winner`)
          } catch (fcmError) {
            console.error('❌ FCM notification failed (non-critical):', fcmError)
          }
        }
      } else {
        // Continue game - notify elimination
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

        if (pusher) {
          await pusher.trigger(`room-${params.code}`, 'elimination', {
            room: updatedRoom,
            eliminatedPlayer: killRequest.target.user,
            killerPlayer: killRequest.killer.user,
            log: await prisma.gameLog.findFirst({
              where: {
                roomId: room.id,
                type: 'elimination'
              },
              orderBy: { createdAt: 'desc' }
            })
          })
        }
      }
    } else {
      // Kill request was rejected - create log
      await prisma.gameLog.create({
        data: {
          roomId: room.id,
          type: 'kill_rejected',
          message: `${killRequest.killer.user.username}'s kill request was rejected by ${killRequest.target.user.username}`,
          playerId: killRequest.killerId,
          targetId: killRequest.targetId,
          data: {
            killRequestId: validatedData.killRequestId,
            killer: killRequest.killer.user,
            target: killRequest.target.user
          }
        }
      })

      // Notify killer about rejection
      if (pusher) {
        await pusher.trigger(`room-${params.code}`, 'kill-rejected', {
          killRequest,
          killer: killRequest.killer.user,
          target: killRequest.target.user
        })
      }
    }

    return NextResponse.json(
      { 
        message: `Kill request ${validatedData.accepted ? 'accepted' : 'rejected'} successfully`
      },
      { status: 200 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error confirming kill:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
