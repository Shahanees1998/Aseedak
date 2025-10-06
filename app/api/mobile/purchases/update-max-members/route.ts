import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { verifyToken } from '@/lib/jwt-auth'

const prisma = new PrismaClient()

const updateMaxMembersSchema = z.object({
  newMaxMembers: z.number().min(4).max(20), // Allow up to 20 members
  paymentIntentId: z.string().optional(), // For Stripe integration
  amount: z.number().min(0) // Amount paid in cents
})

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateMaxMembersSchema.parse(body)

    // Check if user already has this or higher max members
    const currentUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { maxMembers: true }
    })

    if (!currentUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    if (currentUser.maxMembers >= validatedData.newMaxMembers) {
      return NextResponse.json(
        { message: 'You already have this or higher member limit' },
        { status: 400 }
      )
    }

    // Create purchase record
    const purchase = await prisma.userPurchase.create({
      data: {
        userId: user.userId,
        type: 'member_upgrade',
        itemId: null,
        stripePaymentIntentId: validatedData.paymentIntentId,
        amount: validatedData.amount,
        status: 'completed',
        metadata: {
          previousMaxMembers: currentUser.maxMembers,
          newMaxMembers: validatedData.newMaxMembers
        }
      }
    })

    // Update user's max members
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: {
        maxMembers: validatedData.newMaxMembers
      },
      select: {
        id: true,
        maxMembers: true,
        username: true
      }
    })

    return NextResponse.json({
      message: 'Max members updated successfully',
      user: updatedUser,
      purchase: {
        id: purchase.id,
        amount: purchase.amount,
        newMaxMembers: validatedData.newMaxMembers
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error updating max members:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's current max members and purchase history
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        maxMembers: true,
        purchases: {
          where: { type: 'member_upgrade' },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            metadata: true,
            createdAt: true
          }
        }
      }
    })

    if (!userData) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      maxMembers: userData.maxMembers,
      purchaseHistory: userData.purchases
    })

  } catch (error) {
    console.error('Error fetching max members info:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
