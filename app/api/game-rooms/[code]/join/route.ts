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

    if (room.status !== 'WAITING') {
      return NextResponse.json(
        { message: 'Game has already started - no new players can join' },
        { status: 400 }
      )
    }

    // Only count players who have actually joined (not just invited)
    const joinedPlayers = room.players.filter(player => player.joinStatus === 'JOINED')
    if (joinedPlayers.length >= room.maxPlayers) {
      return NextResponse.json(
        { message: 'Room is full' },
        { status: 400 }
      )
    }

      // Check if user is already in the room (but allow invited players to join)
      const existingPlayer = room.players.find(player => player.userId === user.userId)
      if (existingPlayer && existingPlayer.joinStatus === 'JOINED') {
        return NextResponse.json(
          { message: 'You are already in this room' },
          { status: 400 }
        )
      }

      // Add player to room (or update existing invited player)
      let newPlayer
      const existingInvitedPlayer = room.players.find(player => 
        player.userId === user.userId && player.joinStatus === 'INVITED'
      )
      
      if (existingInvitedPlayer) {
        // Update existing invited player to joined
        newPlayer = await prisma.gamePlayer.update({
          where: { id: existingInvitedPlayer.id },
          data: { joinStatus: 'JOINED' },
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
      } else {
        // Create new player (for users not invited)
        newPlayer = await prisma.gamePlayer.create({
          data: {
            userId: user.userId,
            roomId: room.id,
            position: room.players.length + 1,
            status: 'ALIVE',
            joinStatus: 'JOINED'
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
      }

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

      // Notify other players (optional - don't fail if Pusher is down)
      if (pusher) {
        try {
          await pusher.trigger(`room-${params.code}`, 'player-joined', {
            room: updatedRoom,
            player: newPlayer.user
          })
          console.log('✅ Pusher notification sent for player joined')
        } catch (pusherError) {
          console.error('❌ Pusher notification failed (non-critical):', pusherError)
          // Don't fail the join operation if Pusher fails
        }
      } else {
        console.warn('⚠️ Pusher not configured - skipping real-time notification')
      }

      // Send FCM notifications to other room members
      try {
        const otherMemberIds = updatedRoom?.players
          .filter(p => p.userId !== user.userId && p.joinStatus === 'JOINED')
          .map(p => p.userId) || []
        
        if (otherMemberIds.length > 0) {
          await GameNotifications.playerJoined(
            otherMemberIds,
            newPlayer.user.username,
            room.name,
            room.code
          )
          console.log(`✅ FCM notifications sent to ${otherMemberIds.length} room members`)
        }
      } catch (fcmError) {
        console.error('❌ FCM notification failed (non-critical):', fcmError)
        // Don't fail the join operation if FCM fails
      }

      return NextResponse.json(
        { 
          message: 'Successfully joined room',
          room: updatedRoom 
        },
        { status: 200 }
      )

    } catch (error) {
      console.error('Error joining room:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } 
  })
}
