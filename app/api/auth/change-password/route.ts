import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
})

export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!
      const body = await authenticatedReq.json()
      
      // Validate input
      const validatedData = changePasswordSchema.parse(body)
      
      // Get user with password
      const currentUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { id: true, password: true, username: true }
      })

      if (!currentUser) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        )
      }

      // Verify current password
      const isValidCurrentPassword = await bcrypt.compare(
        validatedData.currentPassword, 
        currentUser.password
      )

      if (!isValidCurrentPassword) {
        return NextResponse.json(
          { message: 'Current password is incorrect' },
          { status: 400 }
        )
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 12)

      // Update password
      await prisma.user.update({
        where: { id: user.userId },
        data: { password: hashedNewPassword }
      })

      console.log(`✅ Password changed successfully for user: ${currentUser.username}`)

      return NextResponse.json({
        message: 'Password changed successfully'
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { message: error.errors[0].message },
          { status: 400 }
        )
      }

      console.error('Change password error:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}

