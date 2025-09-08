import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

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

export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required' },
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
        isOwned: char.isUnlocked || userPurchases.some(p => p.type === 'character' && p.itemId === char.id)
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
