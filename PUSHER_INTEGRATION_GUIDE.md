# Pusher Real-Time Integration Guide

**Last Updated:** October 1, 2025  
**Version:** 2.0

This guide provides complete documentation for integrating Pusher real-time events in your mobile application for the Aseedak game.

---

## Table of Contents

1. [Overview](#overview)
2. [Setup & Configuration](#setup--configuration)
3. [Authentication](#authentication)
4. [Channel Types](#channel-types)
5. [Event Reference](#event-reference)
6. [Game Flow Examples](#game-flow-examples)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)
9. [Testing](#testing)

---

## Overview

### What is Pusher?

Pusher is a real-time messaging service that enables instant communication between the server and mobile clients. In Aseedak, Pusher broadcasts game events (player joins, eliminations, game state changes) to all connected players in real-time.

### Why Use Pusher?

- ✅ **Instant Updates**: No polling required - updates are pushed instantly
- ✅ **Automatic Synchronization**: All players see game state changes immediately
- ✅ **Efficient**: Uses WebSocket connections for low latency
- ✅ **Reliable**: Built-in reconnection and error handling

### Key Concepts

- **Channel**: A communication pipe (e.g., `room-A1B2C3D4` for a specific game room)
- **Event**: A message type (e.g., `player-joined`, `elimination`)
- **Subscription**: Listening to a specific channel
- **Trigger**: Server sending an event to a channel

---

## Setup & Configuration

### 1. Required Environment Variables

```bash
# Server-side (.env)
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster  # e.g., "us2", "eu", "ap1"

# Client-side (mobile app config)
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

### 2. Flutter SDK Installation

#### Add Dependencies
```yaml
# pubspec.yaml
dependencies:
  pusher_channels_flutter: ^2.0.0
  http: ^1.1.0
  shared_preferences: ^2.2.2
```

#### Install Dependencies
```bash
flutter pub get
```

---

## Authentication

### Authentication Flow

Pusher requires authentication to ensure only authorized users can subscribe to channels.

### 1. Get JWT Token

First, authenticate with the Aseedak API and obtain a JWT token:

```http
POST /api/mobile/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### 2. Initialize Pusher with Auth in Flutter

#### Flutter Implementation
```dart
import 'package:pusher_channels_flutter/pusher_channels_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PusherService {
  static final PusherService _instance = PusherService._internal();
  factory PusherService() => _instance;
  PusherService._internal();

  PusherChannelsFlutter? pusher;
  String? jwtToken;

  Future<void> initializePusher() async {
    // Get JWT token from storage
    final prefs = await SharedPreferences.getInstance();
    jwtToken = prefs.getString('jwt_token');

    if (jwtToken == null) {
      throw Exception('JWT token not found. Please login first.');
    }

    try {
      await PusherChannelsFlutter.init(
        apiKey: "YOUR_PUSHER_KEY",
        cluster: "YOUR_CLUSTER",
        authEndpoint: "https://your-api.com/api/pusher/auth",
        auth: PusherAuth(
          headers: {
            'Authorization': 'Bearer $jwtToken',
          },
        ),
      );

      pusher = PusherChannelsFlutter.getInstance();
      
      // Set up connection event listeners
      pusher!.onConnectionStateChange((String currentState, String previousState) {
        print('Pusher connection state changed: $previousState -> $currentState');
        if (currentState == 'connected') {
          print('✅ Connected to Pusher');
        } else if (currentState == 'disconnected') {
          print('⚠️ Disconnected from Pusher');
        }
      });

      // Connect to Pusher
      await pusher!.connect();
    } catch (e) {
      print('❌ Failed to initialize Pusher: $e');
      rethrow;
    }
  }

  Future<void> disconnect() async {
    if (pusher != null) {
      await pusher!.disconnect();
    }
  }
}
```

---

## Channel Types

### 1. Room Channels

**Format:** `room-{ROOM_CODE}`

**Purpose:** Broadcasts events to all players in a specific game room.

**Example:** `room-A1B2C3D4`

**Events:**
- `player-joined`
- `player-left`
- `game-started`
- `elimination`
- `elimination-confirmed`
- `game-ended`
- `targets-reassigned`
- `kill-request`
- `kill-rejected`
- `word-claim`
- `word-claim-rejected`
- `word-guess`

### 2. User Channels

**Format:** `user-{USER_ID}`

**Purpose:** Sends private events to a specific user.

**Example:** `user-507f1f77bcf86cd799439011`

**Events:**
- `elimination-request`

---

## Event Reference

### 1. `player-joined`

**Triggered when:** A player joins a game room

**Channel:** `room-{code}`

**Payload:**
```json
{
  "room": {
    "id": "room_id",
    "code": "A1B2C3D4",
    "name": "My Game Room",
    "status": "WAITING",
    "maxPlayers": 8,
    "players": [
      {
        "id": "player_id",
        "userId": "user_id",
        "joinStatus": "JOINED",
        "status": "ALIVE",
        "user": {
          "id": "user_id",
          "username": "john_doe",
          "avatar": "IMAGE5"
        }
      }
    ]
  },
  "player": {
    "id": "user_id",
    "username": "john_doe",
    "avatar": "IMAGE5"
  }
}
```

**Flutter Implementation:**
```dart
// Flutter
class GameRoomService {
  PusherChannel? roomChannel;
  String? currentUserId;

  Future<void> subscribeToRoom(String roomCode) async {
    final pusher = PusherService().pusher;
    if (pusher == null) {
      throw Exception('Pusher not initialized');
    }

    try {
      roomChannel = await pusher.subscribe(channelName: "room-$roomCode");
      
      // Listen for player-joined events
      roomChannel!.bind('player-joined', (event) {
        final data = event?.data;
        if (data != null) {
          final playerData = jsonDecode(data);
          final player = playerData['player'];
          final username = player['username'];
          
          print('Player $username joined!');
          
          // Update UI using setState or state management
          _updatePlayerList(playerData);
          
          // Show notification
          _showNotification('$username joined the room!');
        }
      });
      
    } catch (e) {
      print('❌ Failed to subscribe to room channel: $e');
      rethrow;
    }
  }

  void _updatePlayerList(Map<String, dynamic> playerData) {
    // Update your UI state here
    // This will depend on your state management solution (Provider, Bloc, Riverpod, etc.)
  }

  void _showNotification(String message) {
    // Show notification using fluttertoast, snackbar, or your preferred method
  }
}
```

---

### 2. `player-left`

**Triggered when:** A player leaves a game room

**Channel:** `room-{code}`

**Payload:**
```json
{
  "room": {
    "id": "room_id",
    "code": "A1B2C3D4",
    "players": [ /* updated player list */ ]
  },
  "player": {
    "id": "user_id",
    "username": "john_doe",
    "avatar": "IMAGE5"
  }
}
```

**What to do:**
- Remove player from local player list
- Update UI to show current player count
- Show notification: "{username} left the room"

---

### 3. `game-started`

**Triggered when:** Game creator starts the game

**Channel:** `room-{code}`

**Payload:**
```json
{
  "room": {
    "id": "room_id",
    "code": "A1B2C3D4",
    "status": "IN_PROGRESS",
    "startedAt": "2025-10-01T12:00:00Z",
    "currentRound": 1,
    "players": [
      {
        "id": "player_id",
        "userId": "user_id",
        "status": "ALIVE",
        "position": 1,
        "word1": "apple",
        "word2": "banana",
        "word3": "cherry",
        "targetId": "target_player_id",
        "target": {
          "id": "target_player_id",
          "user": {
            "id": "target_user_id",
            "username": "jane_smith",
            "avatar": "IMAGE2"
          }
        },
        "characterId": "character_id",
        "character": {
          "id": "character_id",
          "name": "Warrior",
          "image": "https://..."
        },
        "kills": 0
      }
    ]
  }
}
```

**What to do:**
1. Navigate to game screen
2. Display assigned character
3. Show your 3 words (word1, word2, word3)
4. Show your target's information
5. Hide words from other players (each player only sees their own words)
6. Start game timer

**Important Notes:**
- Each player has **unique words** to say
- Each player has a **specific target** to eliminate
- Players should only see their own words, not others' words
- Target information is visible to help players strategize

---

### 4. `kill-request`

**Triggered when:** A player requests to kill their target

**Channel:** `room-{code}`

**Payload:**
```json
{
  "killRequest": {
    "id": "kill_request_id",
    "status": "pending",
    "message": "I saw you say the word!",
    "createdAt": "2025-10-01T12:05:00Z"
  },
  "killer": {
    "id": "killer_user_id",
    "username": "player1",
    "avatar": "IMAGE3"
  },
  "target": {
    "id": "target_user_id",
    "username": "player2",
    "avatar": "IMAGE7"
  }
}
```

**What to do:**
- If you are the **target**, show confirmation popup:
  - "Player1 claims you said a forbidden word. Confirm?"
  - [Accept] [Reject] buttons
- If you are **not involved**, show notification in activity feed

---

### 5. `word-claim`

**Triggered when:** A player claims their target said a forbidden word

**Channel:** `room-{code}`

**Payload:**
```json
{
  "wordClaim": {
    "id": "word_claim_id",
    "status": "pending",
    "message": "apple",  // The claimed word
    "createdAt": "2025-10-01T12:10:00Z"
  },
  "killer": {
    "id": "killer_user_id",
    "username": "player1",
    "avatar": "IMAGE3"
  },
  "target": {
    "id": "target_user_id",
    "username": "player2",
    "avatar": "IMAGE7"
  },
  "word": "apple"
}
```

**What to do:**
- If you are the **target**, show confirmation popup:
  - "Player1 claims you said 'apple'. Did you?"
  - [Yes, I said it] [No, I didn't] buttons
- If you are **not involved**, show notification

---

### 6. `elimination`

**Triggered when:** A player is eliminated (after confirmation)

**Channel:** `room-{code}`

**Payload:**
```json
{
  "room": {
    "id": "room_id",
    "code": "A1B2C3D4",
    "status": "IN_PROGRESS",
    "players": [
      {
        "id": "player_id",
        "status": "ELIMINATED",  // or "ALIVE"
        "eliminatedAt": "2025-10-01T12:15:00Z",
        "word1": "dog",         // Killer inherits these words
        "word2": "cat",
        "word3": "bird",
        "targetId": "new_target_id",  // Killer's new target
        "target": {
          "id": "new_target_id",
          "user": {
            "username": "player3"
          }
        }
      }
    ]
  },
  "eliminatedPlayer": {
    "id": "eliminated_user_id",
    "username": "player2",
    "avatar": "IMAGE7"
  },
  "killerPlayer": {
    "id": "killer_user_id",
    "username": "player1",
    "avatar": "IMAGE3"
  },
  "log": {
    "id": "log_id",
    "type": "elimination",
    "message": "player2 was eliminated by player1!"
  }
}
```

**What to do:**
1. Update player statuses (mark eliminated player as ELIMINATED)
2. **If you are the killer:**
   - Show success animation
   - Display your new target
   - **Update your words to the eliminated player's words**
   - Show notification: "You eliminated {username}! New target: {new_target}"
   - Increment your kill count
3. **If you were eliminated:**
   - Show "You were eliminated!" screen
   - Switch to spectator mode
   - Can still see game progress
4. **If you are another player:**
   - Update player list
   - Show notification in activity feed
5. Add log entry to game activity feed

**Critical Implementation Note:**
When a player is eliminated, the killer automatically receives:
- ✅ The eliminated player's **target** (who to hunt next)
- ✅ The eliminated player's **words** (word1, word2, word3)

This is handled automatically by the server. Your mobile app should:
```swift
// iOS Example
if killerUserId == currentUserId {
    // Update local state with new words and target
    currentPlayer.word1 = updatedPlayer.word1
    currentPlayer.word2 = updatedPlayer.word2
    currentPlayer.word3 = updatedPlayer.word3
    currentPlayer.targetId = updatedPlayer.targetId
    currentPlayer.target = updatedPlayer.target
    
    // Update UI
    updateWordsDisplay()
    updateTargetDisplay()
}
```

---

### 7. `elimination-confirmed`

**Triggered when:** Target confirms/denies an elimination request

**Channel:** `room-{code}`

**Payload:**
```json
{
  "room": { /* updated room with player states */ },
  "message": "player2 has been eliminated by player1!",
  "elimination": {
    "killer": {
      "id": "killer_user_id",
      "username": "player1"
    },
    "target": {
      "id": "target_user_id",
      "username": "player2"
    },
    "confirmed": true  // or false if denied
  }
}
```

**What to do:**
- If `confirmed: true` - treat as elimination (same as `elimination` event)
- If `confirmed: false` - show "{target} denied the elimination"

---

### 8. `kill-rejected`

**Triggered when:** Target rejects a kill request

**Channel:** `room-{code}`

**Payload:**
```json
{
  "killRequest": {
    "id": "kill_request_id",
    "status": "rejected"
  },
  "killer": {
    "id": "killer_user_id",
    "username": "player1"
  },
  "target": {
    "id": "target_user_id",
    "username": "player2"
  }
}
```

**What to do:**
- If you are the **killer**, show: "Your kill request was rejected"
- Add to activity feed: "player2 rejected player1's kill request"

---

### 9. `word-claim-rejected`

**Triggered when:** Target denies saying a forbidden word

**Channel:** `room-{code}`

**Payload:**
```json
{
  "wordClaim": {
    "id": "word_claim_id",
    "status": "rejected"
  },
  "killer": {
    "id": "killer_user_id",
    "username": "player1"
  },
  "target": {
    "id": "target_user_id",
    "username": "player2"
  },
  "word": "apple"
}
```

**What to do:**
- If you are the **killer**, show: "player2 denied saying 'apple'"
- Add to activity feed

---

### 10. `word-guess`

**Triggered when:** A player guesses their target's forbidden word

**Channel:** `room-{code}`

**Payload:**
```json
{
  "guessLog": {
    "id": "guess_log_id",
    "type": "word_guess",
    "data": {
      "word": "apple"
    }
  },
  "guesser": {
    "id": "guesser_user_id",
    "username": "player1"
  },
  "target": {
    "id": "target_user_id",
    "username": "player2"
  },
  "word": "apple"
}
```

**What to do:**
- If you are the **target**, show confirmation popup:
  - "player1 guessed your word is 'apple'. Is it correct?"
  - [Yes] [No] buttons
- If you are **not involved**, show in activity feed

---

### 11. `game-ended`

**Triggered when:** Only one player remains alive

**Channel:** `room-{code}`

**Payload:**
```json
{
  "room": {
    "id": "room_id",
    "code": "A1B2C3D4",
    "status": "FINISHED",
    "finishedAt": "2025-10-01T12:30:00Z",
    "players": [ /* all players with final stats */ ]
  },
  "winner": {
    "id": "winner_user_id",
    "username": "champion_player",
    "avatar": "IMAGE1"
  },
  "message": "Game over!"
}
```

**What to do:**
1. Show game over screen
2. Display winner with celebration animation
3. Show final leaderboard:
   - Winner (status: WINNER)
   - All other players with their kill counts
4. Show "Back to Lobby" or "Play Again" buttons
5. Disconnect from Pusher channels
6. Update user statistics locally

---

### 12. `targets-reassigned`

**Triggered when:** Game creator manually reassigns targets and words

**Channel:** `room-{code}`

**Payload:**
```json
{
  "room": {
    "id": "room_id",
    "code": "A1B2C3D4",
    "players": [
      {
        "id": "player_id",
        "word1": "new_word1",  // New words
        "word2": "new_word2",
        "word3": "new_word3",
        "targetId": "new_target_id",  // New target
        "target": { /* new target info */ }
      }
    ]
  },
  "message": "New targets and words have been assigned!"
}
```

**What to do:**
1. Show alert: "New targets and words assigned!"
2. Update your displayed words
3. Update your target information
4. Refresh game screen

---

### 13. `elimination-request` (User Channel)

**Triggered when:** Someone requests to eliminate you

**Channel:** `user-{userId}` (private to the target)

**Payload:**
```json
{
  "elimination": {
    "id": "elimination_id",
    "status": "pending",
    "killer": {
      "id": "killer_id",
      "user": {
        "username": "player1",
        "avatar": "IMAGE3"
      }
    },
    "target": {
      "id": "your_player_id",
      "user": {
        "username": "you",
        "avatar": "IMAGE5"
      }
    },
    "createdAt": "2025-10-01T12:20:00Z"
  }
}
```

**What to do:**
1. Show modal dialog:
   - Title: "Elimination Request"
   - Message: "player1 claims to have eliminated you. Do you confirm?"
   - [Accept] [Reject] buttons
2. Call confirmation API with user's choice

---

## Game Flow Examples

### Example 1: Complete Game Flow

```
1. Players Join Room
   └─> Mobile: Subscribe to `room-{code}`
   └─> Event: `player-joined` (for each player)
   └─> UI: Update player list

2. Game Starts
   └─> API: POST /api/mobile/game-rooms/{code}/start
   └─> Event: `game-started`
   └─> UI: Navigate to game screen, show words & target

3. Player A Says Forbidden Word
   └─> Player B notices
   └─> API: POST /api/mobile/game-rooms/{code}/claim-word
   └─> Event: `word-claim` (all players notified)
   └─> UI: Show confirmation dialog to Player A

4. Player A Confirms
   └─> API: POST /api/mobile/game-rooms/{code}/confirm-word-claim
   └─> Event: `elimination` (all players notified)
   └─> Server: Automatically transfers target + words to Player B
   └─> UI: 
       - Player A: Show "You were eliminated" screen
       - Player B: Show "You eliminated Player A!" + new target + new words
       - Others: Update player list

5. Game Continues Until Winner
   └─> When only 1 player alive
   └─> Event: `game-ended`
   └─> UI: Show winner screen
```

### Example 2: Kill Request Flow (Flutter)

```dart
// Flutter Example - Complete Kill Request Flow

class GameScreen extends StatefulWidget {
  final String roomCode;
  final String currentUserId;
  
  const GameScreen({
    Key? key,
    required this.roomCode,
    required this.currentUserId,
  }) : super(key: key);

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  PusherChannel? pusherChannel;
  final GameRoomService _gameRoomService = GameRoomService();
  final ApiService _apiService = ApiService();
  
  @override
  void initState() {
    super.initState();
    _setupPusherListeners();
  }

  // Step 1: Send kill request
  Future<void> _requestKill() async {
    try {
      final response = await _apiService.post(
        '/api/mobile/game-rooms/${widget.roomCode}/kill-request',
        data: {'message': 'I saw you!'},
      );
      
      if (response.statusCode == 200) {
        _showSnackBar('Kill request sent!');
      }
    } catch (e) {
      _showSnackBar('Error: $e');
    }
  }
  
  // Step 2: Setup Pusher listeners
  void _setupPusherListeners() {
    pusherChannel?.bind('kill-request', (event) {
      final data = jsonDecode(event?.data ?? '{}');
      final target = data['target'];
      final targetId = target['id'];
      
      if (targetId == widget.currentUserId) {
        // This kill request is for me!
        _showKillRequestDialog(data);
      }
    });

    pusherChannel?.bind('elimination', (event) {
      final data = jsonDecode(event?.data ?? '{}');
      _handleElimination(data);
    });
  }
  
  // Step 3: Show confirmation dialog
  void _showKillRequestDialog(Map<String, dynamic> data) {
    final killer = data['killer'];
    final killerName = killer['username'] ?? 'Unknown';
    final requestId = data['killRequest']['id'];
    
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Kill Request'),
          content: Text('$killerName claims to have killed you. Confirm?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _confirmKill(requestId, true);
              },
              child: const Text('Accept'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _confirmKill(requestId, false);
              },
              child: const Text('Reject'),
            ),
          ],
        );
      },
    );
  }
  
  // Step 4: Send confirmation
  Future<void> _confirmKill(String requestId, bool accepted) async {
    try {
      await _apiService.post(
        '/api/mobile/game-rooms/${widget.roomCode}/confirm-kill',
        data: {
          'killRequestId': requestId,
          'accepted': accepted,
        },
      );
      // Server will trigger 'elimination' or 'kill-rejected' event
    } catch (e) {
      _showSnackBar('Error confirming kill: $e');
    }
  }
  
  // Step 5: Handle elimination event
  void _handleElimination(Map<String, dynamic> data) {
    final room = data['room'];
    final killer = data['killerPlayer'];
    final eliminated = data['eliminatedPlayer'];
    
    final killerId = killer['id'];
    final eliminatedId = eliminated['id'];
    
    if (eliminatedId == widget.currentUserId) {
      // I was eliminated
      _navigateToEliminatedScreen();
    } else if (killerId == widget.currentUserId) {
      // I eliminated someone - get new target and words
      final players = room['players'] as List<dynamic>;
      final myPlayer = players.firstWhere(
        (player) => player['userId'] == widget.currentUserId,
        orElse: () => null,
      );
      
      if (myPlayer != null) {
        // Update my words and target
        setState(() {
          // Update your state variables here
          // currentWords = [
          //   myPlayer['word1'] ?? '',
          //   myPlayer['word2'] ?? '',
          //   myPlayer['word3'] ?? '',
          // ];
          // currentTarget = myPlayer['target'];
        });
        
        // Update UI
        _updateWordsDisplay();
        _updateTargetDisplay();
        _showSuccessAnimation();
      }
    } else {
      // Someone else was eliminated
      _updatePlayerList(room);
    }
    
    // Update activity feed
    final message = '${eliminated['username'] ?? 'Player'} was eliminated by ${killer['username'] ?? 'Player'}!';
    _addToActivityFeed(message);
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  void _navigateToEliminatedScreen() {
    Navigator.pushNamed(context, '/eliminated');
  }

  void _updateWordsDisplay() {
    // Update words UI
  }

  void _updateTargetDisplay() {
    // Update target UI
  }

  void _showSuccessAnimation() {
    // Show success animation
  }

  void _updatePlayerList(Map<String, dynamic> room) {
    // Update player list
  }

  void _addToActivityFeed(String message) {
    // Add to activity feed
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Room ${widget.roomCode}')),
      body: Column(
        children: [
          // Your game UI here
          ElevatedButton(
            onPressed: _requestKill,
            child: const Text('Request Kill'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    pusherChannel?.unbind_all();
    super.dispose();
  }
}
```

### Example 3: Word Claim Flow (Flutter)

```dart
// Flutter Example - Word Claim Flow

class WordClaimScreen extends StatefulWidget {
  final String roomCode;
  final String currentUserId;
  final List<String> myWords;
  final Map<String, dynamic> myTarget;

  const WordClaimScreen({
    Key? key,
    required this.roomCode,
    required this.currentUserId,
    required this.myWords,
    required this.myTarget,
  }) : super(key: key);

  @override
  State<WordClaimScreen> createState() => _WordClaimScreenState();
}

class _WordClaimScreenState extends State<WordClaimScreen> {
  PusherChannel? pusherChannel;
  bool showConfirmDialog = false;
  Map<String, dynamic>? pendingClaim;
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _setupPusherListeners();
  }

  void _setupPusherListeners() {
    final pusher = PusherService().pusher;
    if (pusher == null) return;

    pusherChannel = pusher.subscribe(channelName: 'room-${widget.roomCode}');

    // Listen for word claims
    pusherChannel!.bind('word-claim', (event) {
      final data = jsonDecode(event?.data ?? '{}');
      final target = data['target'];
      
      if (target['id'] == widget.currentUserId) {
        // This claim is for me!
        setState(() {
          pendingClaim = data;
          showConfirmDialog = true;
        });
      }
    });

    // Listen for eliminations
    pusherChannel!.bind('elimination', (event) {
      final data = jsonDecode(event?.data ?? '{}');
      _handleElimination(data);
    });
  }

  // Claim a word
  Future<void> _claimWord(String word) async {
    try {
      final response = await _apiService.post(
        '/api/mobile/game-rooms/${widget.roomCode}/claim-word',
        data: {'word': word},
      );

      if (response.statusCode == 200) {
        _showSnackBar('Word claim sent!');
      }
    } catch (error) {
      _showSnackBar('Error: $error');
    }
  }

  // Confirm word claim
  Future<void> _confirmWordClaim(bool accepted) async {
    if (pendingClaim == null) return;

    try {
      await _apiService.post(
        '/api/mobile/game-rooms/${widget.roomCode}/confirm-word-claim',
        data: {
          'killConfirmationId': pendingClaim!['wordClaim']['id'],
          'accepted': accepted,
        },
      );

      setState(() {
        showConfirmDialog = false;
        pendingClaim = null;
      });
    } catch (error) {
      _showSnackBar('Error: $error');
    }
  }

  // Handle elimination
  void _handleElimination(Map<String, dynamic> data) {
    final room = data['room'];
    final killerPlayer = data['killerPlayer'];
    final eliminatedPlayer = data['eliminatedPlayer'];
    
    if (eliminatedPlayer['id'] == widget.currentUserId) {
      // I was eliminated
      Navigator.pushNamed(context, '/eliminated');
    } else if (killerPlayer['id'] == widget.currentUserId) {
      // I eliminated someone - update my data
      final players = room['players'] as List<dynamic>;
      final myPlayer = players.firstWhere(
        (player) => player['userId'] == widget.currentUserId,
        orElse: () => null,
      );
      
      if (myPlayer != null) {
        setState(() {
          // Update your state with new words and target
          // This would depend on your state management
        });
        
        _showSnackBar(
          'You eliminated ${eliminatedPlayer['username']}!\n'
          'New target: ${myPlayer['target']['user']['username']}'
        );
      }
    }
    
    // Update player list for everyone
    _updatePlayers(room['players']);
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  void _updatePlayers(List<dynamic> players) {
    // Update player list
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Game Room')),
      body: Column(
        children: [
          // Display your words
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Your Forbidden Words:',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                ...widget.myWords.map((word) => Card(
                  child: ListTile(
                    title: Text(word),
                    trailing: IconButton(
                      icon: const Icon(Icons.flag),
                      onPressed: () => _claimWord(word),
                    ),
                  ),
                )),
              ],
            ),
          ),
          
          // Display your target
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Card(
              child: ListTile(
                leading: CircleAvatar(
                  backgroundImage: NetworkImage(
                    widget.myTarget['user']['avatar'] ?? '',
                  ),
                ),
                title: Text('Target: ${widget.myTarget['user']['username']}'),
                subtitle: const Text('Eliminate this player'),
              ),
            ),
          ),
          
          const Spacer(),
          
          // Word Claim Confirmation Dialog
          if (showConfirmDialog && pendingClaim != null)
            _buildWordClaimDialog(),
        ],
      ),
    );
  }

  Widget _buildWordClaimDialog() {
    final killer = pendingClaim!['killer'];
    final killerName = killer['username'] ?? 'Unknown';
    final claimedWord = pendingClaim!['word'] ?? '';

    return Container(
      color: Colors.black54,
      child: Center(
        child: Card(
          margin: const EdgeInsets.all(16),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '$killerName claims you said "$claimedWord"',
                  style: const TextStyle(fontSize: 18),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Did you say this word?',
                  style: TextStyle(fontSize: 16),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    ElevatedButton(
                      onPressed: () => _confirmWordClaim(true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Yes, I said it'),
                    ),
                    ElevatedButton(
                      onPressed: () => _confirmWordClaim(false),
                      child: const Text('No, I didn\'t'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    pusherChannel?.unbind_all();
    super.dispose();
  }
}
```

---

## Error Handling

### Connection Errors

```dart
// Flutter
class PusherConnectionService {
  PusherChannelsFlutter? pusher;
  bool isConnected = false;
  
  Future<void> initializeWithErrorHandling() async {
    try {
      pusher = PusherChannelsFlutter.getInstance();
      
      // Set up connection state listener
      pusher!.onConnectionStateChange((String currentState, String previousState) {
        switch (currentState) {
          case 'connected':
            print('✅ Connected to Pusher');
            isConnected = true;
            _showConnectionStatus('Connected');
            break;
          case 'disconnected':
            print('⚠️ Disconnected from Pusher');
            isConnected = false;
            _showConnectionStatus('Disconnected');
            break;
          case 'failed':
            print('❌ Pusher connection failed');
            isConnected = false;
            _showConnectionStatus('Connection Failed');
            _handleConnectionFailure();
            break;
          case 'connecting':
            print('🔄 Connecting to Pusher...');
            _showConnectionStatus('Connecting...');
            break;
        }
      });

      // Set up error listener
      pusher!.onError((String message, String? code, Exception? e) {
        print('❌ Pusher Error: $message (Code: $code)');
        _handlePusherError(message, code, e);
      });

      await pusher!.connect();
    } catch (e) {
      print('❌ Failed to initialize Pusher: $e');
      _handleInitializationError(e);
    }
  }

  void _showConnectionStatus(String status) {
    // Show connection status in your UI
    // You can use a global state management solution or callback
  }

  void _handleConnectionFailure() {
    // Implement reconnection logic
    Future.delayed(const Duration(seconds: 5), () {
      if (!isConnected) {
        _reconnect();
      }
    });
  }

  void _handlePusherError(String message, String? code, Exception? e) {
    // Handle specific error codes
    switch (code) {
      case '4001':
        print('Authentication failed - check JWT token');
        _handleAuthError();
        break;
      case '4002':
        print('Authorization failed - insufficient permissions');
        break;
      default:
        print('Unknown error: $message');
    }
  }

  void _handleAuthError() {
    // Redirect to login or refresh token
  }

  void _handleInitializationError(dynamic error) {
    // Show error dialog to user
  }

  Future<void> _reconnect() async {
    print('🔄 Attempting to reconnect...');
    await pusher?.connect();
  }
}
```

### Subscription Errors

```dart
// Flutter
class RoomSubscriptionService {
  PusherChannel? roomChannel;
  
  Future<void> subscribeToRoomWithErrorHandling(String roomCode) async {
    try {
      final pusher = PusherService().pusher;
      if (pusher == null) {
        throw Exception('Pusher not initialized');
      }

      roomChannel = await pusher.subscribe(channelName: 'room-$roomCode');
      
      // Listen for subscription success
      roomChannel!.onSubscriptionSucceeded((data) {
        print('✅ Successfully subscribed to room-$roomCode');
        _onSubscriptionSuccess();
      });

      // Listen for subscription errors
      roomChannel!.onSubscriptionError((error) {
        print('❌ Subscription error: $error');
        _handleSubscriptionError(error);
      });

    } catch (e) {
      print('❌ Failed to subscribe to room: $e');
      _handleSubscriptionFailure(e);
    }
  }

  void _onSubscriptionSuccess() {
    // Update UI to show connected state
  }

  void _handleSubscriptionError(String error) {
    // Check if JWT token is valid
    // Retry authentication
    if (error.contains('auth')) {
      _refreshAuthToken();
    }
  }

  void _handleSubscriptionFailure(dynamic error) {
    // Show error to user
  }

  Future<void> _refreshAuthToken() async {
    // Implement token refresh logic
  }
}
```

### Event Parsing Errors

Always validate event data before using it:

```dart
// Flutter
class EventParsingService {
  static Map<String, dynamic>? parseEvent(PusherEvent? event) {
    if (event?.data == null) {
      print('⚠️ Event data is null');
      return null;
    }

    try {
      final data = jsonDecode(event!.data!);
      if (data is Map<String, dynamic>) {
        return data;
      } else {
        print('⚠️ Event data is not a valid JSON object');
        return null;
      }
    } catch (e) {
      print('⚠️ Failed to parse event data: $e');
      print('Raw event data: ${event.data}');
      return null;
    }
  }

  // Safe event binding with error handling
  static void bindEventWithErrorHandling(
    PusherChannel channel,
    String eventName,
    Function(Map<String, dynamic>) onEvent,
  ) {
    channel.bind(eventName, (event) {
      final data = parseEvent(event);
      if (data != null) {
        try {
          onEvent(data);
        } catch (e) {
          print('❌ Error handling event $eventName: $e');
          print('Event data: $data');
        }
      }
    });
  }
}
```

---

## Best Practices

### 1. Subscribe on App Launch / Room Join

```swift
// Subscribe when user enters a room
func enterRoom(code: String) {
    // Subscribe to room channel
    let channel = pusher.subscribe("room-\(code)")
    
    // Also subscribe to user-specific channel
    let userChannel = pusher.subscribe("user-\(currentUserId)")
    
    // Bind all event listeners
    setupEventListeners(channel, userChannel)
}
```

### 2. Unsubscribe When Leaving Room

```swift
func leaveRoom() {
    pusher.unsubscribe("room-\(roomCode)")
    pusher.unsubscribe("user-\(currentUserId)")
    // Or disconnect completely
    pusher.disconnect()
}
```

### 3. Handle Background/Foreground Transitions

```swift
// iOS
NotificationCenter.default.addObserver(
    self,
    selector: #selector(appDidEnterBackground),
    name: UIApplication.didEnterBackgroundNotification,
    object: nil
)

@objc func appDidEnterBackground() {
    // Keep connection alive or disconnect
    // Send local notification if important event occurs
}
```

### 4. Show Connection Status

```swift
// Display connection indicator in UI
func updateConnectionIndicator() {
    if pusher.connection.connectionState == .connected {
        connectionIndicator.backgroundColor = .green
        connectionLabel.text = "Connected"
    } else {
        connectionIndicator.backgroundColor = .red
        connectionLabel.text = "Reconnecting..."
    }
}
```

### 5. Queue Events While Offline

```swift
var eventQueue: [PusherEvent] = []

func handleEvent(_ event: PusherEvent) {
    if pusher.connection.connectionState == .connected {
        processEvent(event)
    } else {
        // Queue for later
        eventQueue.append(event)
    }
}

func onReconnect() {
    // Process queued events
    eventQueue.forEach { processEvent($0) }
    eventQueue.removeAll()
}
```

### 6. Implement Automatic Word Transfer

When receiving an `elimination` event where you are the killer:

```kotlin
// Android Example
fun handleElimination(data: EliminationEvent) {
    if (data.killerPlayer.id == currentUserId) {
        // Find my updated player data
        val myPlayer = data.room.players.find { it.userId == currentUserId }
        
        if (myPlayer != null) {
            // CRITICAL: Update local state with inherited words
            currentWords = listOf(
                myPlayer.word1,
                myPlayer.word2,
                myPlayer.word3
            )
            
            // Update target
            currentTarget = myPlayer.target
            
            // Persist to local storage
            savePlayerState(myPlayer)
            
            // Update UI immediately
            runOnUiThread {
                updateWordsUI()
                updateTargetUI()
                showSuccessNotification()
            }
        }
    }
}
```

### 7. Validate Inherited Data

```swift
// iOS - Validate words and target after elimination
func validateInheritedData(_ player: Player) {
    // Check all words are present
    guard let word1 = player.word1, !word1.isEmpty,
          let word2 = player.word2, !word2.isEmpty,
          let word3 = player.word3, !word3.isEmpty else {
        print("⚠️ Missing words after inheritance!")
        // Refetch player data from API
        refetchPlayerAssignments()
        return
    }
    
    // Check target is valid
    guard let target = player.target, target.id != player.id else {
        print("⚠️ Invalid target after inheritance!")
        refetchPlayerAssignments()
        return
    }
    
    print("✅ Inherited data validated successfully")
}
```

---

## Testing

### Test Pusher Connection

```bash
# Test endpoint
curl -X POST https://your-api.com/api/test-pusher \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Pusher!"}'
```

### Mobile Testing Checklist

- [ ] Connect to Pusher successfully
- [ ] Subscribe to room channel
- [ ] Subscribe to user channel
- [ ] Receive `player-joined` event
- [ ] Receive `player-left` event
- [ ] Receive `game-started` event with assignments
- [ ] Send and receive `word-claim`
- [ ] Confirm/deny word claim
- [ ] Receive `elimination` event
- [ ] Verify word and target inheritance on elimination
- [ ] Receive `game-ended` event
- [ ] Handle reconnection after disconnect
- [ ] Handle app backgrounding/foregrounding
- [ ] Test with 2+ devices simultaneously

### Debug Mode

Enable Pusher debug logging:

```swift
// iOS
Pusher.logLevel = .debug
```

```kotlin
// Android
PusherOptions options = new PusherOptions();
options.setCluster("YOUR_CLUSTER");
pusher.setPusherOptions(options);
pusher.setLevel(Level.FINEST); // Enable detailed logging
```

```javascript
// React Native
Pusher.logToConsole = true;
```

---

## Summary

### Quick Reference

| Event | Channel | When | Action Required |
|-------|---------|------|-----------------|
| `player-joined` | room | Player joins | Update player list |
| `player-left` | room | Player leaves | Update player list |
| `game-started` | room | Game starts | Navigate to game, show assignments |
| `kill-request` | room | Kill requested | Show confirmation (if target) |
| `word-claim` | room | Word claimed | Show confirmation (if target) |
| `word-guess` | room | Word guessed | Show confirmation (if target) |
| `elimination` | room | Player eliminated | Update UI, inherit words/target (if killer) |
| `elimination-confirmed` | room | Elimination confirmed | Same as elimination |
| `kill-rejected` | room | Kill denied | Show rejection message |
| `word-claim-rejected` | room | Word claim denied | Show rejection message |
| `game-ended` | room | Game over | Show winner screen |
| `targets-reassigned` | room | Manual reassign | Update assignments |
| `elimination-request` | user | Direct elimination | Show confirmation dialog |

### Important Notes

1. **Word Inheritance**: When a player eliminates their target, they automatically receive the target's words. This happens server-side - your app just needs to update the UI from the `elimination` event data.

2. **Target Chain**: The game maintains a circular chain of targets. When someone is eliminated, their target becomes the killer's new target.

3. **Real-time Sync**: All game state changes are broadcast in real-time. No polling needed!

4. **Authentication**: Always include the JWT token in Pusher auth headers.

5. **Error Handling**: Implement reconnection logic and event queuing for offline scenarios.

---

## Support

For issues or questions:
- Check Pusher Dashboard: https://dashboard.pusher.com
- Review server logs for trigger confirmations
- Enable debug logging in mobile app
- Test with `/api/test-pusher` endpoint

---

**End of Pusher Integration Guide**

