const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetGameStatistics() {
  try {
    console.log('🔄 RESETTING ALL GAME STATISTICS...')
    console.log('='.repeat(50))
    
    // Reset all user statistics to 0
    console.log('📊 Resetting all user statistics to 0...')
    await prisma.user.updateMany({
      data: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalKills: 0
      }
    })
    console.log('✅ All user statistics reset to 0')
    
    // Now recalculate statistics correctly for finished games only
    console.log('\n🔍 Recalculating statistics for finished games...')
    
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

    console.log('\n🎉 All game statistics have been reset and recalculated correctly!')
    
    // Show final statistics
    console.log('\n📊 FINAL STATISTICS:')
    const users = await prisma.user.findMany({
      select: {
        username: true,
        firstName: true,
        gamesPlayed: true,
        gamesWon: true,
        totalKills: true
      },
      orderBy: { gamesPlayed: 'desc' }
    })
    
    users.forEach(user => {
      if (user.gamesPlayed > 0) {
        console.log(`👤 ${user.username} (${user.firstName}):`)
        console.log(`   Games Played: ${user.gamesPlayed}`)
        console.log(`   Games Won: ${user.gamesWon}`)
        console.log(`   Total Kills: ${user.totalKills}`)
        console.log('')
      }
    })
    
  } catch (error) {
    console.error('❌ Error resetting game statistics:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetGameStatistics()

