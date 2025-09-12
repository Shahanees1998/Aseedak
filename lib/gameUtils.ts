import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function updateGameEndStatistics(roomId: string, winnerId?: string) {
  try {
    // Get all players in the room
    const allPlayers = await prisma.gamePlayer.findMany({
      where: { roomId },
      include: { user: true }
    })

    // Find the winner
    const winner = winnerId ? allPlayers.find(p => p.id === winnerId) : allPlayers.find(p => p.status === 'WINNER')

    if (winner) {
      // Update winner's statistics
      await prisma.user.update({
        where: { id: winner.userId },
        data: {
          gamesPlayed: { increment: 1 },
          gamesWon: { increment: 1 },
          totalKills: { increment: winner.kills }
        }
      })

      // Update all other players' statistics
      for (const player of allPlayers) {
        if (player.id !== winner.id) {
          await prisma.user.update({
            where: { id: player.userId },
            data: {
              gamesPlayed: { increment: 1 },
              totalKills: { increment: player.kills }
            }
          })
        }
      }
    } else {
      // No winner found, just update games played for all players
      for (const player of allPlayers) {
        await prisma.user.update({
          where: { id: player.userId },
          data: {
            gamesPlayed: { increment: 1 },
            totalKills: { increment: player.kills }
          }
        })
      }
    }

    console.log(`✅ Updated game statistics for room ${roomId}`)
  } catch (error) {
    console.error('❌ Error updating game statistics:', error)
    throw error
  }
}

