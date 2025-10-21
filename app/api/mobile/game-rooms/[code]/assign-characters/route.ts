import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { verifyToken } from '@/lib/jwt-auth'


const assignCharactersSchema = z.object({
  assignments: z.array(z.object({
    playerId: z.string(),
    characterId: z.string()
  }))
})

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = assignCharactersSchema.parse(body)

    // Get the game room and verify user is the creator
    const room = await prisma.gameRoom.findUnique({
      where: { code: params.code },
      include: {
        players: {
          include: {
            user: {
              select: { id: true, username: true }
            }
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json(
        { message: 'Game room not found' },
        { status: 404 }
      )
    }

    if (room.createdBy !== user.userId) {
      return NextResponse.json(
        { message: 'Only the room creator can assign characters' },
        { status: 403 }
      )
    }

    if (room.status !== 'WAITING') {
      return NextResponse.json(
        { message: 'Characters can only be assigned before the game starts' },
        { status: 400 }
      )
    }

    // Verify all characters belong to the user or are unlocked by default
    const characterIds = validatedData.assignments.map(a => a.characterId)
    const characters = await prisma.character.findMany({
      where: {
        id: { in: characterIds },
        isActive: true
      }
    })

    // Check if user owns all characters or they are unlocked by default
    const userCharacters = await prisma.userCharacter.findMany({
      where: {
        userId: user.userId,
        characterId: { in: characterIds }
      },
      select: { characterId: true }
    })

    const ownedCharacterIds = new Set(userCharacters.map(uc => uc.characterId))

    for (const character of characters) {
      if (!character.isUnlocked && !ownedCharacterIds.has(character.id)) {
        return NextResponse.json(
          { message: `You don't own character: ${character.name}` },
          { status: 400 }
        )
      }
    }

    // Verify all player IDs exist in the room
    const roomPlayerIds = room.players.map(p => p.id)
    for (const assignment of validatedData.assignments) {
      if (!roomPlayerIds.includes(assignment.playerId)) {
        return NextResponse.json(
          { message: 'Invalid player ID' },
          { status: 400 }
        )
      }
    }

    // Assign characters to players
    const updatePromises = validatedData.assignments.map(assignment =>
      prisma.gamePlayer.update({
        where: { id: assignment.playerId },
        data: { characterId: assignment.characterId }
      })
    )

    await Promise.all(updatePromises)

    // Get updated players with character info
    const updatedPlayers = await prisma.gamePlayer.findMany({
      where: { roomId: room.id },
      include: {
        user: {
          select: { id: true, username: true }
        },
        character: {
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Characters assigned successfully',
      players: updatedPlayers
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error assigning characters:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
