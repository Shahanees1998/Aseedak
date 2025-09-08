import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const room = await prisma.gameRoom.findUnique({
      where: { code: params.code },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json(
        { message: 'Room not found' },
        { status: 404 }
      )
    }

    // Check if user is the creator
    if (room.createdBy !== decoded.userId) {
      return NextResponse.json(
        { message: 'Only room creator can start the game' },
        { status: 403 }
      )
    }

    // Check if room has enough players (2-6)
    if (room.players.length < 2 || room.players.length > 6) {
      return NextResponse.json(
        { message: 'Room must have 2-6 players to start' },
        { status: 400 }
      )
    }

    // Check if game is already started
    if (room.status !== 'WAITING') {
      return NextResponse.json(
        { message: 'Game already started or finished' },
        { status: 400 }
      )
    }

    // Start the game
    await prisma.gameRoom.update({
      where: { id: room.id },
      data: {
        status: 'STARTING',
        startedAt: new Date()
      }
    })

    // TODO: Implement game logic to assign targets, characters, and words
    // This would involve:
    // 1. Randomly assign targets (no loops)
    // 2. Assign characters from available packs
    // 3. Assign secret words from selected decks
    // 4. Update game status to 'IN_PROGRESS'

    return NextResponse.json({
      message: 'Game started successfully',
      room: {
        id: room.id,
        code: room.code,
        status: 'STARTING',
        players: room.players.map(p => ({
          id: p.id,
          username: p.user.username,
          avatar: p.user.avatar,
          position: p.position
        }))
      }
    })

  } catch (error) {
    console.error('Error starting game:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
