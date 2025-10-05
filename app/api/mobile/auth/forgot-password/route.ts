import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import crypto from 'crypto'
import { sendForgotPasswordOTPEmail } from '@/lib/email'

const prisma = new PrismaClient()

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = forgotPasswordSchema.parse(body)
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: 'If an account with that email exists, we sent a password reset code.' },
        { status: 200 }
      )
    }

    // Generate OTP (4 digits)
    const otp = crypto.randomInt(1000, 9999).toString()
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Update user with OTP and expiry
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: otp,
        resetTokenExpiry
      }
    })

    // Send OTP email
    try {
      await sendForgotPasswordOTPEmail(user.email, user.firstName, otp)
    } catch (emailError) {
      console.error('Email sending error:', emailError)
      // Still return success to user, but log the error
    }

    return NextResponse.json(
      { message: 'If an account with that email exists, we sent a password reset code.' },
      { status: 200 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Mobile forgot password error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
