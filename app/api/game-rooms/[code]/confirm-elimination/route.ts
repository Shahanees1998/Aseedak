import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'
import { pusher } from '@/lib/pusher'
import { GameNotifications } from '@/lib/fcm'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!
      const body = await authenticatedReq.json()
      const { eliminationId, confirmed } = body

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

      if (room.status !== 'IN_PROGRESS') {
        return NextResponse.json(
          { message: 'Game is not in progress' },
          { status: 400 }
        )
      }

      // Find the elimination request
      const elimination = await prisma.killConfirmation.findUnique({
        where: { id: eliminationId },
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

      if (!elimination) {
        return NextResponse.json(
          { message: 'Elimination request not found' },
          { status: 404 }
        )
      }

      if (elimination.status !== 'pending') {
        return NextResponse.json(
          { message: 'Elimination request already processed' },
          { status: 400 }
        )
      }

      // Check if the current user is the target
      if (elimination.target.userId !== user.userId) {
        return NextResponse.json(
          { message: 'You are not the target of this elimination' },
          { status: 403 }
        )
      }

      // Update elimination status
      await prisma.killConfirmation.update({
        where: { id: eliminationId },
        data: {
          status: confirmed ? 'accepted' : 'rejected',
          respondedAt: new Date()
        }
      })

      let updatedRoom = room
      let message = ''

      if (confirmed) {
        // Eliminate the target
        await prisma.gamePlayer.update({
          where: { id: elimination.targetId },
          data: {
            status: 'ELIMINATED',
            eliminatedAt: new Date()
          }
        })

        // Update killer's stats
        await prisma.gamePlayer.update({
          where: { id: elimination.killerId },
          data: {
            kills: { increment: 1 }
          }
        })

        // Check if game should end (only one joined player left)
        const aliveJoinedPlayers = room.players.filter(p => 
          p.id !== elimination.targetId && 
          p.status === 'ALIVE' && 
          p.joinStatus === 'JOINED'
        )
        
        if (aliveJoinedPlayers.length <= 1) {
          // Game ends - winner is the last alive joined player
          const winner = aliveJoinedPlayers[0]
          if (winner) {
            await prisma.gamePlayer.update({
              where: { id: winner.id },
              data: { status: 'WINNER' }
            })

            // Update winner's user statistics
            await prisma.user.update({
              where: { id: winner.userId },
              data: {
                gamesPlayed: { increment: 1 },
                gamesWon: { increment: 1 },
                totalKills: { increment: winner.kills }
              }
            })
          }

          // Update all other JOINED players' statistics (exclude INVITED players)
          const allJoinedPlayers = room.players.filter(p => p.joinStatus === 'JOINED')
          for (const player of allJoinedPlayers) {
            if (player.id !== winner?.id) {
              await prisma.user.update({
                where: { id: player.userId },
                data: {
                  gamesPlayed: { increment: 1 },
                  totalKills: { increment: player.kills }
                }
              })
            }
          }

          await prisma.gameRoom.update({
            where: { id: room.id },
            data: {
              status: 'FINISHED',
              finishedAt: new Date()
            }
          })

          // Send FCM notifications to all joined players about game end
          const joinedPlayers = room.players.filter(p => p.joinStatus === 'JOINED')
          for (const player of joinedPlayers) {
            try {
              await GameNotifications.gameEnded(
                player.userId,
                winner?.user.username || 'No one',
                room.code
              )
            } catch (error) {
              console.error(`Failed to send game end notification to ${player.user.username}:`, error)
            }
          }

          message = `Game ended! ${winner?.user.username || 'No one'} won!`
        } else {
          // Assign new target to killer (only from joined players)
          const remainingJoinedPlayers = room.players.filter(p => 
            p.id !== elimination.targetId && 
            p.status === 'ALIVE' && 
            p.joinStatus === 'JOINED'
          )
          const shuffledPlayers = remainingJoinedPlayers.sort(() => 0.5 - Math.random())
          
          // Find a new target for the killer (not themselves)
          const newTarget = shuffledPlayers.find(p => p.id !== elimination.killerId) || shuffledPlayers[0]
          
          if (newTarget) {
            await prisma.gamePlayer.update({
              where: { id: elimination.killerId },
              data: { targetId: newTarget.id }
            })

            // Send FCM notification to killer about new target
            try {
              const killer = room.players.find(p => p.id === elimination.killerId)
              if (killer) {
                const newWords = [killer.word1, killer.word2, killer.word3].filter((word): word is string => word !== null)
                await GameNotifications.newTargetAssigned(
                  killer.userId,
                  newTarget.user.username,
                  newWords,
                  room.code
                )
              }
            } catch (error) {
              console.error(`Failed to send new target notification to killer:`, error)
            }
          }

          message = `${elimination.target.user.username} has been eliminated by ${elimination.killer.user.username}!`
        }

        // Create game log
        await prisma.gameLog.create({
          data: {
            roomId: room.id,
            type: 'elimination',
            message: `${elimination.killer.user.username} eliminated ${elimination.target.user.username}`,
            playerId: elimination.killerId,
            targetId: elimination.targetId,
            data: {
              confirmed: true,
              eliminationId: eliminationId
            }
          }
        })
      } else {
        message = `${elimination.target.user.username} denied the elimination by ${elimination.killer.user.username}`

        // Create game log
        await prisma.gameLog.create({
          data: {
            roomId: room.id,
            type: 'elimination_denied',
            message: `${elimination.killer.user.username}'s elimination of ${elimination.target.user.username} was denied`,
            playerId: elimination.killerId,
            targetId: elimination.targetId,
            data: {
              confirmed: false,
              eliminationId: eliminationId
            }
          }
        })
      }

      // Get updated room data
      const freshRoom = await prisma.gameRoom.findUnique({
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

      if (freshRoom) {
        updatedRoom = freshRoom
      }

      // Send real-time notification
      if (pusher) {
        try {
          await pusher.trigger(`room-${params.code}`, 'elimination-confirmed', {
            room: updatedRoom,
            message: message,
            elimination: {
              killer: elimination.killer.user,
              target: elimination.target.user,
              confirmed: confirmed
            }
          })
          console.log('✅ Pusher notification sent for elimination confirmation')
        } catch (pusherError) {
          console.error('❌ Pusher notification failed (non-critical):', pusherError)
        }
      }

      return NextResponse.json(
        { 
          message: message,
          room: updatedRoom
        },
        { status: 200 }
      )

    } catch (error) {
      console.error('Error confirming elimination:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}
