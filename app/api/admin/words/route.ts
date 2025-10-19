import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const wordSchema = z.object({
  word1: z.string().min(1, 'Word 1 is required'),
  word2: z.string().min(1, 'Word 2 is required'),
  word3: z.string().min(1, 'Word 3 is required'),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const words = await prisma.word.findMany({
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({ words })

    } catch (error) {
      console.error('Error fetching words:', error)
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
      const validatedData = wordSchema.parse(body)

      const word = await prisma.word.create({
        data: validatedData
      })

      return NextResponse.json(
        { 
          message: 'Word created successfully',
          word 
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

      console.error('Error creating word:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    }
  });
}
