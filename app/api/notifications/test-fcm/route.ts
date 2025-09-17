import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'
import { GameNotifications, sendPushNotification } from '@/lib/fcm'

const prisma = new PrismaClient()

/**
 * POST /api/notifications/test-fcm
 * Test FCM notifications with dummy device tokens
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!
      const body = await authenticatedReq.json()
      const { testType = 'all', dummyToken } = body

      // Use provided dummy token or create a test token
      const testToken = dummyToken || 'dummy_fcm_token_for_testing_' + Date.now()

      console.log(`🧪 Starting FCM test for user ${user.userId} with token: ${testToken}`)

      // Add the test token to user's FCM tokens temporarily
      const currentUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { fcmTokens: true }
      })

      if (!currentUser) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        )
      }

      // Add test token to user's tokens
      const existingTokens = currentUser.fcmTokens || []
      const updatedTokens = [...existingTokens, testToken]
      
      await prisma.user.update({
        where: { id: user.userId },
        data: { fcmTokens: updatedTokens }
      })

      console.log(`✅ Test token added to user ${user.userId}`)

      const testResults = []

      // Test data
      const testData = {
        roomName: 'Test Game Room',
        roomCode: 'TEST123',
        killerUsername: 'TestKiller',
        targetUsername: 'TestTarget',
        winnerUsername: 'TestWinner',
        inviterUsername: 'TestInviter',
        words: ['test', 'word', 'three'],
        avatarName: 'IMAGE1'
      }

      try {
        // Test 1: Elimination Request
        if (testType === 'all' || testType === 'elimination') {
          console.log('🧪 Testing elimination request notification...')
          const result = await GameNotifications.eliminationRequest(
            user.userId,
            testData.killerUsername,
            testData.words,
            testData.roomCode
          )
          testResults.push({
            type: 'elimination_request',
            success: result.success,
            message: result.message,
            failedTokens: result.failedTokens
          })
          console.log(`✅ Elimination request test: ${result.success ? 'SUCCESS' : 'FAILED'}`)
        }

        // Test 2: New Target Assignment
        if (testType === 'all' || testType === 'new_target') {
          console.log('🧪 Testing new target assignment notification...')
          const result = await GameNotifications.newTargetAssigned(
            user.userId,
            testData.targetUsername,
            testData.words,
            testData.roomCode
          )
          testResults.push({
            type: 'new_target',
            success: result.success,
            message: result.message,
            failedTokens: result.failedTokens
          })
          console.log(`✅ New target assignment test: ${result.success ? 'SUCCESS' : 'FAILED'}`)
        }

        // Test 3: Game Start
        if (testType === 'all' || testType === 'game_start') {
          console.log('🧪 Testing game start notification...')
          const result = await GameNotifications.gameStarted(
            user.userId,
            testData.roomName,
            testData.roomCode
          )
          testResults.push({
            type: 'game_start',
            success: result.success,
            message: result.message,
            failedTokens: result.failedTokens
          })
          console.log(`✅ Game start test: ${result.success ? 'SUCCESS' : 'FAILED'}`)
        }

        // Test 4: Game End
        if (testType === 'all' || testType === 'game_end') {
          console.log('🧪 Testing game end notification...')
          const result = await GameNotifications.gameEnded(
            user.userId,
            testData.winnerUsername,
            testData.roomCode
          )
          testResults.push({
            type: 'game_end',
            success: result.success,
            message: result.message,
            failedTokens: result.failedTokens
          })
          console.log(`✅ Game end test: ${result.success ? 'SUCCESS' : 'FAILED'}`)
        }

        // Test 5: Avatar Assignment
        if (testType === 'all' || testType === 'avatar') {
          console.log('🧪 Testing avatar assignment notification...')
          const result = await GameNotifications.newAvatarAssigned(
            user.userId,
            testData.avatarName
          )
          testResults.push({
            type: 'avatar_assigned',
            success: result.success,
            message: result.message,
            failedTokens: result.failedTokens
          })
          console.log(`✅ Avatar assignment test: ${result.success ? 'SUCCESS' : 'FAILED'}`)
        }

        // Test 6: Game Invitation
        if (testType === 'all' || testType === 'invitation') {
          console.log('🧪 Testing game invitation notification...')
          const result = await GameNotifications.gameInvitation(
            user.userId,
            testData.inviterUsername,
            testData.roomName,
            testData.roomCode
          )
          testResults.push({
            type: 'game_invitation',
            success: result.success,
            message: result.message,
            failedTokens: result.failedTokens
          })
          console.log(`✅ Game invitation test: ${result.success ? 'SUCCESS' : 'FAILED'}`)
        }

        // Test 7: Custom Notification
        if (testType === 'all' || testType === 'custom') {
          console.log('🧪 Testing custom notification...')
          const result = await sendPushNotification(
            {
              title: '🧪 FCM Test Notification',
              body: 'This is a test notification to verify FCM functionality',
              data: {
                type: 'test_notification',
                testId: Date.now().toString(),
                timestamp: new Date().toISOString()
              }
            },
            { 
              userId: user.userId, 
              storeInDatabase: true 
            }
          )
          testResults.push({
            type: 'custom_notification',
            success: result.success,
            message: result.message,
            failedTokens: result.failedTokens
          })
          console.log(`✅ Custom notification test: ${result.success ? 'SUCCESS' : 'FAILED'}`)
        }

        // Test 8: Bulk Notification Test
        if (testType === 'all' || testType === 'bulk') {
          console.log('🧪 Testing bulk notification...')
          const result = await sendPushNotification(
            {
              title: '📱 Bulk FCM Test',
              body: 'Testing bulk notification functionality',
              data: {
                type: 'bulk_test',
                testId: Date.now().toString()
              }
            },
            { 
              tokens: [testToken], // Direct token test
              storeInDatabase: false // Don't store bulk test
            }
          )
          testResults.push({
            type: 'bulk_notification',
            success: result.success,
            message: result.message,
            failedTokens: result.failedTokens
          })
          console.log(`✅ Bulk notification test: ${result.success ? 'SUCCESS' : 'FAILED'}`)
        }

        // Check database storage
        console.log('🧪 Checking database storage...')
        const storedNotifications = await prisma.notification.findMany({
          where: { 
            userId: user.userId,
            createdAt: {
              gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        })

        console.log(`✅ Found ${storedNotifications.length} notifications stored in database`)

        // Clean up test token
        const cleanedTokens = existingTokens.filter(token => token !== testToken)
        await prisma.user.update({
          where: { id: user.userId },
          data: { fcmTokens: cleanedTokens }
        })

        console.log(`🧹 Test token removed from user ${user.userId}`)

        const successCount = testResults.filter(r => r.success).length
        const totalTests = testResults.length

        return NextResponse.json({
          message: `FCM test completed: ${successCount}/${totalTests} tests passed`,
          testResults,
          databaseStorage: {
            notificationsStored: storedNotifications.length,
            recentNotifications: storedNotifications.map(n => ({
              id: n.id,
              title: n.title,
              type: n.type,
              createdAt: n.createdAt
            }))
          },
          testToken: testToken,
          summary: {
            totalTests,
            successfulTests: successCount,
            failedTests: totalTests - successCount,
            databaseNotificationsStored: storedNotifications.length
          }
        })

      } catch (error) {
        console.error('❌ FCM test error:', error)
        
        // Clean up test token on error
        try {
          const cleanedTokens = existingTokens.filter(token => token !== testToken)
          await prisma.user.update({
            where: { id: user.userId },
            data: { fcmTokens: cleanedTokens }
          })
        } catch (cleanupError) {
          console.error('❌ Failed to clean up test token:', cleanupError)
        }

        return NextResponse.json(
          { 
            message: 'FCM test failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            testResults
          },
          { status: 500 }
        )
      }

    } catch (error) {
      console.error('Error in FCM test:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}

/**
 * GET /api/notifications/test-fcm
 * Get FCM test information and available test types
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user!

      const currentUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { 
          fcmTokens: true,
          notificationSettings: true
        }
      })

      if (!currentUser) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        message: 'FCM Test Endpoint Information',
        user: {
          userId: user.userId,
          fcmTokenCount: (currentUser.fcmTokens || []).length,
          hasNotificationSettings: !!currentUser.notificationSettings
        },
        availableTestTypes: [
          'all',           // Test all notification types
          'elimination',   // Test elimination request
          'new_target',    // Test new target assignment
          'game_start',    // Test game start
          'game_end',      // Test game end
          'avatar',        // Test avatar assignment
          'invitation',    // Test game invitation
          'custom',        // Test custom notification
          'bulk'          // Test bulk notification
        ],
        usage: {
          method: 'POST',
          body: {
            testType: 'all | elimination | new_target | game_start | game_end | avatar | invitation | custom | bulk',
            dummyToken: 'optional_custom_dummy_token'
          },
          example: {
            testType: 'all',
            dummyToken: 'dummy_fcm_token_12345'
          }
        }
      })

    } catch (error) {
      console.error('Error getting FCM test info:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}
