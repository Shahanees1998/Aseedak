import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import crypto from 'crypto'

const prisma = new PrismaClient()

const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(4, 'OTP must be 4 digits')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = verifyOTPSchema.parse(body)
    
    // Find user with valid OTP
    const user = await prisma.user.findFirst({
      where: {
        email: validatedData.email,
        resetToken: validatedData.otp,
        resetTokenExpiry: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // Generate a temporary token for password reset (valid for 5 minutes)
    const tempToken = crypto.randomBytes(32).toString('hex')
    const tempTokenExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Update user with temporary token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: tempToken,
        resetTokenExpiry: tempTokenExpiry
      }
    })

    return NextResponse.json({
      message: 'OTP verified successfully',
      tempToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Mobile verify OTP error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
