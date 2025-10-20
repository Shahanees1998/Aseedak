import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// Schema for device token registration
const deviceTokenSchema = z.object({
  token: z.string().min(1, 'Device token is required'),
  platform: z.enum(['ios', 'android', 'web']).optional().default('android'),
  appVersion: z.string().optional(),
  deviceModel: z.string().optional(),
  osVersion: z.string().optional()
})

/**
 * Verify JWT token for mobile requests
 */
async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header')
  }

  const token = authHeader.substring(7)
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
  return decoded
}

/**
 * POST /api/mobile/notifications/device-token
 * Register a new FCM device token for mobile users
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
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
      
      console.log(`✅ Mobile device token registered for user ${user.userId}: ${validatedData.token}`)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Device token registered successfully',
      data: {
        token: validatedData.token,
        platform: validatedData.platform
      }
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.errors[0].message },
        { status: 400 }
      )
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }
    
    console.error('Error registering mobile device token:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/mobile/notifications/device-token
 * Remove a FCM device token for mobile users
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken(request)
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
        { success: false, message: 'User not found' },
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
    
    console.log(`✅ Mobile device token removed for user ${user.userId}: ${token}`)
    
    return NextResponse.json({
      success: true,
      message: 'Device token removed successfully',
      data: { token }
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.errors[0].message },
        { status: 400 }
      )
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }
    
    console.error('Error removing mobile device token:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}


