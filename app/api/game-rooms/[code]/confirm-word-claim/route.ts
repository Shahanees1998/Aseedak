import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'
import { pusher } from '@/lib/pusher'
import { z } from 'zod'

const prisma = new PrismaClient()

const confirmWordClaimSchema = z.object({
  wordClaimId: z.string().min(1, 'Word claim ID is required'),
  isCorrect: z.boolean()
})

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!

      const body = await authenticatedReq.json()
      const validatedData = confirmWordClaimSchema.parse(body)

    const room = await prisma.gameRoom.findUnique({
      where: { code: params.code },
      include: {
        players: true
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

    // Get the word claim
    const wordClaim = await prisma.killConfirmation.findUnique({
      where: { id: validatedData.wordClaimId },
      include: {
        killer: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
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
      }
    })

    if (!wordClaim) {
      return NextResponse.json(
        { message: 'Word claim not found' },
        { status: 404 }
      )
    }

    // Verify the target player is confirming
      if (wordClaim.target.userId !== user.userId) {
      return NextResponse.json(
        { message: 'Only the target player can confirm the word claim' },
        { status: 403 }
      )
    }

    if (wordClaim.status !== 'pending') {
      return NextResponse.json(
        { message: 'Word claim has already been responded to' },
        { status: 400 }
      )
    }

    // Update word claim status
    await prisma.killConfirmation.update({
      where: { id: validatedData.wordClaimId },
      data: {
        status: validatedData.isCorrect ? 'accepted' : 'rejected',
        respondedAt: new Date()
      }
    })

    if (validatedData.isCorrect) {
      // Eliminate target player
      await prisma.gamePlayer.update({
        where: { id: wordClaim.targetId },
        data: {
          status: 'ELIMINATED',
          eliminatedAt: new Date()
        }
      })

      // Update killer's kills
      await prisma.gamePlayer.update({
        where: { id: wordClaim.killerId },
        data: {
          kills: wordClaim.killer.kills + 1
        }
      })

      // Transfer target's target to killer
      if (wordClaim.target.targetId) {
        await prisma.gamePlayer.update({
          where: { id: wordClaim.killerId },
          data: {
            targetId: wordClaim.target.targetId
          }
        })
      }

      // Create elimination log
      await prisma.gameLog.create({
        data: {
          roomId: room.id,
          type: 'elimination',
          message: `${wordClaim.target.user.username} was eliminated by ${wordClaim.killer.user.username} for saying "${wordClaim.message}"!`,
          playerId: wordClaim.killerId,
          targetId: wordClaim.targetId,
          data: {
            eliminatedPlayer: wordClaim.target.user,
            killerPlayer: wordClaim.killer.user,
            wordClaimId: validatedData.wordClaimId,
            word: wordClaim.message
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
            eliminatedPlayer: wordClaim.target.user,
            killerPlayer: wordClaim.killer.user,
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
      // Word claim was rejected - create log
      await prisma.gameLog.create({
        data: {
          roomId: room.id,
          type: 'word_claim_rejected',
          message: `${wordClaim.killer.user.username}'s word claim was rejected by ${wordClaim.target.user.username}`,
          playerId: wordClaim.killerId,
          targetId: wordClaim.targetId,
          data: {
            wordClaimId: validatedData.wordClaimId,
            word: wordClaim.message,
            killer: wordClaim.killer.user,
            target: wordClaim.target.user
          }
        }
      })

      // Notify killer about rejection
      if (pusher) {
        await pusher.trigger(`room-${params.code}`, 'word-claim-rejected', {
          wordClaim,
          killer: wordClaim.killer.user,
          target: wordClaim.target.user,
          word: wordClaim.message
        })
      }
    }

    return NextResponse.json(
      { 
        message: `Word claim ${validatedData.isCorrect ? 'confirmed' : 'rejected'} successfully`
      },
      { status: 200 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

      console.error('Error confirming word claim:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}
