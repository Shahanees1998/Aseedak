import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import prisma from '@/lib/prisma'
import { z } from 'zod'


const cardSchema = z.object({
  word1: z.string().min(1, 'Word 1 is required'),
  word2: z.string().min(1, 'Word 2 is required'),
  word3: z.string().min(1, 'Word 3 is required'),
  isActive: z.boolean().default(true).optional()
})

const createDeckSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  isActive: z.boolean().default(true),
  cards: z.array(cardSchema).min(1, 'At least one card is required')
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const { search } = Object.fromEntries(request.nextUrl.searchParams)

      const wordDecks = await prisma.wordDeck.findMany({
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
        orderBy: { createdAt: 'desc' }
      })

      const normalize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      const searchNorm = normalize(search || '')

      const filtered = searchNorm
        ? wordDecks.filter(d => normalize(d.name).includes(searchNorm))
        : wordDecks

      const decksWithCount = filtered.map(deck => ({
        ...deck,
        wordCount: deck.words.length
      }))

      return NextResponse.json({ wordDecks: decksWithCount })

    } catch (error) {
      console.error('Error fetching word decks:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } 
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const body = await request.json()
      const validated = createDeckSchema.parse(body)

      // Auto-name: Deck_{count+1}
      const count = await prisma.wordDeck.count()
      const name = `Deck_${count + 1}`

      const created = await prisma.wordDeck.create({
        data: {
          name,
          description: validated.description,
          price: validated.price,
          isActive: validated.isActive
        }
      })

      // Create cards as words
      if (validated.cards && validated.cards.length > 0) {
        await prisma.word.createMany({
          data: validated.cards.map(c => ({
            word1: c.word1,
            word2: c.word2,
            word3: c.word3,
            isActive: c.isActive ?? true,
            deckId: created.id
          }))
        })
      }

      const deckWithWords = await prisma.wordDeck.findUnique({
        where: { id: created.id },
        include: { words: true }
      })

      return NextResponse.json(
        {
          message: 'Word deck created successfully',
          wordDeck: deckWithWords
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

      console.error('Error creating word deck:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
