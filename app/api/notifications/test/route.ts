import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { GameNotifications } from '@/lib/fcm'

/**
 * POST /api/notifications/test
 * Test FCM notification functionality
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!
      const body = await authenticatedReq.json()
      const { type = 'test' } = body

      let result

      switch (type) {
        case 'elimination':
          result = await GameNotifications.eliminationRequest(
            user.userId,
            'Test Killer',
            ['test', 'words', 'here'],
            'TEST123'
          )
          break
        case 'new_target':
          result = await GameNotifications.newTargetAssigned(
            user.userId,
            'Test Target',
            ['new', 'target', 'words'],
            'TEST123'
          )
          break
        case 'game_start':
          result = await GameNotifications.gameStarted(
            user.userId,
            'Test Game',
            'TEST123'
          )
          break
        case 'game_end':
          result = await GameNotifications.gameEnded(
            user.userId,
            'Test Winner',
            'TEST123'
          )
          break
        case 'avatar':
          result = await GameNotifications.newAvatarAssigned(
            user.userId,
            'IMAGE1'
          )
          break
        case 'invitation':
          result = await GameNotifications.gameInvitation(
            user.userId,
            'Test Inviter',
            'Test Room',
            'TEST123'
          )
          break
        default:
          result = await GameNotifications.eliminationRequest(
            user.userId,
            'Test User',
            ['test', 'notification'],
            'TEST123'
          )
      }

      return NextResponse.json({
        message: 'Test notification sent',
        type,
        result
      })

    } catch (error) {
      console.error('Error sending test notification:', error)
      return NextResponse.json(
        { message: 'Failed to send test notification', error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  })
}

