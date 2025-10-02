import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Checks for and expires game rooms that have been in progress for 24+ hours
 * This function should be called at the beginning of API endpoints
 */
export async function checkAndExpireOldRooms(): Promise<void> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // Find rooms that have been in progress for 24+ hours
    const expiredRooms = await prisma.gameRoom.findMany({
      where: {
        status: 'IN_PROGRESS',
        startedAt: {
          lte: twentyFourHoursAgo
        }
      },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (expiredRooms.length === 0) {
      return
    }

    console.log(`🕐 Found ${expiredRooms.length} expired room(s) to process`)

    // Process each expired room
    for (const room of expiredRooms) {
      try {
        // Update room status to EXPIRED
        await prisma.gameRoom.update({
          where: { id: room.id },
          data: {
            status: 'EXPIRED',
            finishedAt: new Date()
          }
        })

        // Create game log for room expiration
        await prisma.gameLog.create({
          data: {
            roomId: room.id,
            type: 'game_end',
            message: 'Game expired due to 24-hour time limit',
            data: {
              reason: 'timeout',
              expiredAt: new Date().toISOString(),
              duration: Date.now() - room.startedAt!.getTime()
            }
          }
        })

        // Reset player statistics for this game (since it expired)
        await prisma.gamePlayer.updateMany({
          where: { roomId: room.id },
          data: {
            status: 'ELIMINATED',
            eliminatedAt: new Date()
          }
        })

        console.log(`✅ Expired room: ${room.name} (${room.code}) - Started: ${room.startedAt}`)
        
        // Log player details for debugging
        room.players.forEach(player => {
          console.log(`   - Player: ${player.user.username} (${player.user.email})`)
        })

      } catch (error) {
        console.error(`❌ Error expiring room ${room.id}:`, error)
      }
    }

    console.log(`🎯 Successfully processed ${expiredRooms.length} expired room(s)`)

  } catch (error) {
    console.error('❌ Error in checkAndExpireOldRooms:', error)
  }
}

/**
 * Middleware function that can be used in API routes to automatically check for expired rooms
 */
export async function withRoomExpiration<T>(
  handler: () => Promise<T>
): Promise<T> {
  // Check for expired rooms first
  await checkAndExpireOldRooms()
  
  // Then execute the original handler
  return await handler()
}

/**
 * Get statistics about room expiration
 */
export async function getRoomExpirationStats() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const stats = await prisma.gameRoom.groupBy({
      by: ['status'],
      _count: {
        id: true
      },
      where: {
        startedAt: {
          lte: twentyFourHoursAgo
        }
      }
    })

    const totalExpired = await prisma.gameRoom.count({
      where: {
        status: 'EXPIRED'
      }
    })

    return {
      roomsOlderThan24Hours: stats,
      totalExpiredRooms: totalExpired,
      lastChecked: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error getting room expiration stats:', error)
    return null
  }
}
