import prisma from '@/lib/prisma'

/**
 * Warmup function to keep database connections alive
 * Prevents cold starts by maintaining active connection pool
 */
export async function warmupDatabase() {
  try {
    // Simple query to keep connection pool alive and warm
    await prisma.user.findFirst({
      select: { id: true }
    })
    
    // Touch game rooms to warm up that connection too
    await prisma.gameRoom.findFirst({
      select: { id: true }
    })
    
    return { success: true, timestamp: new Date().toISOString() }
  } catch (error) {
    console.error('⚠️ Database warmup failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Start periodic warmup to prevent cold starts
 * Call this once when server starts
 */
export function startPeriodicWarmup(intervalMs: number = 240000) {
  // Warmup every 4 minutes (240000ms)
  setInterval(async () => {
    const result = await warmupDatabase()
    if (result.success) {
      console.log('✅ Database keepalive:', result.timestamp)
    }
  }, intervalMs)
  
  // Initial warmup
  warmupDatabase().then(result => {
    if (result.success) {
      console.log('✅ Initial database warmup complete')
    }
  })
}

