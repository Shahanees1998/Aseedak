import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { sendWelcomeEmail } from '@/lib/email'

const prisma = new PrismaClient()

const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = verifyEmailSchema.parse(body)
    
    // Find user with valid OTP
    const user = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
        emailVerifyToken: validatedData.otp,
        emailVerifyExpiry: {
          gt: new Date()
        },
        emailVerified: false
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // Update user to verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        emailVerified: true,
        createdAt: true
      }
    })

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.firstName)
    } catch (emailError) {
      console.error('Welcome email sending error:', emailError)
      // Still return success to user, but log the error
    }

    return NextResponse.json(
      { 
        message: 'Email verified successfully! Welcome to Aseedak!',
        user: updatedUser
      },
      { status: 200 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Email verification error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
