import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { sendOTPEmail } from '@/lib/email'

const prisma = new PrismaClient()

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Split full name into first and last name for database storage
    const nameParts = validatedData.fullName.trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''
    
    // Generate unique username: firstname_lastname_userscount
    const baseUsername = lastName 
      ? `${firstName.toLowerCase()}_${lastName.toLowerCase().replace(/\s+/g, '_')}`
      : firstName.toLowerCase()
    let username = baseUsername
    let userCount = 1
    
    // Check if username exists and increment counter
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}_${userCount}`
      userCount++
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Generate OTP (4 digits)
    const otp = crypto.randomInt(1000, 9999).toString()
    const emailVerifyExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Create user with unverified email
    const user = await prisma.user.create({
      data: {
        firstName: firstName,
        lastName: lastName,
        username: username,
        email: validatedData.email,
        phoneNumber: validatedData.phoneNumber,
        password: hashedPassword,
        avatar: null,
        role: 'USER',
        emailVerified: false,
        emailVerifyToken: otp,
        emailVerifyExpiry: emailVerifyExpiry
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

    // Send OTP email
    try {
      await sendOTPEmail(validatedData.email, firstName, otp)
    } catch (emailError) {
      console.error('Email sending error:', emailError)
      // Still return success to user, but log the error
    }

    return NextResponse.json(
      { 
        message: 'Account created successfully! Please check your email for verification code.',
        user: {
          ...user,
          emailVerified: false
        }
      },
      { status: 201 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Mobile registration error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
