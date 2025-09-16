import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const { id } = params
      const body = await request.json()
      const { isActive } = body

      // Note: isActive field is not available in the Character model
      // This endpoint is disabled until the schema is updated
      return NextResponse.json(
        { message: 'Character status toggle is not available' },
        { status: 501 }
      )

      return NextResponse.json({
        message: `Character ${isActive ? 'activated' : 'deactivated'} successfully`,
        character
      })

    } catch (error) {
      console.error('Error toggling character status:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}
