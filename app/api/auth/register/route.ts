import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import crypto from 'crypto'
import { sendOTPEmail } from '@/lib/email'
import { GameNotifications } from '@/lib/fcm'
import AdminNotifications from '@/lib/adminNotifications'

const prisma = new PrismaClient()

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phoneNumber: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
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

    // Generate unique username: firstname_lastname_userscount
    const baseUsername = validatedData.lastName 
      ? `${validatedData.firstName.toLowerCase()}_${validatedData.lastName.toLowerCase().replace(/\s+/g, '_')}`
      : validatedData.firstName.toLowerCase()
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
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        username: username,
        email: validatedData.email,
        password: hashedPassword,
        phoneNumber: validatedData.phoneNumber || null,
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
        phoneNumber: true,
        avatar: true,
        role: true,
        emailVerified: true,
        createdAt: true
      }
    })

    // Send OTP email
    try {
      await sendOTPEmail(validatedData.email, validatedData.firstName, otp)
    } catch (emailError) {
      console.error('Email sending error:', emailError)
      // Still return success to user, but log the error
    }

    // Notify all admins about new user registration
    try {
      // Send web notifications to admins via Pusher
      await AdminNotifications.newUserRegistration(
        username,
        validatedData.email
      )
      console.log(`✅ Admin web notifications sent for new user: ${username}`)
    } catch (notificationError) {
      console.error('Admin notification error (non-critical):', notificationError)
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

    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
