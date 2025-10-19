import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'

const userSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  avatar: z.enum(['IMAGE1', 'IMAGE2', 'IMAGE3', 'IMAGE4', 'IMAGE5', 'IMAGE6', 'IMAGE7', 'IMAGE8', 'IMAGE9', 'IMAGE10', 'IMAGE11', 'IMAGE12', 'IMAGE13', 'IMAGE14', 'IMAGE15', 'IMAGE16']),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
          avatar: true,
          role: true,
          isActive: true,
          gamesPlayed: true,
          gamesWon: true,
          totalKills: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({ users })

    } catch (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const body = await request.json()
      const validatedData = userSchema.parse(body)

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: validatedData.email },
            { username: validatedData.username }
          ]
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { message: 'User with this email or username already exists' },
          { status: 400 }
        )
      }

      // Hash password if provided
      let hashedPassword = ''
      if (validatedData.password) {
        hashedPassword = await bcrypt.hash(validatedData.password, 12)
      }

      const user = await prisma.user.create({
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          username: validatedData.username,
          email: validatedData.email,
          password: hashedPassword,
          avatar: validatedData.avatar,
          isActive: validatedData.isActive,
          role: 'USER'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
          avatar: true,
          role: true,
          isActive: true,
          gamesPlayed: true,
          gamesWon: true,
          totalKills: true,
          createdAt: true
        }
      })

      return NextResponse.json(
        { 
          message: 'User created successfully',
          user 
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

      console.error('Error creating user:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    }
  });
}
