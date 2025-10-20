import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { GameNotifications, sendPushNotification } from '@/lib/fcm'

const prisma = new PrismaClient()

/**
 * POST /api/test-fcm-simple
 * Simple FCM test without authentication (for testing purposes only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testType = 'all', userId = '507f1f77bcf86cd799439011' } = body // Valid MongoDB ObjectID

    console.log(`🧪 Starting simple FCM test for user ${userId}`)

    // Create a dummy user for testing
    const testToken = 'dummy_fcm_token_for_testing_' + Date.now()
    
    // Add test token to user's tokens (or create user if doesn't exist)
    let user
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmTokens: true }
      })

      if (!user) {
        // Create a test user
        user = await prisma.user.create({
          data: {
            id: userId,
            email: 'test@example.com',
            password: 'test',
            firstName: 'Test',
            lastName: 'User',
            username: 'testuser',
            fcmTokens: [testToken]
          },
          select: { fcmTokens: true }
        })
        console.log(`✅ Test user created: ${userId}`)
      } else {
        // Add test token to existing user
        const existingTokens = user.fcmTokens || []
        const updatedTokens = [...existingTokens, testToken]
        
        await prisma.user.update({
          where: { id: userId },
          data: { fcmTokens: updatedTokens }
        })
        console.log(`✅ Test token added to user ${userId}`)
      }
    } catch (error) {
      console.error('❌ Error setting up test user:', error)
      return NextResponse.json(
        { message: 'Failed to setup test user', error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }

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
          userId,
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
          userId,
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
          [userId],
          testData.roomName,
          testData.roomCode
        )
        const firstResult = result[0] || { success: false, message: 'No results', failedTokens: [] }
        testResults.push({
          type: 'game_start',
          success: firstResult.success,
          message: firstResult.message,
          failedTokens: firstResult.failedTokens
        })
        console.log(`✅ Game start test: ${firstResult.success ? 'SUCCESS' : 'FAILED'}`)
      }

      // Test 4: Game End
      if (testType === 'all' || testType === 'game_end') {
        console.log('🧪 Testing game end notification...')
        const results = await GameNotifications.gameEnded(
          [userId],
          testData.roomName,
          testData.roomCode
        )
        const result = results[0] || { success: false, message: 'No results', failedTokens: [] }
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
          userId,
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
          userId,
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
            userId: userId, 
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

      // Check database storage
      console.log('🧪 Checking database storage...')
      const storedNotifications = await prisma.notification.findMany({
        where: { 
          userId: userId,
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })

      console.log(`✅ Found ${storedNotifications.length} notifications stored in database`)

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
  }
}
