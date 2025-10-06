import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/jwt-auth'

const prisma = new PrismaClient()

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

    // Get user's available characters (purchased + default unlocked)
    const userCharacters = await prisma.userCharacter.findMany({
      where: { userId: user.userId },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            isActive: true
          }
        }
      }
    })

    // Get default unlocked characters
    const defaultCharacters = await prisma.character.findMany({
      where: {
        isActive: true,
        isUnlocked: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true
      }
    })

    // Combine all available characters
    const allAvailableCharacters = [
      ...userCharacters.map(uc => uc.character),
      ...defaultCharacters
    ]

    if (allAvailableCharacters.length === 0) {
      return NextResponse.json(
        { message: 'No characters available for assignment' },
        { status: 400 }
      )
    }

    // Get all players in the room (excluding creator if they don't want a character)
    const players = room.players.filter(player => player.joinStatus === 'JOINED')
    
    if (players.length === 0) {
      return NextResponse.json(
        { message: 'No players to assign characters to' },
        { status: 400 }
      )
    }

    // Randomly assign characters to players
    const shuffledCharacters = [...allAvailableCharacters].sort(() => 0.5 - Math.random())
    const assignments = []

    for (let i = 0; i < players.length; i++) {
      const player = players[i]
      const character = shuffledCharacters[i % shuffledCharacters.length] // Cycle through characters if more players than characters
      
      // Update player with assigned character
      await prisma.gamePlayer.update({
        where: { id: player.id },
        data: { characterId: character.id }
      })

      assignments.push({
        playerId: player.id,
        playerName: player.user.username,
        characterId: character.id,
        characterName: character.name,
        characterImage: character.imageUrl
      })
    }

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
      message: 'Characters assigned randomly successfully',
      assignments,
      players: updatedPlayers
    })

  } catch (error) {
    console.error('Error assigning characters randomly:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
