import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema for notification settings
const notificationSettingsSchema = z.object({
  fcmEnabled: z.boolean().optional(),
  gameInvitations: z.boolean().optional(),
  gameUpdates: z.boolean().optional(),
  eliminationAlerts: z.boolean().optional(),
  systemNotifications: z.boolean().optional()
})

/**
 * PUT /api/notifications/settings
 * Update user's notification settings
 */
export async function PUT(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!
      const body = await request.json()
      
      const validatedData = notificationSettingsSchema.parse(body)
      
      // Prepare update data
      const updateData: any = {}
      
      if (validatedData.fcmEnabled !== undefined) {
        updateData.fcmEnabled = validatedData.fcmEnabled
      }
      
      // Update notification settings
      const currentSettings = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { notificationSettings: true, fcmEnabled: true }
      })
      
      const currentNotificationSettings = currentSettings?.notificationSettings as any || {
        gameInvitations: true,
        gameUpdates: true,
        eliminationAlerts: true,
        systemNotifications: true
      }
      
      const newNotificationSettings = {
        ...currentNotificationSettings,
        ...(validatedData.gameInvitations !== undefined && { gameInvitations: validatedData.gameInvitations }),
        ...(validatedData.gameUpdates !== undefined && { gameUpdates: validatedData.gameUpdates }),
        ...(validatedData.eliminationAlerts !== undefined && { eliminationAlerts: validatedData.eliminationAlerts }),
        ...(validatedData.systemNotifications !== undefined && { systemNotifications: validatedData.systemNotifications })
      }
      
      updateData.notificationSettings = newNotificationSettings
      
      await prisma.user.update({
        where: { id: user.userId },
        data: updateData
      })
      
      console.log(`✅ Notification settings updated for user ${user.userId}`)
      
      return NextResponse.json({
        message: 'Notification settings updated successfully',
        settings: {
          fcmEnabled: validatedData.fcmEnabled !== undefined ? validatedData.fcmEnabled : currentSettings?.fcmEnabled,
          notificationSettings: newNotificationSettings
        }
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

/**
 * GET /api/notifications/settings
 * Get user's notification settings
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!
      
      const userData = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          fcmEnabled: true,
          notificationSettings: true
        }
      })
      
      if (!userData) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        fcmEnabled: userData.fcmEnabled,
        notificationSettings: userData.notificationSettings || {
          gameInvitations: true,
          gameUpdates: true,
          eliminationAlerts: true,
          systemNotifications: true
        }
      })
      
    } catch (error) {
      console.error('Error getting notification settings:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}