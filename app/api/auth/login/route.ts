import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { signJWT } from '@/lib/jwt'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Always perform password verification to prevent timing attacks
    // Use a dummy hash if user doesn't exist
    const dummyHash = '$2a$10$dummy.hash.to.prevent.timing.attacks'
    const hashToCompare = user?.password || dummyHash
    const isPasswordValid = await bcrypt.compare(password, hashToCompare)

    // If user doesn't exist, return generic error
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // If password is invalid, return generic error
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Now check account status with specific error messages
    if (!user.emailVerified) {
      return NextResponse.json(
        { 
          error: 'Email not verified',
          message: 'Please verify your email address before logging in',
          code: 'EMAIL_NOT_VERIFIED'
        },
        { status: 403 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { 
          error: 'Account is inactive',
          message: 'Your account has been deactivated. Please contact support.',
          code: 'ACCOUNT_INACTIVE'
        },
        { status: 403 }
      )
    }

    // Create JWT token
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    // Set HTTP-only cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        profileImage: user.profileImageUrl
      }
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
