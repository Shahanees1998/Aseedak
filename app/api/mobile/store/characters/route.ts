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

    // Get all character packs with characters
    const characterPacks = await prisma.characterPack.findMany({
      where: { isActive: true },
      include: {
        characters: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            price: true,
            isUnlocked: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Get user's purchased characters
    const userCharacters = await prisma.userCharacter.findMany({
      where: { userId: user.userId },
      select: { characterId: true }
    })

    const ownedCharacterIds = new Set(userCharacters.map(uc => uc.characterId))

    // Get user's purchases to mark owned items
    const userPurchases = await prisma.userPurchase.findMany({
      where: {
        userId: user.userId,
        status: 'completed',
        type: { in: ['character', 'character_pack'] }
      }
    })

    // Mark owned items
    const packsWithOwnership = characterPacks.map(pack => ({
      ...pack,
      isOwned: userPurchases.some(p => p.type === 'character_pack' && p.itemId === pack.id),
      characters: pack.characters.map(char => ({
        ...char,
        isOwned: char.isUnlocked || ownedCharacterIds.has(char.id) || userPurchases.some(p => p.type === 'character' && p.itemId === char.id)
      }))
    }))

    return NextResponse.json({
      characterPacks: packsWithOwnership
    })

  } catch (error) {
    console.error('Mobile characters store error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
