import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt-auth'


/**
 * GET /api/mobile/characters
 * 
 * Returns all characters with user ownership information.
 * For each character, includes:
 * - isPurchased: whether the requesting user has purchased it
 * - isDefault: whether it's a default unlocked character
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all active characters
    const characters = await prisma.character.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        price: true,
        isUnlocked: true, // This indicates if it's a default character
        isPaid: true,
        packId: true,
        pack: {
          select: {
            id: true,
            name: true
          }
        },
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'asc' }
    })

    // Get user's purchased characters
    const userCharacters = await prisma.userCharacter.findMany({
      where: { userId: user.userId },
      select: { characterId: true }
    })

    const purchasedCharacterIds = new Set(userCharacters.map(uc => uc.characterId))

    // Map characters with ownership and default info
    const charactersWithOwnership = characters.map(character => ({
      ...character,
      isPurchased: purchasedCharacterIds.has(character.id),
      isDefault: character.isUnlocked || character.price === 0
    }))

    return NextResponse.json({
      characters: charactersWithOwnership,
      total: charactersWithOwnership.length,
      purchased: charactersWithOwnership.filter(c => c.isPurchased).length,
      default: charactersWithOwnership.filter(c => c.isDefault).length
    })

  } catch (error) {
    console.error('Error fetching characters with ownership:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

