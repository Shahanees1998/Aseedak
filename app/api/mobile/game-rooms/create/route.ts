import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import crypto from 'crypto'
import { verifyJWT, extractTokenFromRequest } from '@/lib/jwt'
import { sendGameRoomInvitationEmail } from '@/lib/email'
import { GameNotifications } from '@/lib/fcm'

const prisma = new PrismaClient()

const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  maxPlayers: z.number().min(2).max(6),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  category: z.string(),
  timeLimit: z.number().min(30).max(300),
  privateRoom: z.boolean().default(false),
  invitedUsers: z.array(z.string()).optional().default([])
})

async function verifyToken(request: NextRequest) {
  const token = extractTokenFromRequest(request)
  if (!token) {
    return null
  }

  return await verifyJWT(token)
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createRoomSchema.parse(body)

    // Generate unique room code
    const roomCode = crypto.randomBytes(4).toString('hex').toUpperCase()

    // Get words based on difficulty and category
    const wordFilter: any = {
      difficulty: validatedData.difficulty,
      isActive: true
    }

    if (validatedData.category !== 'all') {
      wordFilter.category = validatedData.category
    }

    const words = await prisma.word.findMany({
      where: wordFilter,
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
        status: 'WAITING',
        createdBy: user.userId,
        wordSet: selectedWords.map(w => w.id),
        timeLimit: validatedData.timeLimit
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

    // Add creator as first player
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
                  avatar: true,
                  email: true,
                  firstName: true
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

      // Send invitation emails and FCM notifications to invited players (excluding the creator)
      const invitedPlayers = updatedRoom?.players.filter(player => player.userId !== user.userId) || []
      
      if (invitedPlayers.length > 0) {
        console.log(`Sending invitation emails and FCM notifications to ${invitedPlayers.length} players...`)
        
        // Send emails and FCM notifications in parallel (don't wait for all to complete)
        const notificationPromises = invitedPlayers.map(async (player) => {
          try {
            // Send email invitation
            await sendGameRoomInvitationEmail(
              player.user.email,
              player.user.firstName || player.user.username,
              validatedData.name,
              roomCode,
              user.firstName || 'Game Creator',
              validatedData.maxPlayers
            )
            console.log(`✅ Invitation email sent to ${player.user.email}`)
            
            // Send FCM notification
            await GameNotifications.gameInvitation(
              player.userId,
              user.firstName || user.username,
              validatedData.name,
              roomCode
            )
            console.log(`✅ FCM invitation notification sent to ${player.user.username}`)
          } catch (error) {
            console.error(`❌ Failed to send invitation to ${player.user.email}:`, error)
            // Don't throw error - continue with other invitations
          }
        })
        
        // Don't await - let notifications send in background
        Promise.allSettled(notificationPromises).then((results) => {
          const successful = results.filter(r => r.status === 'fulfilled').length
          const failed = results.filter(r => r.status === 'rejected').length
          console.log(`📧📱 Mobile invitation sending completed: ${successful} successful, ${failed} failed`)
        })
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

    return NextResponse.json(
      { 
        message: 'Room created successfully',
        room: {
          ...room,
          players: [{
            id: 'temp',
            userId: user.userId,
            position: 1,
            status: 'ALIVE',
            joinStatus: 'JOINED',
            user: {
              id: user.userId,
              username: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'User',
              avatar: user.profileImage || 'IMAGE1'
            }
          }]
        }
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

    console.error('Mobile create room error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
