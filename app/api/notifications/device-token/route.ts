import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/authMiddleware'
import { AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema for device token registration
const deviceTokenSchema = z.object({
  token: z.string().min(1, 'Device token is required'),
  platform: z.enum(['ios', 'android', 'web']).optional().default('web'),
  appVersion: z.string().optional(),
  deviceModel: z.string().optional(),
  osVersion: z.string().optional()
})

// Schema for notification settings
const notificationSettingsSchema = z.object({
  gameInvitations: z.boolean().default(true),
  gameUpdates: z.boolean().default(true),
  eliminationAlerts: z.boolean().default(true),
  systemNotifications: z.boolean().default(true)
})

/**
 * POST /api/notifications/device-token
 * Register a new FCM device token for the authenticated user
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!
      const body = await request.json()
      
      const validatedData = deviceTokenSchema.parse(body)
      
      // Check if token already exists for this user
      const existingUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { fcmTokens: true }
      })
      
      if (!existingUser) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        )
      }
      
      // Add token if not already present
      const tokens = existingUser.fcmTokens
      if (!tokens.includes(validatedData.token)) {
        await prisma.user.update({
          where: { id: user.userId },
          data: {
            fcmTokens: {
              push: validatedData.token
            }
          }
        })
        
        console.log(`✅ Device token registered for user ${user.userId}: ${validatedData.token}`)
      }
      
      return NextResponse.json({
        message: 'Device token registered successfully',
        token: validatedData.token,
        platform: validatedData.platform
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
 * Remove a FCM device token for the authenticated user
 */
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!
      const body = await request.json()
      
      const { token } = z.object({
        token: z.string().min(1, 'Device token is required')
      }).parse(body)
      
      // Remove token from user's token list
      const existingUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { fcmTokens: true }
      })
      
      if (!existingUser) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        )
      }
      
      const updatedTokens = existingUser.fcmTokens.filter(t => t !== token)
      
      await prisma.user.update({
        where: { id: user.userId },
        data: {
          fcmTokens: updatedTokens
        }
      })
      
      console.log(`✅ Device token removed for user ${user.userId}: ${token}`)
      
      return NextResponse.json({
        message: 'Device token removed successfully',
        token
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
 * Get user's device tokens and notification settings
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!
      
      const userData = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          fcmTokens: true,
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
        deviceTokens: userData.fcmTokens,
        notificationSettings: userData.notificationSettings || {
          gameInvitations: true,
          gameUpdates: true,
          eliminationAlerts: true,
          systemNotifications: true
        }
      })
      
    } catch (error) {
      console.error('Error getting device tokens:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}