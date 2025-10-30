import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import crypto from 'crypto'
import AdminNotifications from '@/lib/adminNotifications'


const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  maxPlayers: z.number().min(2).max(20), // Increased max to 20
  timeLimit: z.number().min(30).max(300),
  privateRoom: z.boolean().default(false)
})

export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!

      const body = await authenticatedReq.json()
      const validatedData = createRoomSchema.parse(body)

      // Get user's max members limit
      const userData = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { maxMembers: true }
      })

      if (!userData) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        )
      }

      // Check if requested maxPlayers exceeds user's limit
      if (validatedData.maxPlayers > userData.maxMembers) {
        return NextResponse.json(
          { 
            message: `You can only create rooms with up to ${userData.maxMembers} members. Upgrade your plan to increase this limit.`,
            maxAllowed: userData.maxMembers,
            requested: validatedData.maxPlayers
          },
          { status: 400 }
        )
      }

      // Generate unique room code
      const roomCode = crypto.randomBytes(4).toString('hex').toUpperCase()

      // Determine allowed decks: free (price 0) + user's purchased word_decks
      const [freeDecks, purchases] = await Promise.all([
        prisma.wordDeck.findMany({ where: { isActive: true, price: 0 }, select: { id: true } }),
        prisma.userPurchase.findMany({
          where: { userId: user.userId, status: 'completed', type: 'word_deck' },
          select: { itemId: true }
        })
      ])

      const purchasedDeckIds = purchases.map(p => p.itemId).filter(Boolean) as string[]
      const freeDeckIds = freeDecks.map(d => d.id)
      const allowedDeckIds = Array.from(new Set([...freeDeckIds, ...purchasedDeckIds]))

      // Get active words only from allowed decks
      const words = await prisma.word.findMany({
        where: {
          isActive: true,
          deckId: { in: allowedDeckIds }
        },
        take: 50
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
    } 
  })
}
