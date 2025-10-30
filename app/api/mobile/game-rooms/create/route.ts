import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import crypto from 'crypto'
import { verifyJWT, extractTokenFromRequest } from '@/lib/jwt'

const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  maxPlayers: z.number().min(2).max(20), // Increased max to 20
  difficulty: z.enum(['easy', 'medium', 'hard']),
  category: z.string(),
  timeLimit: z.number().min(30).max(300),
  privateRoom: z.boolean().default(false)
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
  }
}
