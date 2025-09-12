import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const toggleStatusSchema = z.object({
  isActive: z.boolean()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {

    const body = await request.json()
    const validatedData = toggleStatusSchema.parse(body)

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: validatedData.isActive },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        gamesPlayed: true,
        gamesWon: true,
        totalKills: true,
        createdAt: true
      }
    })

    return NextResponse.json(
      { 
        message: `User ${validatedData.isActive ? 'activated' : 'suspended'} successfully`,
        user 
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

      console.error('Error toggling user status:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  });
}
