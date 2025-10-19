import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import prisma from '@/lib/prisma'


export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      // Get all users with their statistics
      const users = await prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
          avatar: true,
          gamesPlayed: true,
          gamesWon: true,
          totalKills: true,
          isActive: true,
          createdAt: true
        },
        orderBy: { gamesWon: 'desc' }
      })

      // Calculate statistics
      const totalUsers = users.length
      const activeUsers = users.filter(user => user.isActive).length
      const totalGames = users.reduce((sum, user) => sum + user.gamesPlayed, 0)
      
      // Calculate win rates for each user
      const usersWithWinRate = users.map(user => ({
        ...user,
        winRate: user.gamesPlayed > 0 ? (user.gamesWon / user.gamesPlayed) * 100 : 0
      }))

      // Calculate average win rate
      const averageWinRate = usersWithWinRate.length > 0 
        ? usersWithWinRate.reduce((sum, user) => sum + user.winRate, 0) / usersWithWinRate.length 
        : 0

      // Get top players (top 10 by wins)
      const topPlayers = usersWithWinRate.slice(0, 10)

      // Calculate total revenue (placeholder - you might want to implement actual revenue tracking)
      const totalRevenue = 0 // This would come from actual payment records

      // Get recent activity (placeholder - you might want to implement actual activity tracking)
      const recentActivity: any[] = []

      const statistics = {
        totalUsers,
        activeUsers,
        totalGames,
        totalRevenue,
        averageWinRate,
        topPlayers,
        recentActivity
      }

      return NextResponse.json(statistics)

    } catch (error) {
      console.error('Error fetching user statistics:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } 
  });
}
