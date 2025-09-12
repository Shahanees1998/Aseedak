import { pusher } from '@/lib/pusher'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Send real-time notifications to all admin users via Pusher
 */
export class AdminNotifications {
  /**
   * Send notification to all admin users
   */
  static async sendToAllAdmins(event: string, data: any) {
    try {
      if (!pusher) {
        console.warn('⚠️ Pusher not configured - admin notifications disabled')
        return { success: false, message: 'Pusher not configured' }
      }

      // Get all admin users
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, username: true }
      })

      if (adminUsers.length === 0) {
        return { success: false, message: 'No admin users found' }
      }

      // Send to each admin's personal channel
      const results = []
      for (const admin of adminUsers) {
        try {
          await pusher?.trigger(`admin-${admin.id}`, event, {
            ...data,
            timestamp: new Date().toISOString(),
            adminId: admin.id
          })
          results.push({ adminId: admin.id, success: true })
        } catch (error) {
          console.error(`Failed to send admin notification to ${admin.username}:`, error)
          results.push({ adminId: admin.id, success: false, error: error instanceof Error ? error.message : 'Unknown error' })
        }
      }

      const successCount = results.filter(r => r.success).length
      return {
        success: successCount > 0,
        message: `Sent to ${successCount}/${adminUsers.length} admins`,
        results
      }

    } catch (error) {
      console.error('❌ Error sending admin notifications:', error)
      return { success: false, message: 'Failed to send admin notifications' }
    }
  }

  /**
   * Notify admins about new user registration
   */
  static async newUserRegistration(newUserUsername: string, newUserEmail: string) {
    return this.sendToAllAdmins('new-user-registration', {
      type: 'new_user_registration',
      title: '👤 New User Registered',
      message: `${newUserUsername} (${newUserEmail}) just joined the platform`,
      newUserUsername,
      newUserEmail
    })
  }

  /**
   * Notify admins about new game room creation
   */
  static async newGameRoomCreated(roomName: string, roomCode: string, creatorUsername: string) {
    return this.sendToAllAdmins('new-game-room', {
      type: 'new_game_room',
      title: '🎮 New Game Room Created',
      message: `${creatorUsername} created "${roomName}" (${roomCode})`,
      roomName,
      roomCode,
      creatorUsername
    })
  }

  /**
   * Notify admins about game room status changes
   */
  static async gameRoomStatusChanged(roomName: string, roomCode: string, oldStatus: string, newStatus: string) {
    return this.sendToAllAdmins('game-room-status-change', {
      type: 'game_room_status_change',
      title: '🎮 Game Room Status Changed',
      message: `"${roomName}" (${roomCode}) changed from ${oldStatus} to ${newStatus}`,
      roomName,
      roomCode,
      oldStatus,
      newStatus
    })
  }

  /**
   * Notify admins about user statistics updates
   */
  static async userStatisticsUpdated(username: string, gamesPlayed: number, gamesWon: number, totalKills: number) {
    return this.sendToAllAdmins('user-statistics-update', {
      type: 'user_statistics_update',
      title: '📊 User Statistics Updated',
      message: `${username} now has ${gamesPlayed} games played, ${gamesWon} wins, ${totalKills} kills`,
      username,
      gamesPlayed,
      gamesWon,
      totalKills
    })
  }
}

export default AdminNotifications

