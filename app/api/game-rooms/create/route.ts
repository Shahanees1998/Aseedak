import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import crypto from 'crypto'
import { sendGameRoomInvitationEmail } from '@/lib/email'
import { GameNotifications } from '@/lib/fcm'
import AdminNotifications from '@/lib/adminNotifications'

const prisma = new PrismaClient()

const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  maxPlayers: z.number().min(2).max(8),
  timeLimit: z.number().min(30).max(300),
  privateRoom: z.boolean().default(false),
  invitedUsers: z.array(z.string()).optional().default([])
})

export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!

      const body = await authenticatedReq.json()
      const validatedData = createRoomSchema.parse(body)

      // Generate unique room code
      const roomCode = crypto.randomBytes(4).toString('hex').toUpperCase()

      // Get all active words
      const words = await prisma.word.findMany({
        where: {
          isActive: true
        },
        take: 50 // Get more words than needed for variety
      })

      if (words.length < validatedData.maxPlayers) {
        return NextResponse.json(
          { message: 'Not enough words available for this configuration' },
          { status: 400 }
        )
      }

      // Shuffle and select words for the game
      const shuffledWords = words.sort(() => 0.5 - Math.random())
      const selectedWords = shuffledWords.slice(0, validatedData.maxPlayers)

      // Create game room
      const room = await prisma.gameRoom.create({
        data: {
          name: validatedData.name,
          code: roomCode,
          maxPlayers: validatedData.maxPlayers,
          createdBy: user.userId,
          wordSet: selectedWords.map(word => word.id),
          timeLimit: validatedData.timeLimit,
          status: 'WAITING'
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      })

      // Add room creator as first player
      await prisma.gamePlayer.create({
        data: {
          userId: user.userId,
          roomId: room.id,
          position: 1,
          status: 'ALIVE',
          joinStatus: 'JOINED' // Creator is automatically joined
        }
      })

      // Add invited users to the room
      if (validatedData.invitedUsers && validatedData.invitedUsers.length > 0) {
        const createdPlayers = await Promise.all(
          validatedData.invitedUsers.map(async (invitedUserId, index) => {
            return prisma.gamePlayer.create({
              data: {
                userId: invitedUserId,
                roomId: room.id,
                position: index + 2, // +2 because creator is position 1
                status: 'ALIVE',
                joinStatus: 'INVITED' // Invited users start as INVITED
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
          })
        )

        // Get updated room with all players
        const updatedRoom = await prisma.gameRoom.findUnique({
          where: { id: room.id },
          include: {
            players: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatar: true,
                    email: true,
                    firstName: true
                  }
                }
              },
              orderBy: { position: 'asc' }
            },
            creator: {
              select: {
                id: true,
                username: true,
                avatar: true,
                firstName: true
              }
            }
          }
        })

        // Send invitation emails to invited players (excluding the creator)
        const invitedPlayers = updatedRoom?.players.filter(player => player.userId !== user.userId) || []
        
        if (invitedPlayers.length > 0) {
          console.log(`Sending invitation emails to ${invitedPlayers.length} players...`)
          
          // Send emails in parallel (don't wait for all to complete)
          const emailPromises = invitedPlayers.map(async (player) => {
            try {
              await sendGameRoomInvitationEmail(
                player.user.email,
                player.user.firstName || player.user.username,
                validatedData.name,
                roomCode,
                user.firstName || 'Game Creator',
                validatedData.maxPlayers
              )
              console.log(`✅ Invitation email sent to ${player.user.email}`)
            } catch (error) {
              console.error(`❌ Failed to send invitation email to ${player.user.email}:`, error)
              // Don't throw error - continue with other emails
            }
          })
          
          // Don't await - let emails send in background
          Promise.allSettled(emailPromises).then((results) => {
            const successful = results.filter(r => r.status === 'fulfilled').length
            const failed = results.filter(r => r.status === 'rejected').length
            console.log(`📧 Email sending completed: ${successful} successful, ${failed} failed`)
          })
        }

        // Notify all admins about new game room creation
        try {
          await AdminNotifications.newGameRoomCreated(
            validatedData.name,
            roomCode,
            user.firstName || 'Unknown'
          )
          console.log(`✅ Admin web notifications sent for new game room: ${validatedData.name}`)
        } catch (notificationError) {
          console.error('Admin notification error (non-critical):', notificationError)
        }

        return NextResponse.json(
          { 
            message: 'Room created successfully with invited players',
            room: updatedRoom,
            emailsSent: invitedPlayers.length
          },
          { status: 201 }
        )
      }

      // Notify all admins about new game room creation (no invited players case)
      try {
        await AdminNotifications.newGameRoomCreated(
          validatedData.name,
          roomCode,
          user.firstName || 'Unknown'
        )
        console.log(`✅ Admin web notifications sent for new game room: ${validatedData.name}`)
      } catch (notificationError) {
        console.error('Admin notification error (non-critical):', notificationError)
      }

      return NextResponse.json(
        { 
          message: 'Room created successfully',
          room 
        },
        { status: 201 }
      )

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { message: error.errors[0].message },
          { status: 400 }
        )
      }

      console.error('Error creating room:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}
