import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/jwt-auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's purchased characters and default unlocked characters
    const userCharacters = await prisma.userCharacter.findMany({
      where: { userId: user.userId },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            price: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get default unlocked characters
    const defaultCharacters = await prisma.character.findMany({
      where: {
        isActive: true,
        isUnlocked: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        price: true
      },
      orderBy: { name: 'asc' }
    })

    // Combine user's purchased characters with default unlocked characters
    const allAvailableCharacters = [
      ...userCharacters.map(uc => ({
        ...uc.character,
        isPurchased: true,
        purchasedAt: uc.createdAt
      })),
      ...defaultCharacters.map(char => ({
        ...char,
        isPurchased: false,
        purchasedAt: null
      }))
    ]

    return NextResponse.json({
      characters: allAvailableCharacters
    })

  } catch (error) {
    console.error('Error fetching user characters for game:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
