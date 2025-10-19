import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const wordDeckSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
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

      // Add word count to each deck
      const decksWithCount = wordDecks.map(deck => ({
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
      const validatedData = wordDeckSchema.parse(body)

      const wordDeck = await prisma.wordDeck.create({
        data: validatedData,
        include: {
          words: true
        }
      })

      return NextResponse.json(
        { 
          message: 'Word deck created successfully',
          wordDeck 
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
  });
}
