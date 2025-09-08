import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

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

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

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
            },
            target: {
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
          },
          orderBy: { position: 'asc' }
        },
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        gameLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!room) {
      return NextResponse.json(
        { message: 'Room not found' },
        { status: 404 }
      )
    }

    // Find current player
    const currentPlayer = room.players.find(p => p.userId === user.userId)
    if (!currentPlayer) {
      return NextResponse.json(
        { message: 'You are not in this room' },
        { status: 403 }
      )
    }

    // Return room data with player-specific information
    const response = {
      room: {
        id: room.id,
        name: room.name,
        code: room.code,
        status: room.status,
        maxPlayers: room.maxPlayers,
        currentRound: room.currentRound,
        timeLimit: room.timeLimit,
        startedAt: room.startedAt,
        finishedAt: room.finishedAt,
        creator: room.creator,
        players: room.players.map(p => ({
          id: p.id,
          position: p.position,
          status: p.status,
          kills: p.kills,
          eliminatedAt: p.eliminatedAt,
          user: p.user,
          // Only show target info to the player themselves
          target: p.id === currentPlayer.id ? p.target : null
        }))
      },
      currentPlayer: {
        id: currentPlayer.id,
        position: currentPlayer.position,
        status: currentPlayer.status,
        kills: currentPlayer.kills,
        word1: currentPlayer.word1,
        word2: currentPlayer.word2,
        word3: currentPlayer.word3,
        target: currentPlayer.target ? {
          id: currentPlayer.target.id,
          user: currentPlayer.target.user
        } : null
      },
      gameLogs: room.gameLogs
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Mobile room status error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
