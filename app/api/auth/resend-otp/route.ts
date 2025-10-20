import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import crypto from 'crypto'
import { sendOTPEmail } from '@/lib/email'

const prisma = new PrismaClient()

const resendOTPSchema = z.object({
  email: z.string().email('Invalid email address')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = resendOTPSchema.parse(body)
    
    // Find user with unverified email
    const user = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
        emailVerified: false
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'No unverified account found with this email' },
        { status: 404 }
      )
    }

    // Generate new OTP (4 digits)
    const otp = crypto.randomInt(1000, 9999).toString()
    const emailVerifyExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Send new OTP email first
    let emailSent = false
    try {
      await sendOTPEmail(user.email, user.firstName, otp)
      emailSent = true
    } catch (emailError) {
      console.error('Email sending error:', emailError)
      // Don't break the flow, just log the error and continue
      emailSent = false
    }

    // Update user with new OTP regardless of email status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken: otp,
        emailVerifyExpiry: emailVerifyExpiry
      }
    })

    // Return appropriate response based on email sending status
    if (emailSent) {
      return NextResponse.json(
        { message: 'New OTP sent to your email' },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { 
          message: 'OTP generated but email delivery failed',
          warning: 'Please try again or contact support if the issue persists',
          code: 'EMAIL_DELIVERY_FAILED'
        },
        { status: 200 }
      )
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Resend OTP error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
