import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { verifyToken } from '@/lib/jwt-auth'


const purchaseCharacterSchema = z.object({
  characterId: z.string(),
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
    const validatedData = purchaseCharacterSchema.parse(body)

    // Check if character exists and is available for purchase
    const character = await prisma.character.findUnique({
      where: { id: validatedData.characterId },
      select: {
        id: true,
        name: true,
        price: true,
        isActive: true,
        isUnlocked: true,
        isPaid: true
      }
    })

    if (!character) {
      return NextResponse.json(
        { message: 'Character not found' },
        { status: 404 }
      )
    }

    if (!character.isActive) {
      return NextResponse.json(
        { message: 'Character is not available for purchase' },
        { status: 400 }
      )
    }

    if (character.isUnlocked || !character.isPaid) {
      return NextResponse.json(
        { message: 'Character is free and does not require purchase' },
        { status: 400 }
      )
    }

    // Check if user already owns this character
    const existingOwnership = await prisma.userCharacter.findUnique({
      where: {
        userId_characterId: {
          userId: user.userId,
          characterId: validatedData.characterId
        }
      }
    })

    if (existingOwnership) {
      return NextResponse.json(
        { message: 'You already own this character' },
        { status: 400 }
      )
    }

    // Verify the amount matches the character price
    if (validatedData.amount !== character.price) {
      return NextResponse.json(
        { message: 'Amount does not match character price' },
        { status: 400 }
      )
    }

    // Create purchase record
    const purchase = await prisma.userPurchase.create({
      data: {
        userId: user.userId,
        type: 'character',
        itemId: validatedData.characterId,
        stripePaymentIntentId: validatedData.paymentIntentId,
        amount: validatedData.amount,
        status: 'completed'
      }
    })

    // Add character to user's collection
    const userCharacter = await prisma.userCharacter.create({
      data: {
        userId: user.userId,
        characterId: validatedData.characterId,
        purchaseId: purchase.id
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Character purchased successfully',
      character: userCharacter.character,
      purchase: {
        id: purchase.id,
        amount: purchase.amount
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error purchasing character:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
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

    // Get user's purchased characters
    const userCharacters = await prisma.userCharacter.findMany({
      where: { userId: user.userId },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            price: true
          }
        },
        purchase: {
          select: {
            id: true,
            amount: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      characters: userCharacters.map(uc => ({
        id: uc.character.id,
        name: uc.character.name,
        description: uc.character.description,
        imageUrl: uc.character.imageUrl,
        price: uc.character.price,
        purchasedAt: uc.createdAt,
        purchaseId: uc.purchase?.id
      }))
    })

  } catch (error) {
    console.error('Error fetching user characters:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
