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
                username: true
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

    // Find the player in this room
    const player = room.players.find(p => p.userId === decoded.userId)
    if (!player) {
      return NextResponse.json(
        { message: 'You are not in this room' },
        { status: 403 }
      )
    }

    // Remove player from room
    await prisma.gamePlayer.delete({
      where: { id: player.id }
    })

    // If this was the creator and game hasn't started, delete the room
    if (room.createdBy === decoded.userId && room.status === 'WAITING') {
      await prisma.gameRoom.delete({
        where: { id: room.id }
      })
      
      return NextResponse.json({
        message: 'Left room and room deleted',
        roomDeleted: true
      })
    }

    // If game is in progress and this was the last player, end the game
    const remainingPlayers = room.players.filter(p => p.id !== player.id)
    if (remainingPlayers.length === 0 && room.status === 'IN_PROGRESS') {
      // Update statistics for all JOINED players only (no winner in this case)
      const joinedPlayers = room.players.filter(p => p.joinStatus === 'JOINED')
      for (const gamePlayer of joinedPlayers) {
        await prisma.user.update({
          where: { id: gamePlayer.userId },
          data: {
            gamesPlayed: { increment: 1 },
            totalKills: { increment: gamePlayer.kills }
          }
        })
      }

      await prisma.gameRoom.update({
        where: { id: room.id },
        data: {
          status: 'FINISHED',
          finishedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      message: 'Left room successfully',
      roomDeleted: false
    })

  } catch (error) {
    console.error('Error leaving room:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
