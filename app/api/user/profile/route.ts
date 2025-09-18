import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  phoneNumber: z.string().optional(),
  avatar: z.enum(['IMAGE1', 'IMAGE2', 'IMAGE3', 'IMAGE4', 'IMAGE5', 'IMAGE6', 'IMAGE7', 'IMAGE8', 'IMAGE9', 'IMAGE10', 'IMAGE11', 'IMAGE12', 'IMAGE13', 'IMAGE14', 'IMAGE15', 'IMAGE16']).optional()
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!

      const userProfile = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
          phoneNumber: true,
          avatar: true,
          profileImageUrl: true,
          role: true,
          emailVerified: true,
          gamesPlayed: true,
          gamesWon: true,
          totalKills: true,
          createdAt: true
        }
      })

      if (!userProfile) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ user: userProfile })

    } catch (error) {
      console.error('Error fetching user profile:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}

export async function PUT(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!
      const body = await authenticatedReq.json()
      const validatedData = profileUpdateSchema.parse(body)

      // Check if username or email already exists (excluding current user)
      if (validatedData.username || validatedData.email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            AND: [
              { id: { not: user.userId } },
              {
                OR: [
                  ...(validatedData.username ? [{ username: validatedData.username }] : []),
                  ...(validatedData.email ? [{ email: validatedData.email }] : [])
                ]
              }
            ]
          }
        })

        if (existingUser) {
          return NextResponse.json(
            { message: 'Username or email already exists' },
            { status: 400 }
          )
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.userId },
        data: validatedData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
          phoneNumber: true,
          avatar: true,
          profileImageUrl: true,
          role: true,
          emailVerified: true,
          gamesPlayed: true,
          gamesWon: true,
          totalKills: true,
          createdAt: true
        }
      })

      return NextResponse.json(
        { 
          message: 'Profile updated successfully',
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

      console.error('Error updating profile:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}
