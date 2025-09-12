import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const deviceTokenSchema = z.object({
  token: z.string().min(1, 'Device token is required'),
  platform: z.enum(['android', 'ios', 'web']).optional()
})

/**
 * POST /api/notifications/device-token
 * Register or update user's FCM device token
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!
      const body = await authenticatedReq.json()
      const validatedData = deviceTokenSchema.parse(body)

      // Get current user's tokens
      const currentUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { fcmTokens: true }
      })

      if (!currentUser) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        )
      }

      // Add token if not already present
      const existingTokens = currentUser.fcmTokens || []
      const updatedTokens = existingTokens.includes(validatedData.token)
        ? existingTokens
        : [...existingTokens, validatedData.token]

      // Update user's FCM tokens
      await prisma.user.update({
        where: { id: user.userId },
        data: { fcmTokens: updatedTokens }
      })

      console.log(`✅ FCM token registered for user ${user.userId}`)

      return NextResponse.json({
        message: 'Device token registered successfully',
        tokenCount: updatedTokens.length
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { message: error.errors[0].message },
          { status: 400 }
        )
      }

      console.error('Error registering device token:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}

/**
 * DELETE /api/notifications/device-token
 * Remove user's FCM device token
 */
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!
      const body = await authenticatedReq.json()
      const validatedData = deviceTokenSchema.parse(body)

      // Get current user's tokens
      const currentUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { fcmTokens: true }
      })

      if (!currentUser) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        )
      }

      // Remove token from array
      const existingTokens = currentUser.fcmTokens || []
      const updatedTokens = existingTokens.filter(token => token !== validatedData.token)

      // Update user's FCM tokens
      await prisma.user.update({
        where: { id: user.userId },
        data: { fcmTokens: updatedTokens }
      })

      console.log(`🗑️ FCM token removed for user ${user.userId}`)

      return NextResponse.json({
        message: 'Device token removed successfully',
        tokenCount: updatedTokens.length
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { message: error.errors[0].message },
          { status: 400 }
        )
      }

      console.error('Error removing device token:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}

/**
 * GET /api/notifications/device-token
 * Get user's registered device tokens
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!

      const currentUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { 
          fcmTokens: true,
          notificationSettings: true
        }
      })

      if (!currentUser) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        tokens: currentUser.fcmTokens || [],
        tokenCount: (currentUser.fcmTokens || []).length,
        notificationSettings: currentUser.notificationSettings
      })

    } catch (error) {
      console.error('Error fetching device tokens:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}

