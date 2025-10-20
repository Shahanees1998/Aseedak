import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, requireAuth, AuthenticatedUser } from '@/lib/jwt-auth'
import { PrismaClient } from '@prisma/client'
import { pusher } from '@/lib/pusher'
import { z } from 'zod'

const prisma = new PrismaClient()

const confirmGuessSchema = z.object({
  guessId: z.string().min(1, 'Guess ID is required'),
  isCorrect: z.boolean()
})

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = confirmGuessSchema.parse(body)

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

    if (room.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { message: 'Game is not in progress' },
        { status: 400 }
      )
    }

    // Get the guess log
    const guessLog = await prisma.gameLog.findUnique({
      where: { id: validatedData.guessId }
    })

    if (!guessLog) {
      return NextResponse.json(
        { message: 'Guess not found' },
        { status: 404 }
      )
    }

    // Verify the target player is confirming
    const targetPlayer = room.players.find(p => p.id === guessLog.targetId)
    if (!targetPlayer || targetPlayer.userId !== user.userId) {
      return NextResponse.json(
        { message: 'Only the target player can confirm the guess' },
        { status: 403 }
      )
    }

    const guesserPlayer = room.players.find(p => p.id === guessLog.playerId)
    if (!guesserPlayer) {
      return NextResponse.json(
        { message: 'Guesser player not found' },
        { status: 404 }
      )
    }

    if (validatedData.isCorrect) {
      // Eliminate target player
      await prisma.gamePlayer.update({
        where: { id: targetPlayer.id },
        data: {
          status: 'ELIMINATED',
          eliminatedAt: new Date()
        }
      })

      // Update guesser's kills and transfer target's target AND words to guesser
      await prisma.gamePlayer.update({
        where: { id: guesserPlayer.id },
        data: {
          kills: guesserPlayer.kills + 1,
          targetId: targetPlayer.targetId,
          word1: targetPlayer.word1,
          word2: targetPlayer.word2,
          word3: targetPlayer.word3
        }
      })

      // Create elimination log
      await prisma.gameLog.create({
        data: {
          roomId: room.id,
          type: 'elimination',
          message: `${targetPlayer.user.username} was eliminated by ${guesserPlayer.user.username}!`,
          playerId: guesserPlayer.id,
          targetId: targetPlayer.id,
          data: {
            eliminatedPlayer: targetPlayer.user,
            killerPlayer: guesserPlayer.user,
            word: (guessLog.data as any)?.word
          }
        }
      })

      // Check if game should end
      const alivePlayers = await prisma.gamePlayer.count({
        where: {
          roomId: room.id,
          status: 'ALIVE'
        }
      })

      if (alivePlayers <= 1) {
        // Game ended - find winner
        const winner = await prisma.gamePlayer.findFirst({
          where: {
            roomId: room.id,
            status: 'ALIVE'
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        })

        if (winner) {
          // Update winner status
          await prisma.gamePlayer.update({
            where: { id: winner.id },
            data: { status: 'WINNER' }
          })

          // Update room status
          await prisma.gameRoom.update({
            where: { id: room.id },
            data: {
              status: 'FINISHED',
              finishedAt: new Date()
            }
          })

          // Update user statistics
          await prisma.user.update({
            where: { id: winner.userId },
            data: {
              gamesPlayed: { increment: 1 },
              gamesWon: { increment: 1 }
            }
          })

          // Update other JOINED players' statistics (exclude INVITED players)
          await prisma.user.updateMany({
            where: {
              id: {
                in: room.players
                  .filter(p => p.userId !== winner.userId && p.joinStatus === 'JOINED')
                  .map(p => p.userId)
              }
            },
            data: {
              gamesPlayed: { increment: 1 }
            }
          })

          // Create game end log
          await prisma.gameLog.create({
            data: {
              roomId: room.id,
              type: 'game_end',
              message: `Game ended! ${winner.user.username} won!`,
              playerId: winner.id,
              data: {
                winner: winner.user
              }
            }
          })

          // Notify all players
          if (pusher) {
            await pusher.trigger(`room-${params.code}`, 'game-ended', {
            room: await prisma.gameRoom.findUnique({
              where: { id: room.id },
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
                  },
                  orderBy: { position: 'asc' }
                },
                creator: {
                  select: {
                    id: true,
                    username: true,
                    avatar: true
                  }
                }
              }
            }),
            winner: winner.user
          })
          }
        }
      } else {
        // Continue game - notify elimination
        const updatedRoom = await prisma.gameRoom.findUnique({
          where: { id: room.id },
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
            }
          }
        })

        if (pusher) {
          await pusher.trigger(`room-${params.code}`, 'elimination', {
            room: updatedRoom,
            eliminatedPlayer: targetPlayer.user,
            killerPlayer: guesserPlayer.user,
            log: await prisma.gameLog.findFirst({
              where: {
                roomId: room.id,
                type: 'elimination'
              },
              orderBy: { createdAt: 'desc' }
            })
          })
        }
      }
    } else {
      // Guess was incorrect - create log
      await prisma.gameLog.create({
        data: {
          roomId: room.id,
          type: 'incorrect_guess',
          message: `${guesserPlayer.user.username}'s guess was incorrect`,
          playerId: guesserPlayer.id,
          targetId: targetPlayer.id,
          data: {
            word: (guessLog.data as any)?.word,
            guesser: guesserPlayer.user,
            target: targetPlayer.user
          }
        }
      })
    }

    return NextResponse.json(
      { message: 'Guess confirmed successfully' },
      { status: 200 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error confirming guess:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
