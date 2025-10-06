import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const characters = await prisma.character.findMany({
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({ characters })

    } catch (error) {
      console.error('Error fetching characters:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const body = await request.json()
      const { name, description, imageUrl, isActive = true, isPaid = false, price = 0 } = body

      if (!name || !imageUrl) {
        return NextResponse.json(
          { message: 'Name and image URL are required' },
          { status: 400 }
        )
      }

      const character = await prisma.character.create({
        data: {
          name,
          description: description || '',
          imageUrl,
          packId: null, // Explicitly set to null since pack is optional
          isActive,
          isPaid,
          price: typeof price === 'number' ? price : 0
        }
      })

      return NextResponse.json({
        message: 'Character created successfully',
        character
      })

    } catch (error) {
      console.error('Error creating character:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}
