import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const cardSchema = z.object({
  id: z.string().optional(),
  word1: z.string().min(1, 'Word 1 is required'),
  word2: z.string().min(1, 'Word 2 is required'),
  word3: z.string().min(1, 'Word 3 is required'),
  isActive: z.boolean().default(true).optional()
})

const updateDeckSchema = z.object({
  description: z.string().min(1, 'Description is required').optional(),
  price: z.number().min(0, 'Price must be non-negative').optional(),
  isActive: z.boolean().optional(),
  cards: z.array(cardSchema).optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const body = await request.json()
      const validated = updateDeckSchema.parse(body)

      // Update deck metadata
      if (validated.description !== undefined || validated.price !== undefined || validated.isActive !== undefined) {
        await prisma.wordDeck.update({
          where: { id: params.id },
          data: {
            ...(validated.description !== undefined ? { description: validated.description } : {}),
            ...(validated.price !== undefined ? { price: validated.price } : {}),
            ...(validated.isActive !== undefined ? { isActive: validated.isActive } : {})
          }
        })
      }

      // Replace cards if provided
      if (validated.cards) {
        // Simple strategy: delete existing words for deck and recreate from payload
        await prisma.word.deleteMany({ where: { deckId: params.id } })
        if (validated.cards.length > 0) {
          await prisma.word.createMany({
            data: validated.cards.map(c => ({
              word1: c.word1,
              word2: c.word2,
              word3: c.word3,
              isActive: c.isActive ?? true,
              deckId: params.id
            }))
          })
        }
      }

      const deck = await prisma.wordDeck.findUnique({
        where: { id: params.id },
        include: { words: true }
      })

      return NextResponse.json({
        message: 'Word deck updated successfully',
        wordDeck: deck
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { message: error.errors[0].message },
          { status: 400 }
        )
      }
      console.error('Error updating word deck:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      await prisma.word.deleteMany({ where: { deckId: params.id } })
      await prisma.wordDeck.delete({ where: { id: params.id } })
      return NextResponse.json({ message: 'Word deck deleted successfully' })
    } catch (error) {
      console.error('Error deleting word deck:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}


