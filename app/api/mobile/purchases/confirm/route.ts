import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { getStripe } from '@/lib/stripe'

const prisma = new PrismaClient()

const confirmSchema = z.object({
  paymentIntentId: z.string()
})

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = confirmSchema.parse(body)

    // Get payment intent from Stripe
    const paymentIntent = await getStripe().paymentIntents.retrieve(validatedData.paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { message: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Find the purchase record
    const purchase = await prisma.userPurchase.findFirst({
      where: {
        userId: user.userId,
        stripePaymentIntentId: validatedData.paymentIntentId,
        status: 'pending'
      }
    })

    if (!purchase) {
      return NextResponse.json(
        { message: 'Purchase record not found' },
        { status: 404 }
      )
    }

    // Update purchase status
    await prisma.userPurchase.update({
      where: { id: purchase.id },
      data: { status: 'completed' }
    })

    // Unlock the item for the user
    if (purchase.type === 'character' && purchase.itemId) {
      await prisma.character.update({
        where: { id: purchase.itemId },
        data: { isUnlocked: true }
      })
    }

    return NextResponse.json({
      message: 'Purchase confirmed successfully',
      purchase: {
        id: purchase.id,
        type: purchase.type,
        itemId: purchase.itemId,
        amount: purchase.amount,
        status: 'completed'
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Mobile purchase confirmation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
