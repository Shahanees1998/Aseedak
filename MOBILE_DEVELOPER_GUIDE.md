## Overview
This guide explains how to implement the Aseedak word elimination game in a mobile app using our REST APIs and Pusher for real-time updates.

## Table of Contents
1. [Authentication](#authentication)
2. [Game Flow Overview](#game-flow-overview)
3. [API Endpoints](#api-endpoints)
4. [Real-time Updates with Pusher](#real-time-updates-with-pusher)
5. [Push Notifications (FCM)](#push-notifications-fcm)
6. [Complete Game Implementation](#complete-game-implementation)
7. [Error Handling](#error-handling)
8. [Testing](#testing)

## Authentication

### 1. User Registration
```http
POST /api/mobile/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe", 
  "username": "johnny",
  "email": "john@example.com",
  "password": "password123"
}
```

### 2. User Login
```http
POST /api/mobile/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johnny",
    "role": "USER"
  }
}
```

**Important:** Store the `token` securely and include it in all subsequent API calls:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Game Flow Overview

The game follows this sequence:
1. **Create/Join Room** - Players create or join a game room
2. **Wait for Players** - Room creator waits for enough players to join
3. **Start Game** - Creator starts the game, players get assignments
4. **Play Game** - Players try to eliminate their targets by saying their words
5. **Game End** - Last player standing wins

## API Endpoints

### Room Management

#### Create Game Room
```http
POST /api/mobile/game-rooms/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "My Game Room",
  "maxPlayers": 6
}
```

#### Join Game Room
```http
POST /api/mobile/game-rooms/{roomCode}/join
Authorization: Bearer {token}
Content-Type: application/json

{}
```

#### Get Room Status
```http
GET /api/mobile/game-rooms/{roomCode}/status
Authorization: Bearer {token}
```

#### Start Game (Room Creator Only)
```http
POST /api/mobile/game-rooms/{roomCode}/start
Authorization: Bearer {token}
```

### Game Play

#### Get Player Assignments
```http
GET /api/mobile/game-rooms/{roomCode}/assignments
Authorization: Bearer {token}
```

**Response:**
```json
{
  "assignments": {
    "player": {
      "id": "player_id",
      "username": "johnny",
      "avatar": "IMAGE1",
      "status": "ALIVE",
      "position": 1
    },
    "target": {
      "id": "target_player_id", 
      "username": "jane",
      "avatar": "IMAGE2"
    },
    "myWords": {
      "word1": "apple",
      "word2": "banana", 
      "word3": "cherry"
    },
    "character": {
      "id": "char_id",
      "name": "Warrior",
      "description": "A brave warrior",
      "imageUrl": "https://..."
    },
    "gameStatus": "IN_PROGRESS",
    "currentRound": 1
  }
}
```

#### Claim Word (Eliminate Target)
```http
POST /api/mobile/game-rooms/{roomCode}/claim-word
Authorization: Bearer {token}
Content-Type: application/json

{
  "word": "apple"
}
```

#### Confirm Word Claim
```http
POST /api/mobile/game-rooms/{roomCode}/confirm-word-claim
Authorization: Bearer {token}
Content-Type: application/json

{
  "claimId": "claim_id",
  "confirmed": true
}
```

#### Leave Room
```http
POST /api/mobile/game-rooms/{roomCode}/leave
Authorization: Bearer {token}
```

#### Get Game Results
```http
GET /api/mobile/game-rooms/{roomCode}/results
Authorization: Bearer {token}
```

## Real-time Updates with Pusher

### Setup Pusher Client

**React Native:**
```bash
npm install pusher-js
```

**iOS (Swift):**
```swift
import PusherSwift
```

**Android (Kotlin):**
```kotlin
implementation 'com.pusher:pusher-java-client:2.4.2'
```

### Pusher Configuration

```javascript
// React Native
import Pusher from 'pusher-js/react-native';

const pusher = new Pusher('YOUR_PUSHER_KEY', {
  cluster: 'YOUR_CLUSTER',
  authEndpoint: 'https://your-domain.com/api/pusher/auth',
  auth: {
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  }
});
```

### Pusher Channels and Events

#### Room Channel
**Channel:** `room-{roomCode}` (e.g., `room-ABC123`)

**Events:**
- `player-joined` - New player joins the room
- `player-left` - Player leaves the room  
- `game-started` - Game begins, players get assignments
- `game-ended` - Game finishes with winner
- `elimination-request` - Someone claims to have said your words
- `elimination-confirmed` - Elimination is confirmed/rejected
- `new-target-assigned` - You get a new target after elimination

#### Example Event Handling

```javascript
// Subscribe to room channel
const channel = pusher.subscribe(`room-${roomCode}`);

// Handle player joined
channel.bind('player-joined', (data) => {
  console.log('Player joined:', data.player.username);
  // Update room UI with new player
});

// Handle game started
channel.bind('game-started', (data) => {
  console.log('Game started!');
  // Navigate to game screen
  // Fetch player assignments
});

// Handle elimination request
channel.bind('elimination-request', (data) => {
  console.log('Someone claims they said your words:', data.words);
  // Show confirmation dialog
});

// Handle new target assignment
channel.bind('new-target-assigned', (data) => {
  console.log('New target:', data.targetUsername);
  console.log('New words:', data.words);
  // Update game UI
});
```

## Push Notifications (FCM)

### Register Device Token

```http
POST /api/notifications/device-token
Authorization: Bearer {token}
Content-Type: application/json

{
  "deviceToken": "fcm_device_token_here",
  "platform": "ios" // or "android"
}
```

### Notification Types

The app sends these push notifications:

1. **Game Invitation** - Someone invites you to a game
2. **Game Started** - Game you're in has begun
3. **Elimination Request** - Someone claims they said your words
4. **New Target** - You get a new target after elimination
5. **Game Ended** - Game finishes

### Handle Push Notifications

```javascript
// React Native
import messaging from '@react-native-firebase/messaging';

messaging().onMessage(async remoteMessage => {
  console.log('FCM Message received:', remoteMessage);
  
  const { type, roomCode, words, killerUsername } = remoteMessage.data;
  
  switch(type) {
    case 'elimination_request':
      // Show elimination confirmation dialog
      showEliminationDialog(killerUsername, words.split(','));
      break;
    case 'game_start':
      // Navigate to game screen
      navigateToGame(roomCode);
      break;
    case 'new_target':
      // Update target and words
      updateTarget(words.split(','));
      break;
  }
});
```

## Complete Game Implementation

### 1. Authentication Flow

```javascript
class AuthService {
  async login(email, password) {
    const response = await fetch('/api/mobile/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (data.token) {
      await SecureStore.setItemAsync('userToken', data.token);
      return data;
    }
    throw new Error(data.message);
  }
  
  async getStoredToken() {
    return await SecureStore.getItemAsync('userToken');
  }
}
```

### 2. Room Management

```javascript
class GameRoomService {
  constructor(token) {
    this.token = token;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  
  async createRoom(name, maxPlayers = 6) {
    const response = await fetch('/api/mobile/game-rooms/create', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ name, maxPlayers })
    });
    return response.json();
  }
  
  async joinRoom(roomCode) {
    const response = await fetch(`/api/mobile/game-rooms/${roomCode}/join`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({})
    });
    return response.json();
  }
  
  async getRoomStatus(roomCode) {
    const response = await fetch(`/api/mobile/game-rooms/${roomCode}/status`, {
      headers: this.headers
    });
    return response.json();
  }
  
  async startGame(roomCode) {
    const response = await fetch(`/api/mobile/game-rooms/${roomCode}/start`, {
      method: 'POST',
      headers: this.headers
    });
    return response.json();
  }
}
```

### 3. Game Play

```javascript
class GameService {
  constructor(token) {
    this.token = token;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  
  async getAssignments(roomCode) {
    const response = await fetch(`/api/mobile/game-rooms/${roomCode}/assignments`, {
      headers: this.headers
    });
    return response.json();
  }
  
  async claimWord(roomCode, word) {
    const response = await fetch(`/api/mobile/game-rooms/${roomCode}/claim-word`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ word })
    });
    return response.json();
  }
  
  async confirmClaim(roomCode, claimId, confirmed) {
    const response = await fetch(`/api/mobile/game-rooms/${roomCode}/confirm-word-claim`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ claimId, confirmed })
    });
    return response.json();
  }
}
```

### 4. Real-time Updates

```javascript
class PusherService {
  constructor(token) {
    this.pusher = new Pusher('YOUR_PUSHER_KEY', {
      cluster: 'YOUR_CLUSTER',
      authEndpoint: 'https://your-domain.com/api/pusher/auth',
      auth: {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    });
  }
  
  subscribeToRoom(roomCode, callbacks) {
    const channel = this.pusher.subscribe(`room-${roomCode}`);
    
    channel.bind('player-joined', callbacks.onPlayerJoined);
    channel.bind('player-left', callbacks.onPlayerLeft);
    channel.bind('game-started', callbacks.onGameStarted);
    channel.bind('game-ended', callbacks.onGameEnded);
    channel.bind('elimination-request', callbacks.onEliminationRequest);
    channel.bind('elimination-confirmed', callbacks.onEliminationConfirmed);
    channel.bind('new-target-assigned', callbacks.onNewTargetAssigned);
    
    return channel;
  }
  
  unsubscribeFromRoom(roomCode) {
    this.pusher.unsubscribe(`room-${roomCode}`);
  }
}
```

### 5. Complete Game Screen Implementation

```javascript
class GameScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      roomCode: props.route.params.roomCode,
      assignments: null,
      gameStatus: 'WAITING',
      players: [],
      pusherChannel: null
    };
  }
  
  async componentDidMount() {
    const token = await AuthService.getStoredToken();
    this.gameService = new GameService(token);
    this.pusherService = new PusherService(token);
    
    // Subscribe to real-time updates
    this.state.pusherChannel = this.pusherService.subscribeToRoom(this.state.roomCode, {
      onPlayerJoined: this.handlePlayerJoined,
      onGameStarted: this.handleGameStarted,
      onEliminationRequest: this.handleEliminationRequest,
      onNewTargetAssigned: this.handleNewTargetAssigned
    });
    
    // Load initial game state
    await this.loadGameState();
  }
  
  async loadGameState() {
    try {
      const assignments = await this.gameService.getAssignments(this.state.roomCode);
      this.setState({ assignments });
    } catch (error) {
      console.error('Failed to load game state:', error);
    }
  }
  
  handleGameStarted = async (data) => {
    console.log('Game started!');
    await this.loadGameState(); // Refresh assignments
    // Navigate to game play screen
  };
  
  handleEliminationRequest = (data) => {
    // Show confirmation dialog
    Alert.alert(
      'Elimination Request',
      `${data.killerUsername} claims they said your words: ${data.words.join(', ')}`,
      [
        { text: 'Reject', onPress: () => this.confirmElimination(data.claimId, false) },
        { text: 'Confirm', onPress: () => this.confirmElimination(data.claimId, true) }
      ]
    );
  };
  
  async confirmElimination(claimId, confirmed) {
    try {
      await this.gameService.confirmClaim(this.state.roomCode, claimId, confirmed);
    } catch (error) {
      console.error('Failed to confirm elimination:', error);
    }
  }
  
  async claimWord(word) {
    try {
      const result = await this.gameService.claimWord(this.state.roomCode, word);
      if (result.success) {
        // Show success message
        Alert.alert('Word Claimed', 'Waiting for target confirmation...');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }
  
  componentWillUnmount() {
    if (this.state.pusherChannel) {
      this.pusherService.unsubscribeFromRoom(this.state.roomCode);
    }
  }
}
```

## Error Handling

### Common Error Responses

```javascript
// Handle API errors
const handleApiError = (error) => {
  if (error.status === 401) {
    // Token expired, redirect to login
    navigateToLogin();
  } else if (error.status === 403) {
    // Not authorized for this action
    showError('You are not authorized to perform this action');
  } else if (error.status === 404) {
    // Resource not found
    showError('Room not found');
  } else {
    // Generic error
    showError(error.message || 'Something went wrong');
  }
};
```

### Network Error Handling

```javascript
const apiCall = async (url, options) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw { status: response.status, ...errorData };
    }
    
    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError') {
      // Network error
      throw { message: 'Network error. Please check your connection.' };
    }
    throw error;
  }
};
```

## Testing

### Test Game Flow

1. **Create Test Users**
   ```bash
   # Use Postman collection to register multiple test users
   ```

2. **Test Room Creation**
   ```bash
   # Create room with user 1
   # Join room with user 2, 3, 4
   ```

3. **Test Game Start**
   ```bash
   # Start game with user 1 (creator)
   # Check assignments for all users
   ```

4. **Test Game Play**
   ```bash
   # User 2 claims word against user 3
   # User 3 confirms/rejects
   # Check game state updates
   ```

### Debugging Tips

1. **Check Pusher Connection**
   ```javascript
   pusher.connection.bind('connected', () => {
     console.log('Pusher connected');
   });
   
   pusher.connection.bind('error', (error) => {
     console.error('Pusher error:', error);
   });
   ```

2. **Log All API Calls**
   ```javascript
   const logApiCall = (url, options, response) => {
     console.log('API Call:', { url, options, response });
   };
   ```

3. **Test Push Notifications**
   ```bash
   # Use the test endpoint in Postman collection
   POST /api/notifications/test
   ```

## Security Considerations

1. **Token Storage** - Store JWT tokens securely (iOS Keychain, Android Keystore)
2. **Token Refresh** - Implement token refresh logic
3. **Input Validation** - Validate all user inputs
4. **Network Security** - Use HTTPS in production
5. **Pusher Auth** - Ensure Pusher authentication endpoint is secure

## Performance Optimization

1. **Connection Management** - Reuse Pusher connections
2. **API Caching** - Cache room status and player data
3. **Background Sync** - Handle app backgrounding gracefully
4. **Memory Management** - Clean up Pusher subscriptions

## Support

For technical support or questions about the API:
- Check the Postman collection for all available endpoints
- Review the API documentation
- Contact the backend team for clarification

---

This guide provides everything needed to implement the Aseedak word elimination game in a mobile app. The combination of REST APIs for game state management and Pusher for real-time updates creates a smooth multiplayer gaming experience.
