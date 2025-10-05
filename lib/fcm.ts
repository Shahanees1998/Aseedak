import admin from 'firebase-admin'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App | null = null

export function initializeFirebase() {
  if (firebaseApp) {
    return firebaseApp
  }

  try {
    // Check if Firebase is configured
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.warn('⚠️ Firebase not configured - FCM notifications disabled')
      return null
    }

    // Parse the private key (replace \n with actual newlines)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    })

    console.log('✅ Firebase Admin SDK initialized successfully')
    return firebaseApp
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error)
    return null
  }
}

export interface NotificationPayload {
  title: string
  body: string
  data?: Record<string, string>
  imageUrl?: string
}

export interface NotificationOptions {
  userId?: string
  userRole?: 'ADMIN' | 'USER'
  tokens?: string[]
  roomId?: string
  gameId?: string
  storeInDatabase?: boolean // Whether to store notification in database
}

/**
 * Send push notification to specific user(s)
 */
export async function sendPushNotification(
  payload: NotificationPayload,
  options: NotificationOptions
): Promise<{ success: boolean; message: string; failedTokens?: string[] }> {
  try {
    const app = initializeFirebase()
    if (!app) {
      return { success: false, message: 'Firebase not configured' }
    }

    let tokens: string[] = []

    // Get tokens based on options
    if (options.tokens) {
      tokens = options.tokens
    } else if (options.userId) {
      const user = await prisma.user.findUnique({
        where: { id: options.userId },
        select: { fcmTokens: true, role: true }
      })
      
      if (!user) {
        return { success: false, message: 'User not found' }
      }

      // For admins, only send web notifications (Pusher)
      // For regular users, send FCM notifications
      if (options.userRole === 'ADMIN' || user.role === 'ADMIN') {
        return { success: true, message: 'Admin notifications sent via web (Pusher)' }
      }

      tokens = user.fcmTokens
    }

    if (tokens.length === 0) {
      return { success: false, message: 'No FCM tokens found for user' }
    }

    // Prepare the message
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl
      },
      data: {
        ...payload.data,
        timestamp: new Date().toISOString(),
        ...(options.roomId && { roomId: options.roomId }),
        ...(options.gameId && { gameId: options.gameId })
      },
      tokens: tokens,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'game_notifications'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    }

    // Send the notification
    const response = await admin.messaging().sendEachForMulticast(message)
    
    // Store notification in database if requested and user ID is provided
    if (options.storeInDatabase !== false && options.userId && response.successCount > 0) {
      try {
        await prisma.notification.create({
          data: {
            userId: options.userId,
            title: payload.title,
            message: payload.body,
            type: payload.data?.type || 'general',
            data: {
              ...payload.data,
              timestamp: new Date().toISOString(),
              ...(options.roomId && { roomId: options.roomId }),
              ...(options.gameId && { gameId: options.gameId })
            }
          }
        })
        console.log(`✅ Notification stored in database for user ${options.userId}`)
      } catch (dbError) {
        console.error('❌ Failed to store notification in database:', dbError)
        // Don't fail the FCM send if database storage fails
      }
    }
    
    // Handle failed tokens
    const failedTokens: string[] = []
    if (response.failureCount > 0) {
      response.responses.forEach((resp: any, idx: any) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx])
          console.error(`Failed to send notification to token ${tokens[idx]}:`, resp.error)
        }
      })

      // Remove invalid tokens from database
      if (failedTokens.length > 0 && options.userId) {
        await removeInvalidTokens(options.userId, failedTokens)
      }
    }

    return {
      success: response.successCount > 0,
      message: `Sent to ${response.successCount}/${tokens.length} devices`,
      failedTokens: failedTokens.length > 0 ? failedTokens : undefined
    }

  } catch (error) {
    console.error('❌ Error sending push notification:', error)
    return { success: false, message: 'Failed to send notification' }
  }
}

/**
 * Send notification to multiple users
 */
export async function sendBulkPushNotification(
  payload: NotificationPayload,
  userIds: string[]
): Promise<{ success: boolean; message: string; results: any[] }> {
  const results = []
  
  for (const userId of userIds) {
    const result = await sendPushNotification(payload, { userId })
    results.push({ userId, ...result })
  }

  const successCount = results.filter(r => r.success).length
  
  return {
    success: successCount > 0,
    message: `Sent to ${successCount}/${userIds.length} users`,
    results
  }
}

/**
 * Remove invalid FCM tokens from user's token list
 */
async function removeInvalidTokens(userId: string, invalidTokens: string[]): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmTokens: true }
    })

    if (user) {
      const validTokens = user.fcmTokens.filter(token => !invalidTokens.includes(token))
      await prisma.user.update({
        where: { id: userId },
        data: { fcmTokens: validTokens }
      })
      console.log(`🧹 Removed ${invalidTokens.length} invalid FCM tokens for user ${userId}`)
    }
  } catch (error) {
    console.error('❌ Error removing invalid tokens:', error)
  }
}

/**
 * Game-specific notification helpers
 */
export const GameNotifications = {
  /**
   * Notify user about elimination request
   */
  async eliminationRequest(targetUserId: string, killerUsername: string, words: string[], roomCode: string) {
    return sendPushNotification(
      {
        title: '🎯 You are being targeted!',
        body: `${killerUsername} claims they said your words: ${words.join(', ')}`,
        data: {
          type: 'elimination_request',
          killerUsername,
          words: words.join(','),
          roomCode
        }
      },
      { userId: targetUserId, roomId: roomCode, storeInDatabase: true }
    )
  },

  /**
   * Notify user about new target assignment
   */
  async newTargetAssigned(userId: string, targetUsername: string, newWords: string[], roomCode: string) {
    return sendPushNotification(
      {
        title: '🎯 New Target Assigned!',
        body: `Your new target is ${targetUsername}. Your words: ${newWords.join(', ')}`,
        data: {
          type: 'new_target',
          targetUsername,
          words: newWords.join(','),
          roomCode
        }
      },
      { userId, roomId: roomCode, storeInDatabase: true }
    )
  },



  /**
   * Notify user about new avatar assignment
   */
  async newAvatarAssigned(userId: string, avatarName: string) {
    return sendPushNotification(
      {
        title: '🎨 New Avatar Unlocked!',
        body: `You have been assigned a new avatar: ${avatarName}`,
        data: {
          type: 'avatar_assigned',
          avatarName
        }
      },
      { userId, storeInDatabase: true }
    )
  },

  /**
   * Notify user about game invitation
   */
  async gameInvitation(userId: string, inviterUsername: string, roomName: string, roomCode: string) {
    return sendPushNotification(
      {
        title: '🎮 Game Invitation',
        body: `${inviterUsername} invited you to join "${roomName}"`,
        data: {
          type: 'game_invitation',
          inviterUsername,
          roomName,
          roomCode
        }
      },
      { userId, roomId: roomCode, storeInDatabase: true }
    )
  },

  /**
   * Notify admins about new user registration
   */
  async newUserRegistration(adminUserIds: string[], newUserUsername: string, newUserEmail: string) {
    const results = []
    for (const adminId of adminUserIds) {
      const result = await sendPushNotification(
        {
          title: '👤 New User Registered',
          body: `${newUserUsername} (${newUserEmail}) just joined the platform`,
          data: {
            type: 'new_user_registration',
            newUserUsername,
            newUserEmail
          }
        },
        { userId: adminId, userRole: 'ADMIN', storeInDatabase: true }
      )
      results.push({ adminId, ...result })
    }
    return results
  },

  /**
   * Notify admins about new game room creation
   */
  async newGameRoomCreated(adminUserIds: string[], roomName: string, roomCode: string, creatorUsername: string) {
    const results = []
    for (const adminId of adminUserIds) {
      const result = await sendPushNotification(
        {
          title: '🎮 New Game Room Created',
          body: `${creatorUsername} created "${roomName}" (${roomCode})`,
          data: {
            type: 'new_game_room',
            roomName,
            roomCode,
            creatorUsername
          }
        },
        { userId: adminId, userRole: 'ADMIN', roomId: roomCode, storeInDatabase: true }
      )
      results.push({ adminId, ...result })
    }
    return results
  },

  /**
   * Notify user about account status change (suspended/updated)
   */
  async accountStatusChange(userId: string, status: 'suspended' | 'updated', reason?: string) {
    const title = status === 'suspended' ? '⚠️ Account Suspended' : '✅ Account Updated'
    const body = status === 'suspended' 
      ? `Your account has been suspended. ${reason ? `Reason: ${reason}` : ''}`
      : 'Your account information has been updated successfully.'

    return sendPushNotification(
      {
        title,
        body,
        data: {
          type: 'account_status_change',
          status,
          ...(reason && { reason })
        }
      },
      { userId, storeInDatabase: true }
    )
  },

  /**
   * Notify all room members when someone joins
   */
  async playerJoined(roomMemberIds: string[], joinerUsername: string, roomName: string, roomCode: string) {
    const results = []
    for (const memberId of roomMemberIds) {
      const result = await sendPushNotification(
        {
          title: '👋 Player Joined',
          body: `${joinerUsername} joined "${roomName}"`,
          data: {
            type: 'player_joined',
            joinerUsername,
            roomName,
            roomCode
          }
        },
        { userId: memberId, roomId: roomCode, storeInDatabase: true }
      )
      results.push({ memberId, ...result })
    }
    return results
  },

  /**
   * Notify all room members when someone leaves
   */
  async playerLeft(roomMemberIds: string[], leaverUsername: string, roomName: string, roomCode: string) {
    const results = []
    for (const memberId of roomMemberIds) {
      const result = await sendPushNotification(
        {
          title: '👋 Player Left',
          body: `${leaverUsername} left "${roomName}"`,
          data: {
            type: 'player_left',
            leaverUsername,
            roomName,
            roomCode
          }
        },
        { userId: memberId, roomId: roomCode, storeInDatabase: true }
      )
      results.push({ memberId, ...result })
    }
    return results
  },

  /**
   * Notify all joined members when game starts
   */
  async gameStarted(joinedMemberIds: string[], roomName: string, roomCode: string) {
    const results = []
    for (const memberId of joinedMemberIds) {
      const result = await sendPushNotification(
        {
          title: '🚀 Game Started!',
          body: `The game "${roomName}" has begun!`,
          data: {
            type: 'game_started',
            roomName,
            roomCode
          }
        },
        { userId: memberId, roomId: roomCode, storeInDatabase: true }
      )
      results.push({ memberId, ...result })
    }
    return results
  },

  /**
   * Notify all participants when game ends
   */
  async gameEnded(participantIds: string[], roomName: string, roomCode: string) {
    const results = []
    for (const participantId of participantIds) {
      const result = await sendPushNotification(
        {
          title: '🏁 Game Ended',
          body: `The game "${roomName}" has ended`,
          data: {
            type: 'game_ended',
            roomName,
            roomCode
          }
        },
        { userId: participantId, roomId: roomCode, storeInDatabase: true }
      )
      results.push({ participantId, ...result })
    }
    return results
  },

  /**
   * Notify all participants about the winner
   */
  async gameWinner(participantIds: string[], winnerUsername: string, roomName: string, roomCode: string) {
    const results = []
    for (const participantId of participantIds) {
      const result = await sendPushNotification(
        {
          title: '🏆 Winner!',
          body: `${winnerUsername} won the game "${roomName}"!`,
          data: {
            type: 'game_winner',
            winnerUsername,
            roomName,
            roomCode
          }
        },
        { userId: participantId, roomId: roomCode, storeInDatabase: true }
      )
      results.push({ participantId, ...result })
    }
    return results
  }
}

export default { initializeFirebase, sendPushNotification, sendBulkPushNotification, GameNotifications }
