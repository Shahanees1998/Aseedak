import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import prisma from '@/lib/prisma'
import { pusher } from '@/lib/pusher'
import { GameNotifications } from '@/lib/fcm'


export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!
      const body = await authenticatedReq.json()
      const { targetId } = body

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

      // Find the killer (current user)
      const killer = room.players.find(player => player.userId === user.userId)
      if (!killer) {
        return NextResponse.json(
          { message: 'You are not in this room' },
          { status: 403 }
        )
      }

      if (killer.status !== 'ALIVE') {
        return NextResponse.json(
          { message: 'You are not alive' },
          { status: 400 }
        )
      }

      if (killer.targetId !== targetId) {
        return NextResponse.json(
          { message: 'This is not your target' },
          { status: 400 }
        )
      }

      // Find the target
      const target = room.players.find(player => player.id === targetId)
      if (!target) {
        return NextResponse.json(
          { message: 'Target not found' },
          { status: 404 }
        )
      }

      if (target.status !== 'ALIVE') {
        return NextResponse.json(
          { message: 'Target is already eliminated' },
          { status: 400 }
        )
      }

      // Create elimination request
      const elimination = await prisma.killConfirmation.create({
        data: {
          roomId: room.id,
          killerId: killer.id,
          targetId: target.id,
          status: 'pending',
          message: 'Elimination request'
        },
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

      // Create game log
      await prisma.gameLog.create({
        data: {
          roomId: room.id,
          type: 'elimination_request',
          message: `${killer.user.username} claims they achieved their target ${target.user.username}`,
          playerId: killer.id,
          targetId: target.id,
          data: {
            eliminationId: elimination.id
          }
        }
      })

      // Send real-time notification only to the target user
      if (pusher) {
        try {
          await pusher.trigger(`user-${target.userId}`, 'elimination-request', {
            elimination: {
              id: elimination.id,
              killer: {
                user: killer.user
              },
              words: [killer.word1, killer.word2, killer.word3].filter(Boolean)
            }
          })
          console.log('✅ Pusher notification sent to target user for elimination request')
        } catch (pusherError) {
          console.error('❌ Pusher notification failed (non-critical):', pusherError)
        }
      }

      // Send FCM notification to target user
      try {
        const words = [killer.word1, killer.word2, killer.word3].filter((word): word is string => word !== null)
        await GameNotifications.eliminationRequest(
          target.userId,
          killer.user.username,
          words,
          room.code
        )
        console.log('✅ FCM notification sent to target user for elimination request')
      } catch (fcmError) {
        console.error('❌ FCM notification failed (non-critical):', fcmError)
      }

      return NextResponse.json(
        { 
          message: 'Elimination request sent successfully',
          elimination: {
            id: elimination.id,
            status: elimination.status
          }
        },
        { status: 200 }
      )

    } catch (error) {
      console.error('Error creating elimination request:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } 
  })
}
