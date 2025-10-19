import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt-auth'


export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all characters that can be purchased (paid and not unlocked by default)
    const characters = await prisma.character.findMany({
      where: {
        isActive: true,
        isUnlocked: false,
        isPaid: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        price: true,
        pack: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { price: 'asc' }
    })

    // Get user's owned characters
    const userCharacters = await prisma.userCharacter.findMany({
      where: { userId: user.userId },
      select: { characterId: true }
    })

    const ownedCharacterIds = new Set(userCharacters.map(uc => uc.characterId))

    // Mark characters as owned
    const charactersWithOwnership = characters.map(character => ({
      ...character,
      isOwned: ownedCharacterIds.has(character.id)
    }))

    return NextResponse.json({
      characters: charactersWithOwnership
    })

  } catch (error) {
    console.error('Error fetching available characters:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
