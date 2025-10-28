# Game Purchase System Implementation

## Overview
This document describes the new game purchase system where users can purchase games and manage their game limits.

## Schema Changes

### User Model Updates (`prisma/schema.prisma`)
Added new field:
- `allowedGames`: Number of games user can play (default: 5)
- Uses existing `maxMembers`: Maximum players user can add when creating a room (already exists, default: 4)

## API Endpoints

### 1. User Update Endpoint
**Location:** `app/api/user/update/route.ts`

**Endpoint:** `PUT /api/user/update`

**Authentication:** Required (JWT token from headers)

**Request Body:**
```json
{
  "newGamesPurchased": 10,           // Optional: Add games to existing allowedGames
  "maxMembers": 8,                   // Optional: Update maxMembers entirely
  "characters": ["char_id_1", "char_id_2"]  // Optional: Array of character IDs to purchase
}
```

**Response:**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "allowedGames": 15,  // Updated count
    "maxMembers": 8,    // Updated count
    "firstName": "John",
    "lastName": "Doe",
    "username": "john_doe",
    "gamesPlayed": 5,
    "gamesWon": 2,
    "totalKills": 10
  },
  "purchasedCharacters": 2,
  "totalCharactersOwned": 5
}
```

**Features:**
- **Purchase Games**: Add to existing `allowedGames` count
- **Update Max Members**: Replace `maxMembers` with new value
- **Purchase Characters**: Create user-character associations

### 2. Game Start Endpoint (Updated)
**Location:** `app/api/game-rooms/[code]/start/route.ts`

**Changes:**
1. Checks if user has `allowedGames > 0` before starting
2. Decrements `allowedGames` by 1 when game starts
3. Returns error message if no games remaining

**Before Starting:**
- Validates user has at least 1 game remaining
- If `allowedGames <= 0`, returns:
  ```json
  {
    "message": "You have no games remaining. Please purchase more games to play.",
    "allowedGames": 0
  }
  ```

**When Game Starts:**
- Decrements `allowedGames` by 1
- Proceeds with normal game start flow

### 3. User Profile Endpoint (Updated)
**Location:** `app/api/user/profile/route.ts`

**Changes:**
- Now returns `allowedGames` and `maxMembers` in profile data

**GET Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "allowedGames": 5,
    "maxMembers": 4,
    "gamesPlayed": 10,
    "gamesWon": 3,
    "totalKills": 15,
    ...
  }
}
```

## Game Room Creation

### Room Creation Logic (`app/api/game-rooms/create/route.ts`)
- Already validates that `maxPlayers` doesn't exceed user's `maxMembers` limit
- Returns error if user tries to create room with more players than their limit

## Character Assignment

### Game Start Logic (`app/api/game-rooms/[code]/start/route.ts`)
Characters are assigned from:
1. **Purchased Characters**: User's `userCharacters` associations
2. **Default Unlocked Characters**: Characters with `isUnlocked: true`
3. **Free Characters**: Characters with `isPaid: false` and `isUnlocked: false`

Each player gets a unique character randomly assigned from the available pool.

## User Registration

When a user registers:
- `allowedGames` defaults to **5** (from schema)
- `maxMembers` defaults to **4** (from schema)

## Flow Summary

1. **User Registration** → Gets 5 games, 4 max members
2. **User Starts Game** → AllowedGames checked (must be > 0)
3. **Game Starts** → AllowedGames decremented by 1
4. **When Out of Games** → User must purchase more via `/api/user/update`
5. **Room Creation** → Validates user's `maxMembers` limit
6. **Character Assignment** → Uses purchased characters randomly

## Usage Examples

### Purchase Games
```bash
curl -X PUT http://localhost:3000/api/user/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newGamesPurchased": 10}'
```

### Upgrade Max Members
```bash
curl -X PUT http://localhost:3000/api/user/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"maxMembers": 12}'
```

### Purchase Characters
```bash
curl -X PUT http://localhost:3000/api/user/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"characters": ["char_id_1", "char_id_2", "char_id_3"]}'
```

## Database Migration

To apply the schema changes:
```bash
npx prisma generate  # Generate Prisma client
# If using migrations (recommended):
npx prisma migrate dev --name add_allowed_games_field
```

## Notes

- `allowedGames` can go negative (allowed by schema), but validation prevents starting games with 0 or less
- User registration automatically sets defaults (no code changes needed)
- Character purchases use `upsert` to avoid duplicates
- All endpoints use existing authentication middleware (`withAuth`)

