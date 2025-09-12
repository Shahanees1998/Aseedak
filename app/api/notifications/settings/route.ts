import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const notificationSettingsSchema = z.object({
  gameInvitations: z.boolean().default(true),
  gameStart: z.boolean().default(true),
  eliminationRequests: z.boolean().default(true),
  newTargets: z.boolean().default(true),
  gameEnd: z.boolean().default(true),
  avatarAssignments: z.boolean().default(true),
  systemUpdates: z.boolean().default(true)
})

/**
 * GET /api/notifications/settings
 * Get user's notification settings
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!

      const currentUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { 
          notificationSettings: true,
          fcmTokens: true
        }
      })

      if (!currentUser) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        )
      }

      // Default settings if none exist
      const defaultSettings = {
        gameInvitations: true,
        gameStart: true,
        eliminationRequests: true,
        newTargets: true,
        gameEnd: true,
        avatarAssignments: true,
        systemUpdates: true
      }

      const settings = currentUser.notificationSettings || defaultSettings

      return NextResponse.json({
        settings,
        hasFCMTokens: (currentUser.fcmTokens || []).length > 0,
        tokenCount: (currentUser.fcmTokens || []).length
      })

    } catch (error) {
      console.error('Error fetching notification settings:', error)
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
 * PUT /api/notifications/settings
 * Update user's notification settings
 */
export async function PUT(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!
      const body = await authenticatedReq.json()
      const validatedData = notificationSettingsSchema.parse(body)

      // Update user's notification settings
      await prisma.user.update({
        where: { id: user.userId },
        data: { notificationSettings: validatedData }
      })

      console.log(`✅ Notification settings updated for user ${user.userId}`)

      return NextResponse.json({
        message: 'Notification settings updated successfully',
        settings: validatedData
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { message: error.errors[0].message },
          { status: 400 }
        )
      }

      console.error('Error updating notification settings:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}

