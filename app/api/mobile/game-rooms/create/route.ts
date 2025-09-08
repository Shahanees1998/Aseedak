import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  maxPlayers: z.number().min(2).max(6),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  category: z.string(),
  timeLimit: z.number().min(30).max(300),
  privateRoom: z.boolean().default(false)
})

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request)
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
        status: 'ALIVE'
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
            user: {
              id: user.userId,
              username: user.username || 'User',
              avatar: user.avatar || 'IMAGE1'
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
