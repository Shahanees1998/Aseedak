# FCM Push Notifications Integration Guide

## Overview

This guide covers the complete Firebase Cloud Messaging (FCM) integration for the Aseedak word elimination game. The system provides real-time push notifications for various game events and user account activities.

## Features Implemented

### 1. Device Token Management
- Register FCM device tokens for users
- Remove device tokens when users log out
- Support for multiple devices per user
- Mobile and web API endpoints

### 2. Notification Settings
- User-configurable notification preferences
- Granular control over different notification types
- Enable/disable FCM notifications globally

### 3. Game Event Notifications
- **Player Join**: Notify room members when someone joins
- **Player Leave**: Notify room members when someone leaves
- **Game Start**: Notify all joined players when game begins
- **Game End**: Notify all participants when game ends
- **Game Winner**: Notify all participants about the winner

### 4. User Account Notifications
- **Account Suspension**: Notify users when account is suspended
- **Account Updates**: Notify users when account information is updated
- **Avatar Assignment**: Notify users when new avatars are assigned

## API Endpoints

### Device Token Management

#### Register Device Token
```http
POST /api/notifications/device-token
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "token": "fcm_device_token_here",
  "platform": "android",
  "appVersion": "1.0.0",
  "deviceModel": "Samsung Galaxy S21",
  "osVersion": "Android 12"
}
```

#### Remove Device Token
```http
DELETE /api/notifications/device-token
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "token": "fcm_device_token_here"
}
```

#### Get Device Tokens
```http
GET /api/notifications/device-token
Authorization: Bearer {jwt_token}
```

### Notification Settings

#### Update Notification Settings
```http
PUT /api/notifications/settings
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "fcmEnabled": true,
  "gameInvitations": true,
  "gameUpdates": true,
  "eliminationAlerts": true,
  "systemNotifications": true
}
```

#### Get Notification Settings
```http
GET /api/notifications/settings
Authorization: Bearer {jwt_token}
```

### Mobile API Endpoints

#### Mobile Register Device Token
```http
POST /api/mobile/notifications/device-token
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "token": "fcm_device_token_here",
  "platform": "android",
  "appVersion": "1.0.0",
  "deviceModel": "Samsung Galaxy S21",
  "osVersion": "Android 12"
}
```

#### Mobile Remove Device Token
```http
DELETE /api/mobile/notifications/device-token
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "token": "fcm_device_token_here"
}
```

## Database Schema Updates

### User Model Updates
```prisma
model User {
  // ... existing fields ...
  
  // FCM Push Notifications
  fcmTokens            String[] @default([]) // Array of FCM device tokens
  fcmEnabled           Boolean  @default(true) // Whether user has notifications enabled
  notificationSettings Json? // User notification preferences
  
  // ... rest of fields ...
}
```

## Environment Variables Required

Add these environment variables to your `.env` file:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

## Notification Types

### Game Event Notifications

1. **Player Joined** (`player_joined`)
   - Triggered when a player joins a game room
   - Sent to all other room members

2. **Player Left** (`player_left`)
   - Triggered when a player leaves a game room
   - Sent to all other room members

3. **Game Started** (`game_started`)
   - Triggered when a game begins
   - Sent to all joined players

4. **Game Ended** (`game_ended`)
   - Triggered when a game ends
   - Sent to all participants

5. **Game Winner** (`game_winner`)
   - Triggered when a winner is determined
   - Sent to all participants

### User Account Notifications

1. **Account Status Change** (`account_status_change`)
   - Triggered when account is suspended or updated
   - Sent to the affected user

2. **Avatar Assignment** (`avatar_assigned`)
   - Triggered when a new avatar is assigned
   - Sent to the user receiving the avatar

## Implementation Details

### FCM Service (`lib/fcm.ts`)

The FCM service provides:
- Firebase Admin SDK initialization
- Push notification sending with error handling
- Automatic token cleanup for invalid tokens
- Game-specific notification helpers

### Game Integration

FCM notifications are integrated into:
- Game room join/leave operations
- Game start/end events
- User elimination confirmations
- Admin user management operations

### Error Handling

- FCM failures are non-critical and don't affect game operations
- Invalid tokens are automatically removed from user records
- Comprehensive logging for debugging

## Testing

### Using Postman Collection

The updated Postman collection includes a new "📱 FCM Push Notifications" folder with all FCM-related endpoints for testing.

### Test Scenarios

1. **Device Token Registration**
   - Register a device token
   - Verify token is stored in user record
   - Test with multiple devices

2. **Game Event Notifications**
   - Join a game room and verify other players receive notifications
   - Start a game and verify all players receive start notifications
   - End a game and verify winner notifications

3. **User Account Notifications**
   - Suspend a user account and verify notification
   - Update user information and verify notification

## Security Considerations

- Device tokens are stored securely in the database
- FCM notifications respect user notification preferences
- Admin operations trigger appropriate user notifications
- Invalid tokens are automatically cleaned up

## Troubleshooting

### Common Issues

1. **Firebase Not Initialized**
   - Check environment variables are set correctly
   - Verify Firebase project configuration

2. **Notifications Not Received**
   - Check user's notification settings
   - Verify device token is registered
   - Check Firebase console for delivery status

3. **Invalid Token Errors**
   - Tokens are automatically cleaned up
   - Users need to re-register tokens after app reinstall

### Logs to Monitor

- FCM notification sending success/failure
- Device token registration/removal
- Invalid token cleanup operations

## Future Enhancements

Potential improvements for the FCM system:

1. **Rich Notifications**
   - Add images and action buttons
   - Custom notification sounds

2. **Scheduled Notifications**
   - Game reminders
   - Tournament announcements

3. **Analytics**
   - Notification delivery rates
   - User engagement metrics

4. **Advanced Settings**
   - Quiet hours configuration
   - Notification frequency limits

## Support

For issues with FCM integration:
1. Check the application logs for FCM-related errors
2. Verify Firebase project configuration
3. Test with the provided Postman collection
4. Review the notification settings in the database

