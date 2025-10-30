import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!

      const decks = await prisma.wordDeck.findMany({
        where: { isActive: true },
        include: { words: { select: { id: true } } },
        orderBy: { createdAt: 'asc' }
      })

      const purchases = await prisma.userPurchase.findMany({
        where: {
          userId: user.userId,
          status: 'completed',
          type: 'word_deck'
        },
        select: { itemId: true }
      })

      const purchasedDeckIds = new Set(purchases.map(p => p.itemId).filter(Boolean) as string[])

      const result = decks.map(deck => ({
        id: deck.id,
        name: deck.name,
        description: deck.description,
        price: deck.price,
        isActive: deck.isActive,
        wordCount: deck.words.length,
        isPaid: deck.price > 0,
        isPurchased: deck.price > 0 ? purchasedDeckIds.has(deck.id) : false
      }))

      return NextResponse.json({ decks: result })

    } catch (error) {
      console.error('Error fetching user word decks:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}


