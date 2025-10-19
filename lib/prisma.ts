import { PrismaClient } from '@prisma/client'

/**
 * OPTIMIZED PRISMA CLIENT - SINGLETON PATTERN
 * 
 * This prevents creating multiple Prisma instances which causes:
 * - Slow database connections
 * - Connection pool exhaustion
 * - Memory leaks
 * 
 * Instead, we reuse a single instance across all requests.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Performance optimizations
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

export default prisma

