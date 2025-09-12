import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import AdminNotifications from '@/lib/adminNotifications'

/**
 * POST /api/admin/notifications/test
 * Test admin notification functionality
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!
      
      // Check if user is admin
      if (user.role !== 'ADMIN') {
        return NextResponse.json(
          { message: 'Unauthorized - Admin access required' },
          { status: 403 }
        )
      }

      const body = await request.json()
      const { type = 'new_user' } = body

      let result

      switch (type) {
        case 'new_user':
          result = await AdminNotifications.newUserRegistration(
            'Test User',
            'test@example.com'
          )
          break
        case 'new_room':
          result = await AdminNotifications.newGameRoomCreated(
            'Test Game Room',
            'TEST123',
            'Test Creator'
          )
          break
        case 'status_change':
          result = await AdminNotifications.gameRoomStatusChanged(
            'Test Room',
            'TEST123',
            'WAITING',
            'IN_PROGRESS'
          )
          break
        case 'statistics':
          result = await AdminNotifications.userStatisticsUpdated(
            'Test User',
            5,
            2,
            3
          )
          break
        default:
          result = await AdminNotifications.newUserRegistration(
            'Test User',
            'test@example.com'
          )
      }

      return NextResponse.json({
        message: 'Test admin notification sent',
        type,
        result
      })

    } catch (error) {
      console.error('Error sending test admin notification:', error)
      return NextResponse.json(
        { message: 'Failed to send test admin notification', error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  })
}

