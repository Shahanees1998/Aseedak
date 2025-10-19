import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'


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

    // Get all word decks
    const wordDecks = await prisma.wordDeck.findMany({
      where: { isActive: true },
      include: {
        words: {
          select: {
            id: true,
            word1: true,
            word2: true,
            word3: true
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
        type: 'word_deck'
      }
    })

    // Mark owned items
    const decksWithOwnership = wordDecks.map(deck => ({
      ...deck,
      isOwned: userPurchases.some(p => p.itemId === deck.id),
      wordCount: deck.words.length
    }))

    return NextResponse.json({
      wordDecks: decksWithOwnership
    })

  } catch (error) {
    console.error('Mobile word decks store error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
