import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'
import { pusher } from '@/lib/pusher'

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
            where: { joinStatus: 'JOINED' },
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

      // Only room creator can reassign
      if (room.createdBy !== user.userId) {
        return NextResponse.json(
          { message: 'Only the room creator can reassign targets and words' },
          { status: 403 }
        )
      }

      if (room.status !== 'IN_PROGRESS') {
        return NextResponse.json(
          { message: 'Can only reassign during an active game' },
          { status: 400 }
        )
      }

      // Get available words
      const words = await prisma.word.findMany({
        where: {
          id: { in: room.wordSet }
        }
      })

      if (words.length < room.players.length) {
        return NextResponse.json(
          { message: 'Not enough words available for reassignment' },
          { status: 400 }
        )
      }

      // Shuffle players and words for reassignment
      const shuffledPlayers = [...room.players].sort(() => 0.5 - Math.random())
      const shuffledWords = [...words].sort(() => 0.5 - Math.random())

      // Reassign targets and words
      for (let i = 0; i < shuffledPlayers.length; i++) {
        const player = shuffledPlayers[i]
        const word = shuffledWords[i]
        const targetPlayer = shuffledPlayers[(i + 1) % shuffledPlayers.length]

        await prisma.gamePlayer.update({
          where: { id: player.id },
          data: {
            word1: word.word1,
            word2: word.word2,
            word3: word.word3,
            targetId: targetPlayer.id,
            position: i + 1
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

      // Create game log
      await prisma.gameLog.create({
        data: {
          roomId: room.id,
          type: 'reassignment',
          message: 'Targets and words have been reassigned!',
          data: {
            reassignedBy: user.userId,
            playerCount: room.players.length
          }
        }
      })

      // Notify all players about reassignment
      if (pusher) {
        try {
          await pusher.trigger(`room-${params.code}`, 'targets-reassigned', {
            room: updatedRoom,
            message: 'New targets and words have been assigned!'
          })
          console.log('✅ Pusher notification sent for reassignment')
        } catch (pusherError) {
          console.error('❌ Pusher notification failed (non-critical):', pusherError)
        }
      }

      return NextResponse.json(
        { 
          message: 'Targets and words reassigned successfully',
          room: updatedRoom 
        },
        { status: 200 }
      )

    } catch (error) {
      console.error('Error reassigning targets:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } 
  })
}
