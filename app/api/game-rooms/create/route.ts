import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import crypto from 'crypto'

const prisma = new PrismaClient()

const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  maxPlayers: z.number().min(2).max(8),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  category: z.string(),
  timeLimit: z.number().min(30).max(300),
  privateRoom: z.boolean().default(false)
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
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
        createdBy: session.user.id,
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
}
