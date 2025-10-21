import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { getStripe } from '@/lib/stripe'


const purchaseSchema = z.object({
  type: z.enum(['character', 'character_pack', 'word_deck']),
  itemId: z.string()
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
    const validatedData = purchaseSchema.parse(body)

    let item: any
    let price: number

    // Get item details based on type
    switch (validatedData.type) {
      case 'character':
        item = await prisma.character.findUnique({
          where: { id: validatedData.itemId }
        })
        price = item?.price || 0
        break
      
      case 'character_pack':
        item = await prisma.characterPack.findUnique({
          where: { id: validatedData.itemId }
        })
        price = item?.price || 0
        break
      
      case 'word_deck':
        item = await prisma.wordDeck.findUnique({
          where: { id: validatedData.itemId }
        })
        price = item?.price || 0
        break
      
      default:
        return NextResponse.json(
          { message: 'Invalid purchase type' },
          { status: 400 }
        )
    }

    if (!item) {
      return NextResponse.json(
        { message: 'Item not found' },
        { status: 404 }
      )
    }

    if (price === 0) {
      return NextResponse.json(
        { message: 'This item is free' },
        { status: 400 }
      )
    }

    // Check if user already owns this item
    const existingPurchase = await prisma.userPurchase.findFirst({
      where: {
        userId: user.userId,
        type: validatedData.type,
        itemId: validatedData.itemId,
        status: 'completed'
      }
    })

    if (existingPurchase) {
      return NextResponse.json(
        { message: 'You already own this item' },
        { status: 400 }
      )
    }

    // Create Stripe Payment Intent
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: price,
      currency: 'usd',
      metadata: {
        userId: user.userId,
        type: validatedData.type,
        itemId: validatedData.itemId
      }
    })

    // Create pending purchase record
    await prisma.userPurchase.create({
      data: {
        userId: user.userId,
        type: validatedData.type,
        itemId: validatedData.itemId,
        stripePaymentIntentId: paymentIntent.id,
        amount: price,
        status: 'pending'
      }
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Mobile purchase error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
