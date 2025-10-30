import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const updateUserSchema = z.object({
  newGamesPurchased: z.number().int().min(0).optional(),
  maxMembers: z.number().int().min(1).optional(),
  characters: z.array(z.string()).optional(), // Array of character IDs purchased
  wordDecks: z.array(z.string()).optional() // Array of word deck IDs purchased
})

export async function PUT(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!
      const body = await authenticatedReq.json()
      const validatedData = updateUserSchema.parse(body)

      // Build update object
      const updateData: any = {}

      // If purchasing games, add to existing allowedGames
      if (validatedData.newGamesPurchased !== undefined) {
        // Fetch current allowedGames
        const currentUser = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { allowedGames: true }
        })

        if (currentUser) {
          updateData.allowedGames = currentUser.allowedGames + validatedData.newGamesPurchased
        }
      }

      // If updating maxMembers, replace entirely
      if (validatedData.maxMembers !== undefined) {
        updateData.maxMembers = validatedData.maxMembers
      }

      // If purchasing characters, create UserCharacter records
      if (validatedData.characters && validatedData.characters.length > 0) {
        // Verify all characters exist and are active
        const characters = await prisma.character.findMany({
          where: {
            id: { in: validatedData.characters },
            isActive: true
          }
        })

        if (characters.length !== validatedData.characters.length) {
          return NextResponse.json(
            { message: 'Some characters are invalid or inactive' },
            { status: 400 }
          )
        }

        // Create user character associations (will skip duplicates due to unique constraint)
        await Promise.all(
          validatedData.characters.map(async (characterId) => {
            await prisma.userCharacter.upsert({
              where: {
                userId_characterId: {
                  userId: user.userId,
                  characterId: characterId
                }
              },
              create: {
                userId: user.userId,
                characterId: characterId
              },
              update: {} // Do nothing on update
            })
          })
        )
      }

      // If purchasing word decks, create UserPurchase records (completed)
      let purchasedDecks = 0
      if (validatedData.wordDecks && validatedData.wordDecks.length > 0) {
        // Verify decks exist and are active
        const decks = await prisma.wordDeck.findMany({
          where: { id: { in: validatedData.wordDecks }, isActive: true },
          select: { id: true, price: true }
        })

        if (decks.length !== validatedData.wordDecks.length) {
          return NextResponse.json(
            { message: 'Some word decks are invalid or inactive' },
            { status: 400 }
          )
        }

        // Create a purchase row per deck (idempotent: skip if already purchased)
        for (const deck of decks) {
          const existing = await prisma.userPurchase.findFirst({
            where: { userId: user.userId, type: 'word_deck', itemId: deck.id, status: 'completed' }
          })
          if (!existing) {
            await prisma.userPurchase.create({
              data: {
                userId: user.userId,
                type: 'word_deck',
                itemId: deck.id,
                amount: deck.price,
                status: 'completed'
              }
            })
            purchasedDecks += 1
          }
        }
      }

      // Update user if there's any data to update
      let updatedUser = null
      if (Object.keys(updateData).length > 0) {
        updatedUser = await prisma.user.update({
          where: { id: user.userId },
          data: updateData,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            username: true,
            allowedGames: true,
            maxMembers: true,
            gamesPlayed: true,
            gamesWon: true,
            totalKills: true
          }
        })
      } else if (!validatedData.characters || validatedData.characters.length === 0) {
        // If no update data and no characters, fetch current user
        updatedUser = await prisma.user.findUnique({
          where: { id: user.userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            username: true,
            allowedGames: true,
            maxMembers: true,
            gamesPlayed: true,
            gamesWon: true,
            totalKills: true
          }
        })
      }

      // If characters were purchased, fetch user with character count
      let characterCount = 0
      if (validatedData.characters && validatedData.characters.length > 0) {
        const count = await prisma.userCharacter.count({
          where: { userId: user.userId }
        })
        characterCount = count
      }

      return NextResponse.json({
        message: 'User updated successfully',
        user: updatedUser,
        purchasedCharacters: validatedData.characters?.length || 0,
        totalCharactersOwned: characterCount || undefined,
        purchasedWordDecks: purchasedDecks || undefined
      })

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
    }
  })
}


