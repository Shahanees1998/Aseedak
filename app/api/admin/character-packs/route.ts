import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import prisma from '@/lib/prisma'
import { z } from 'zod'


const characterPackSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  imageUrl: z.string().url('Valid image URL is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const characterPacks = await prisma.characterPack.findMany({
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
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({ characterPacks })

    } catch (error) {
      console.error('Error fetching character packs:', error)
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
      const validatedData = characterPackSchema.parse(body)

      const characterPack = await prisma.characterPack.create({
        data: validatedData,
        include: {
          characters: true
        }
      })

      return NextResponse.json(
        { 
          message: 'Character pack created successfully',
          characterPack 
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

      console.error('Error creating character pack:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } 
  });
}
