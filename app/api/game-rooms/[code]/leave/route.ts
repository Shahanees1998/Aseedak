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

      const player = room.players.find(p => p.userId === user.userId)
      if (!player) {
        return NextResponse.json(
          { message: 'You are not in this room' },
          { status: 400 }
        )
      }

      // First, update any players who target this player to have a new target
      const playersTargetingThisPlayer = await prisma.gamePlayer.findMany({
        where: { targetId: player.id }
      })

      if (playersTargetingThisPlayer.length > 0) {
        // Find remaining players (excluding the one leaving)
        const remainingPlayers = room.players.filter(p => p.id !== player.id)
        
        if (remainingPlayers.length > 0) {
          // Assign new targets to players who were targeting the leaving player
          for (const targetingPlayer of playersTargetingThisPlayer) {
            // Find a new target (not themselves and not the leaving player)
            const newTarget = remainingPlayers.find(p => p.id !== targetingPlayer.id)
            if (newTarget) {
              await prisma.gamePlayer.update({
                where: { id: targetingPlayer.id },
                data: { targetId: newTarget.id }
              })
            }
          }
        }
      }

      // Now remove player from room
      await prisma.gamePlayer.delete({
        where: { id: player.id }
      })

      // If this was the creator and there are other players, transfer ownership
      if (room.createdBy === user.userId && room.players.length > 1) {
        const nextPlayer = room.players.find(p => p.userId !== user.userId)
        if (nextPlayer) {
          await prisma.gameRoom.update({
            where: { id: room.id },
            data: { createdBy: nextPlayer.userId }
          })
        }
      }

    // If no players left, delete the room
    if (room.players.length === 1) {
      await prisma.gameRoom.delete({
        where: { id: room.id }
      })
    } else {
      // Get updated room data
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

      // Notify other players (optional - don't fail if Pusher is down)
      if (pusher) {
        try {
          await pusher.trigger(`room-${params.code}`, 'player-left', {
            room: updatedRoom,
            player: player.user
          })
          console.log('✅ Pusher notification sent for player left')
        } catch (pusherError) {
          console.error('❌ Pusher notification failed (non-critical):', pusherError)
          // Don't fail the leave operation if Pusher fails
        }
      } else {
        console.warn('⚠️ Pusher not configured - skipping real-time notification')
      }

      // Send FCM notifications to other room members
      try {
        const otherMemberIds = updatedRoom?.players
          .filter(p => p.userId !== user.userId)
          .map(p => p.userId) || []
        
        if (otherMemberIds.length > 0) {
          await GameNotifications.playerLeft(
            otherMemberIds,
            player.user.username,
            room.name,
            room.code
          )
          console.log(`✅ FCM notifications sent to ${otherMemberIds.length} room members`)
        }
      } catch (fcmError) {
        console.error('❌ FCM notification failed (non-critical):', fcmError)
        // Don't fail the leave operation if FCM fails
      }
    }

      return NextResponse.json(
        { message: 'Successfully left room' },
        { status: 200 }
      )

    } catch (error) {
      console.error('Error leaving room:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}
