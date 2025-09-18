# 📱 Mobile API & Real-Time Guide

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Game Room Management](#game-room-management)
4. [Word Assignment & Game Start](#word-assignment--game-start)
5. [Real-Time Gameplay with Pusher](#real-time-gameplay-with-pusher)
6. [Game End & Results](#game-end--results)
7. [Pusher Event Reference](#pusher-event-reference)
8. [Mobile Client Integration](#mobile-client-integration)
9. [API Endpoints Summary](#api-endpoints-summary)
10. [Error Handling](#error-handling)

---

## Overview

The Aseedak mobile API provides a complete real-time multiplayer word game experience. Players can create rooms, join games, receive word assignments, claim words from targets, and get instant real-time updates via Pusher.

### Key Features
- ✅ Real-time multiplayer gameplay
- ✅ Automatic word assignment
- ✅ Circular targeting system with reassignment
- ✅ Character assignment
- ✅ Instant notifications via Pusher
- ✅ Game state management
- ✅ JWT authentication

---

## Authentication

### JWT Token Verification
All mobile endpoints require JWT authentication:

```typescript
// Token extraction pattern
async function verifyToken(request: NextRequest) {
  const token = extractTokenFromRequest(request)
  if (!token) return null
  return await verifyJWT(token)
}
```

### Required Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Authentication Endpoints
- `POST /api/mobile/auth/register` - User registration
- `POST /api/mobile/auth/login` - User login
- `POST /api/mobile/auth/verify-email` - Email verification
- `POST /api/mobile/auth/forgot-password` - Password reset
- `POST /api/mobile/auth/reset-password` - Reset password

---

## Game Room Management

### 1. Create Game Room
**Endpoint:** `POST /api/mobile/game-rooms/create`

**Request Body:**
```json
{
  "name": "Mobile Game Room",
  "maxPlayers": 6,
  "difficulty": "medium",
  "category": "all",
  "timeLimit": 300,
  "privateRoom": false,
  "invitedUsers": ["user_id_1", "user_id_2"]
}
```

**Parameters:**
- `name` (string): Room name
- `maxPlayers` (number): 2-6 players
- `difficulty` (enum): "easy", "medium", "hard"
- `category` (string): "all" or specific category
- `timeLimit` (number): 30-300 seconds
- `privateRoom` (boolean): Room visibility
- `invitedUsers` (array): Optional user IDs to invite

**Response:**
```json
{
  "success": true,
  "message": "Room created successfully",
  "room": {
    "id": "room_id",
    "name": "Mobile Game Room",
    "code": "A1B2C3D4",
    "maxPlayers": 6,
    "status": "WAITING",
    "creator": {
      "id": "user_id",
      "username": "john_doe",
      "avatar": "IMAGE1"
    }
  }
}
```

**What Happens:**
- Generates unique 8-character room code
- Selects words based on difficulty/category
- Creates room with `WAITING` status
- Adds creator as first player (`JOINED` status)
- Adds invited users as `INVITED` status
- Sends email/FCM notifications to invited users

---

### 2. Join Game Room
**Endpoint:** `POST /api/mobile/game-rooms/[code]/join`

**Response:**
```json
{
  "message": "Successfully joined room",
  "room": {
    "id": "room_id",
    "name": "Mobile Game Room",
    "code": "A1B2C3D4",
    "status": "WAITING",
    "players": [...]
  }
}
```

**Pusher Event:**
```javascript
// Channel: room-{code}
// Event: player-joined
{
  room: updatedRoom,
  player: newPlayer.user
}
```

---

### 3. Get Room Status
**Endpoint:** `GET /api/mobile/game-rooms/[code]/status`

**Response:**
```json
{
  "room": {
    "id": "room_id",
    "name": "Mobile Game Room",
    "code": "A1B2C3D4",
    "status": "IN_PROGRESS",
    "maxPlayers": 6,
    "currentRound": 1,
    "players": [...]
  },
  "currentPlayer": {
    "id": "player_id",
    "status": "ALIVE",
    "word1": "apple",
    "word2": "banana",
    "word3": "cherry",
    "target": {
      "id": "target_id",
      "user": {
        "username": "jane_smith",
        "avatar": "IMAGE2"
      }
    }
  },
  "gameLogs": [...]
}
```

---

### 4. Get My Rooms
**Endpoint:** `GET /api/mobile/game-rooms/my-rooms`

**Response:**
```json
{
  "rooms": [
    {
      "id": "room_id",
      "name": "Mobile Game Room",
      "code": "A1B2C3D4",
      "status": "IN_PROGRESS",
      "userRole": "CREATOR",
      "userJoinStatus": "JOINED",
      "playerCount": 4,
      "totalPlayers": 6
    }
  ],
  "total": 1
}
```

---

## Word Assignment & Game Start

### 5. Start Game
**Endpoint:** `POST /api/mobile/game-rooms/[code]/start`

**What Happens:**

1. **Word Assignment Algorithm:**
   ```typescript
   // Each player gets unique words
   for (let i = 0; i < players.length; i++) {
     const player = players[i]
     const word = words[i] // Unique word set
     const target = players[(i + 1) % players.length] // Circular targeting
     
     await prisma.gamePlayer.update({
       where: { id: player.id },
       data: {
         word1: word.word1, // Words to speak
         word2: word.word2,
         word3: word.word3,
         targetId: target.id, // Who to speak to
         characterId: character.id // Unique character
       }
     })
   }
   ```

2. **Room Status Update:**
   - Changes status to `IN_PROGRESS`
   - Sets `startedAt` timestamp
   - Increments `currentRound`

3. **Pusher Event:**
   ```javascript
   // Channel: room-{code}
   // Event: game-started
   {
     room: updatedRoom,
     message: "Game started! Check your assignments."
   }
   ```

---

### 6. Get Player Assignments
**Endpoint:** `GET /api/mobile/game-rooms/[code]/assignments`

**Response:**
```json
{
  "assignments": {
    "player": {
      "id": "player_id",
      "username": "john_doe",
      "avatar": "IMAGE1",
      "status": "ALIVE",
      "position": 1
    },
    "target": {
      "id": "target_id",
      "username": "jane_smith",
      "avatar": "IMAGE2"
    },
    "myWords": {
      "word1": "apple",
      "word2": "banana",
      "word3": "cherry"
    },
    "character": {
      "id": "char_id",
      "name": "Detective",
      "description": "A skilled investigator",
      "imageUrl": "https://..."
    },
    "gameStatus": "IN_PROGRESS",
    "currentRound": 1
  }
}
```

---

## Real-Time Gameplay with Pusher

### 7. Claim Word
**Endpoint:** `POST /api/mobile/game-rooms/[code]/claim-word`

**Request Body:**
```json
{
  "claimedWord": "apple"
}
```

**What Happens:**
1. **Validation:**
   - Checks if claimed word matches target's words
   - Verifies player is alive and has target

2. **Creates Kill Confirmation:**
   ```typescript
   const killConfirmation = await prisma.killConfirmation.create({
     data: {
       roomId: room.id,
       killerId: currentPlayer.id,
       targetId: currentPlayer.target.id,
       status: 'pending',
       message: `Claims target said: "${claimedWord}"`
     }
   })
   ```

3. **Pusher Event:**
   ```javascript
   // Channel: room-{code}
   // Event: word-claim
   {
     killConfirmation: {
       id: "confirmation_id",
       killer: { username: "john_doe", avatar: "IMAGE1" },
       target: { username: "jane_smith", avatar: "IMAGE2" },
       message: "Claims target said: 'apple'",
       status: "pending"
     },
     claimedWord: "apple"
   }
   ```

---

### 8. Confirm Word Claim
**Endpoint:** `POST /api/mobile/game-rooms/[code]/confirm-word-claim`

**Request Body:**
```json
{
  "confirmationId": "confirmation_id",
  "accepted": true
}
```

**What Happens When Accepted (Target Eliminated):**

1. **Target Elimination:**
   ```typescript
   await prisma.gamePlayer.update({
     where: { id: target.id },
     data: {
       status: 'ELIMINATED',
       eliminatedAt: new Date()
     }
   })
   ```

2. **Target Reassignment (Key Feature!):**
   ```typescript
   // Transfer target to killer
   await prisma.gamePlayer.update({
     where: { id: killer.id },
     data: {
       targetId: target.targetId, // Killer gets target's old target
       kills: { increment: 1 }
     }
   })
   ```

3. **Pusher Events:**
   ```javascript
   // Channel: room-{code}
   // Event: elimination
   {
     eliminatedPlayer: { username: "jane_smith", avatar: "IMAGE2" },
     killer: { username: "john_doe", avatar: "IMAGE1" },
     message: "jane_smith was eliminated!"
   }
   ```

**What Happens When Rejected:**
```javascript
// Channel: room-{code}
// Event: claim-rejected
{
  killer: { username: "john_doe" },
  target: { username: "jane_smith" },
  message: "Word claim was rejected"
}
```

---

## Game End & Results

### 9. Get Game Results
**Endpoint:** `GET /api/mobile/game-rooms/[code]/results`

**Response:**
```json
{
  "results": {
    "room": {
      "id": "room_id",
      "code": "A1B2C3D4",
      "status": "FINISHED",
      "startedAt": "2025-09-18T04:00:00.000Z",
      "finishedAt": "2025-09-18T04:15:00.000Z"
    },
    "winner": {
      "id": "winner_id",
      "username": "john_doe",
      "avatar": "IMAGE1",
      "kills": 3,
      "position": 1
    },
    "leaderboard": [
      {
        "rank": 1,
        "username": "john_doe",
        "kills": 3,
        "status": "ALIVE"
      }
    ],
    "gameStats": {
      "totalPlayers": 6,
      "alivePlayers": 1,
      "eliminatedPlayers": 5,
      "gameDuration": 900,
      "totalKills": 5
    },
    "userResult": {
      "rank": 1,
      "status": "ALIVE",
      "kills": 3
    }
  }
}
```

---

## Pusher Event Reference

### Channel Structure
```
Channel: room-{ROOM_CODE}
```

### Event Types

#### 1. `player-joined`
**Triggered:** When a new player joins the room
```javascript
{
  room: updatedRoom,
  player: newPlayer.user
}
```

#### 2. `game-started`
**Triggered:** When the game begins
```javascript
{
  room: updatedRoom,
  message: "Game started! Check your assignments."
}
```

#### 3. `word-claim`
**Triggered:** When a player claims their target said a word
```javascript
{
  killConfirmation: {
    id: "confirmation_id",
    killer: { username: "john_doe", avatar: "IMAGE1" },
    target: { username: "jane_smith", avatar: "IMAGE2" },
    message: "Claims target said: 'apple'",
    status: "pending"
  },
  claimedWord: "apple"
}
```

#### 4. `elimination`
**Triggered:** When a target is eliminated
```javascript
{
  eliminatedPlayer: { username: "jane_smith", avatar: "IMAGE2" },
  killer: { username: "john_doe", avatar: "IMAGE1" },
  message: "jane_smith was eliminated!"
}
```

#### 5. `claim-rejected`
**Triggered:** When a word claim is rejected
```javascript
{
  killer: { username: "john_doe" },
  target: { username: "jane_smith" },
  message: "Word claim was rejected"
}
```

#### 6. `game-finished`
**Triggered:** When the game ends
```javascript
{
  winner: { username: "john_doe", kills: 3 },
  message: "Game finished! john_doe wins!"
}
```

---

## Mobile Client Integration

### Pusher Setup
```javascript
import Pusher from 'pusher-js'

// Initialize Pusher
const pusher = new Pusher('your-pusher-key', {
  cluster: 'your-cluster',
  encrypted: true
})

// Subscribe to room channel
const channel = pusher.subscribe(`room-${roomCode}`)

// Listen for events
channel.bind('player-joined', (data) => {
  // Update UI with new player
  updatePlayerList(data.room.players)
})

channel.bind('game-started', (data) => {
  // Navigate to game screen
  navigateToGame(data.room)
})

channel.bind('word-claim', (data) => {
  // Show claim notification to target
  if (data.killConfirmation.target.id === currentPlayerId) {
    showClaimNotification(data.killConfirmation)
  }
})

channel.bind('elimination', (data) => {
  // Update UI - remove eliminated player
  removePlayer(data.eliminatedPlayer.id)
  showEliminationMessage(data.message)
  // Update target assignments
  updateTargetAssignments()
})

channel.bind('claim-rejected', (data) => {
  // Show rejection message
  showRejectionMessage(data.message)
})

channel.bind('game-finished', (data) => {
  // Navigate to results screen
  navigateToResults(data)
})
```

### Game State Management
```javascript
// Game states
const GAME_STATES = {
  WAITING: 'WAITING',
  IN_PROGRESS: 'IN_PROGRESS',
  FINISHED: 'FINISHED'
}

// Player states
const PLAYER_STATES = {
  ALIVE: 'ALIVE',
  ELIMINATED: 'ELIMINATED'
}

// Join status
const JOIN_STATUS = {
  INVITED: 'INVITED',
  JOINED: 'JOINED',
  NOT_JOINED: 'NOT_JOINED'
}
```

---

## API Endpoints Summary

### Authentication
- `POST /api/mobile/auth/register` - User registration
- `POST /api/mobile/auth/login` - User login
- `POST /api/mobile/auth/verify-email` - Email verification
- `POST /api/mobile/auth/forgot-password` - Password reset
- `POST /api/mobile/auth/reset-password` - Reset password

### User Profile
- `GET /api/mobile/user/profile` - Get user profile
- `PUT /api/mobile/user/profile` - Update user profile

### Game Rooms
- `POST /api/mobile/game-rooms/create` - Create room
- `POST /api/mobile/game-rooms/[code]/join` - Join room
- `GET /api/mobile/game-rooms/[code]/status` - Get room status
- `GET /api/mobile/game-rooms/[code]/assignments` - Get assignments
- `POST /api/mobile/game-rooms/[code]/start` - Start game
- `POST /api/mobile/game-rooms/[code]/leave` - Leave room
- `GET /api/mobile/game-rooms/my-rooms` - Get user's rooms

### Gameplay
- `POST /api/mobile/game-rooms/[code]/claim-word` - Claim word
- `POST /api/mobile/game-rooms/[code]/confirm-word-claim` - Confirm claim
- `GET /api/mobile/game-rooms/[code]/results` - Get game results

### Upload
- `POST /api/mobile/upload/profile-image` - Upload profile image
- `DELETE /api/mobile/upload/profile-image` - Delete profile image

---

## Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

#### 400 Bad Request
```json
{
  "message": "Validation error message"
}
```

#### 403 Forbidden
```json
{
  "message": "You are not in this room"
}
```

#### 404 Not Found
```json
{
  "message": "Room not found"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

### Error Handling Best Practices

1. **Always check response status codes**
2. **Handle Pusher connection errors gracefully**
3. **Implement retry logic for failed requests**
4. **Show user-friendly error messages**
5. **Log errors for debugging**

---

## Key Features Explained

### 1. Circular Targeting System
- Players are arranged in a circle
- Each player targets the next player in sequence
- When a player is eliminated, their target becomes the killer's new target

### 2. Word Assignment
- Each player gets 3 unique words to speak
- Words are selected based on difficulty and category
- No two players have the same words

### 3. Character Assignment
- Each player gets a unique character
- Characters provide visual identity and role-playing elements

### 4. Real-Time Updates
- All game actions trigger Pusher events
- Players get instant notifications
- UI updates automatically without polling

### 5. Game State Management
- `WAITING` - Players joining
- `IN_PROGRESS` - Active gameplay
- `FINISHED` - Game completed

---

## Development Notes

### Pusher Configuration
Make sure these environment variables are set:
```
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
```

### Database Schema
The game uses these key tables:
- `GameRoom` - Room information
- `GamePlayer` - Player assignments and status
- `KillConfirmation` - Word claim confirmations
- `GameLog` - Game event logs
- `Word` - Word database
- `Character` - Character database

### Security Considerations
- JWT tokens are required for all endpoints
- Players can only see their own target information
- Word claims are validated against target's actual words
- Room codes are unique and secure

---

This guide provides everything needed to implement the mobile game client with real-time functionality! 🎮✨
