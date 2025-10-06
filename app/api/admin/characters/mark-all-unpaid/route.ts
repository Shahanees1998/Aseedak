import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(request: NextRequest) {
  return withAuth(request, async (_req: AuthenticatedRequest) => {
    try {
      const result = await prisma.character.updateMany({
        data: { isPaid: false }
      })

      return NextResponse.json({
        message: 'All characters marked as unpaid',
        updatedCount: result.count
      })

    } catch (error) {
      console.error('Error marking all characters unpaid:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}
