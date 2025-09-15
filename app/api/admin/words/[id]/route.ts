import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const wordUpdateSchema = z.object({
  word1: z.string().min(1, 'Word 1 is required').optional(),
  word2: z.string().min(1, 'Word 2 is required').optional(),
  word3: z.string().min(1, 'Word 3 is required').optional(),
  isActive: z.boolean().optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {

    const body = await request.json()
    const validatedData = wordUpdateSchema.parse(body)

    const word = await prisma.word.update({
      where: { id: params.id },
      data: validatedData
    })

    return NextResponse.json(
      { 
        message: 'Word updated successfully',
        word 
      },
      { status: 200 }
    )

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { message: error.errors[0].message },
          { status: 400 }
        )
      }

      console.error('Error updating word:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {

    await prisma.word.delete({
      where: { id: params.id }
    })

    return NextResponse.json(
      { message: 'Word deleted successfully' },
      { status: 200 }
    )

    } catch (error) {
      console.error('Error deleting word:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  });
}
