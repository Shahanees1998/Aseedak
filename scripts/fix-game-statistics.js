const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixGameStatistics() {
  try {
    console.log('🔍 Finding finished games without proper statistics...')
    
    // Find all finished games
    const finishedGames = await prisma.gameRoom.findMany({
      where: { status: 'FINISHED' },
      include: {
        players: {
          include: {
            user: true
          }
        }
      }
    })

    console.log(`📊 Found ${finishedGames.length} finished games`)

    for (const game of finishedGames) {
      console.log(`\n🎮 Processing game: ${game.name} (${game.code})`)
      
      // Only process JOINED players (exclude INVITED players who never joined)
      const joinedPlayers = game.players.filter(p => p.joinStatus === 'JOINED')
      console.log(`👥 Found ${joinedPlayers.length} joined players out of ${game.players.length} total players`)
      
      // Find the winner among joined players
      const winner = joinedPlayers.find(p => p.status === 'WINNER')
      
      if (winner) {
        console.log(`🏆 Winner: ${winner.user.username}`)
        
        // Update winner's statistics
        await prisma.user.update({
          where: { id: winner.userId },
          data: {
            gamesPlayed: { increment: 1 },
            gamesWon: { increment: 1 },
            totalKills: { increment: winner.kills }
          }
        })
        console.log(`✅ Updated winner statistics for ${winner.user.username}`)
        
        // Update all other JOINED players' statistics
        for (const player of joinedPlayers) {
          if (player.id !== winner.id) {
            await prisma.user.update({
              where: { id: player.userId },
              data: {
                gamesPlayed: { increment: 1 },
                totalKills: { increment: player.kills }
              }
            })
            console.log(`✅ Updated player statistics for ${player.user.username}`)
          }
        }
      } else {
        console.log(`⚠️  No winner found for game ${game.code}`)
        
        // Update all JOINED players' statistics (no winner)
        for (const player of joinedPlayers) {
          await prisma.user.update({
            where: { id: player.userId },
            data: {
              gamesPlayed: { increment: 1 },
              totalKills: { increment: player.kills }
            }
          })
          console.log(`✅ Updated player statistics for ${player.user.username}`)
        }
      }
    }

    console.log('\n🎉 All game statistics have been fixed!')
    
  } catch (error) {
    console.error('❌ Error fixing game statistics:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixGameStatistics()
