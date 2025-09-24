import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { signJWT } from '@/lib/jwt'

const prisma = new PrismaClient()

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        avatar: true,
        role: true,
        password: true,
        isActive: true,
        emailVerified: true,
        gamesPlayed: true,
        gamesWon: true,
        totalKills: true
      }
    })

    // Always perform password verification to prevent timing attacks
    // Use a dummy hash if user doesn't exist
    const dummyHash = '$2a$10$dummy.hash.to.prevent.timing.attacks'
    const hashToCompare = user?.password || dummyHash
    const isPasswordValid = await bcrypt.compare(validatedData.password, hashToCompare)

    // If user doesn't exist, return generic error
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // If password is invalid, return generic error
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Now check account status with specific error messages
    if (!user.emailVerified) {
      return NextResponse.json(
        { 
          message: 'Email not verified',
          error: 'Please verify your email address before logging in',
          code: 'EMAIL_NOT_VERIFIED'
        },
        { status: 403 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { 
          message: 'Account is inactive',
          error: 'Your account has been deactivated. Please contact support.',
          code: 'ACCOUNT_INACTIVE'
        },
        { status: 403 }
      )
    }

    // Generate JWT token using Jose
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    // Return user data without password
    const { password, ...userData } = user

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: userData
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Mobile login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
