# Aseedak Mobile API Documentation

## Overview
This document provides comprehensive API documentation for the Aseedak mobile app. The API supports both web and mobile clients with JWT-based authentication for mobile apps.

## Base URL
- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

## Authentication

### Mobile Authentication (JWT)
Mobile apps use JWT tokens for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Web Authentication (NextAuth)
Web apps use NextAuth session cookies automatically.

## API Endpoints

### Authentication

#### Register User
```http
POST /api/mobile/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe", 
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "avatar": "IMAGE1"
}
```

**Response:**
```json
{
  "message": "Account created successfully! Please check your email for verification code.",
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "IMAGE1",
    "role": "USER",
    "emailVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Login User
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
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "avatar": "IMAGE1",
    "role": "USER",
    "isActive": true,
    "emailVerified": true,
    "gamesPlayed": 0,
    "gamesWon": 0,
    "totalKills": 0
  }
}
```

#### Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### Resend OTP
```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### Game Rooms

#### Create Room
```http
POST /api/mobile/game-rooms/create
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "My Game Room",
  "maxPlayers": 4,
  "difficulty": "medium",
  "category": "all",
  "timeLimit": 60,
  "privateRoom": false
}
```

**Response:**
```json
{
  "message": "Room created successfully",
  "room": {
    "id": "room_id",
    "name": "My Game Room",
    "code": "ABC123",
    "maxPlayers": 4,
    "status": "WAITING",
    "createdBy": "user_id",
    "wordSet": ["word1_id", "word2_id"],
    "timeLimit": 60,
    "creator": {
      "id": "user_id",
      "username": "johndoe",
      "avatar": "IMAGE1"
    },
    "players": [
      {
        "id": "player_id",
        "userId": "user_id",
        "position": 1,
        "status": "ALIVE",
        "user": {
          "id": "user_id",
          "username": "johndoe",
          "avatar": "IMAGE1"
        }
      }
    ]
  }
}
```

#### Join Room
```http
POST /api/mobile/game-rooms/{room_code}/join
Authorization: Bearer <jwt_token>
Content-Type: application/json

{}
```

#### Get Room Status
```http
GET /api/mobile/game-rooms/{room_code}/status
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "room": {
    "id": "room_id",
    "name": "My Game Room",
    "code": "ABC123",
    "status": "IN_PROGRESS",
    "maxPlayers": 4,
    "currentRound": 1,
    "timeLimit": 60,
    "startedAt": "2024-01-01T00:00:00.000Z",
    "creator": {
      "id": "user_id",
      "username": "johndoe",
      "avatar": "IMAGE1"
    },
    "players": [
      {
        "id": "player_id",
        "position": 1,
        "status": "ALIVE",
        "kills": 0,
        "user": {
          "id": "user_id",
          "username": "johndoe",
          "avatar": "IMAGE1"
        },
        "target": {
          "id": "target_player_id",
          "user": {
            "id": "target_user_id",
            "username": "targetuser",
            "avatar": "IMAGE2"
          }
        }
      }
    ]
  },
  "currentPlayer": {
    "id": "player_id",
    "position": 1,
    "status": "ALIVE",
    "kills": 0,
    "word1": "apple",
    "word2": "banana", 
    "word3": "orange",
    "target": {
      "id": "target_player_id",
      "user": {
        "id": "target_user_id",
        "username": "targetuser",
        "avatar": "IMAGE2"
      }
    }
  },
  "gameLogs": [
    {
      "id": "log_id",
      "type": "game_start",
      "message": "Game started!",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Start Game
```http
POST /api/game-rooms/{room_code}/start
Authorization: Bearer <jwt_token>
Content-Type: application/json

{}
```

#### Claim Word
```http
POST /api/mobile/game-rooms/{room_code}/claim-word
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "claimedWord": "apple"
}
```

**Response:**
```json
{
  "message": "Word claim submitted. Waiting for target confirmation.",
  "killConfirmation": {
    "id": "confirmation_id",
    "status": "pending",
    "claimedWord": "apple",
    "target": {
      "id": "target_user_id",
      "username": "targetuser",
      "avatar": "IMAGE2"
    }
  }
}
```

#### Confirm Word Claim
```http
POST /api/mobile/game-rooms/{room_code}/confirm-word-claim
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "killConfirmationId": "confirmation_id",
  "accepted": true
}
```

### Store

#### Get Character Packs
```http
GET /api/mobile/store/characters
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "characterPacks": [
    {
      "id": "pack_id",
      "name": "Fantasy Pack",
      "description": "Fantasy characters",
      "imageUrl": "https://example.com/pack.jpg",
      "price": 999,
      "isActive": true,
      "isOwned": false,
      "characters": [
        {
          "id": "char_id",
          "name": "Wizard",
          "description": "A powerful wizard",
          "imageUrl": "https://example.com/wizard.jpg",
          "price": 299,
          "isOwned": false
        }
      ]
    }
  ]
}
```

#### Get Word Decks
```http
GET /api/mobile/store/word-decks
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "wordDecks": [
    {
      "id": "deck_id",
      "name": "Food Deck",
      "description": "Food-related words",
      "category": "food",
      "difficulty": "easy",
      "price": 499,
      "isActive": true,
      "isOwned": false,
      "wordCount": 50
    }
  ]
}
```

#### Create Payment Intent
```http
POST /api/mobile/purchases/create-payment-intent
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "type": "character_pack",
  "itemId": "pack_id"
}
```

**Response:**
```json
{
  "clientSecret": "pi_client_secret_here",
  "paymentIntentId": "pi_payment_intent_id"
}
```

#### Confirm Purchase
```http
POST /api/mobile/purchases/confirm
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "paymentIntentId": "pi_payment_intent_id"
}
```

**Response:**
```json
{
  "message": "Purchase confirmed successfully",
  "purchase": {
    "id": "purchase_id",
    "type": "character_pack",
    "itemId": "pack_id",
    "amount": 999,
    "status": "completed"
  }
}
```

### Admin APIs

#### Get All Words
```http
GET /api/admin/words
Authorization: Bearer <jwt_token>
```

#### Create Word
```http
POST /api/admin/words
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "word1": "apple",
  "word2": "banana",
  "word3": "orange",
  "category": "fruits",
  "difficulty": "easy",
  "isActive": true
}
```

#### Get All Users
```http
GET /api/admin/users
Authorization: Bearer <jwt_token>
```

#### Create User
```http
POST /api/admin/users
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "firstName": "Admin",
  "lastName": "User",
  "username": "adminuser",
  "email": "admin@example.com",
  "password": "password123",
  "avatar": "IMAGE1",
  "isActive": true
}
```

## Real-time Events (Pusher)

The app uses Pusher for real-time communication. Subscribe to room-specific channels:

### Channel: `room-{room_code}`

#### Events:
- `game-started`: Game has started
- `word-claim`: Someone claimed a word
- `elimination`: A player was eliminated
- `claim-rejected`: A word claim was rejected
- `game-ended`: Game finished with winner

### Example Pusher Integration:
```javascript
import Pusher from 'pusher-js'

const pusher = new Pusher('your_pusher_key', {
  cluster: 'your_cluster'
})

const channel = pusher.subscribe(`room-${roomCode}`)

channel.bind('word-claim', (data) => {
  // Handle word claim notification
  console.log('Word claimed:', data)
})

channel.bind('elimination', (data) => {
  // Handle player elimination
  console.log('Player eliminated:', data)
})
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "message": "Error description",
  "details": "Additional error details (optional)"
}
```

### Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Authentication endpoints: 5 requests per minute
- Game room endpoints: 10 requests per minute
- Store endpoints: 20 requests per minute

## Webhook Events (Stripe)

The app handles Stripe webhook events for payment processing:

```http
POST /api/webhooks/stripe
```

### Supported Events:
- `payment_intent.succeeded`: Payment completed
- `payment_intent.payment_failed`: Payment failed
- `payment_intent.canceled`: Payment canceled

## Environment Variables

Required environment variables for mobile app integration:

```env
# Database
DATABASE_URL=mongodb://localhost:27017/aseedak

# Authentication
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Pusher
PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=your_cluster

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@aseedak.com
```

## Testing

Use the provided Postman collection (`postman/Aseedak_Mobile_API_Collection.json`) to test all endpoints.

### Test Flow:
1. Register a new user
2. Verify email with OTP
3. Login to get JWT token
4. Create a game room
5. Join room with another user
6. Start the game
7. Test word claiming and confirmation
8. Test store purchases

## Security Considerations

1. **JWT Tokens**: Expire after 30 days
2. **Password Hashing**: Uses bcrypt with salt rounds of 12
3. **Input Validation**: All inputs validated with Zod schemas
4. **Rate Limiting**: Implemented on all endpoints
5. **CORS**: Configured for mobile app domains
6. **HTTPS**: Required in production

## Support

For API support and questions, contact the development team or refer to the Postman collection for examples.
