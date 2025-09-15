import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const userUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  avatar: z.enum(['IMAGE1', 'IMAGE2', 'IMAGE3', 'IMAGE4', 'IMAGE5', 'IMAGE6', 'IMAGE7', 'IMAGE8', 'IMAGE9', 'IMAGE10', 'IMAGE11', 'IMAGE12', 'IMAGE13', 'IMAGE14', 'IMAGE15', 'IMAGE16']).optional(),
  isActive: z.boolean().optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {

    const body = await request.json()
    const validatedData = userUpdateSchema.parse(body)

    // Check if username or email already exists (excluding current user)
    if (validatedData.username || validatedData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: params.id } },
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

    // Hash password if provided
    const updateData: any = { ...validatedData }
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 12)
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
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
        message: 'User updated successfully',
        user 
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

      console.error('Error updating user:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {

    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    )

    } catch (error) {
      console.error('Error deleting user:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  });
}
