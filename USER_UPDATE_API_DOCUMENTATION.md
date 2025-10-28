# User Update API Documentation

## Overview

The `/api/user/update` endpoint is a critical API for handling post-purchase user updates. After a user completes a purchase (through Stripe or in-app purchases), this API is called to update the user's account with the purchased items.

## Endpoint

```
PUT /api/user/update
```

## Authentication

**Required:** Bearer token (JWT) in Authorization header

```http
Authorization: Bearer <jwt_token>
```

## Purpose

This API synchronizes user purchases with the database. When a user purchases:
- Additional game credits
- Increased member capacity
- Characters or character packs

This endpoint updates the user's account accordingly.

## Request Body

The API accepts a JSON body with one or more of these optional fields:

```json
{
  "newGamesPurchased": 10,       // Number: Adds to existing allowedGames
  "maxMembers": 8,                // Number: Sets the new max members limit
  "characters": ["char_id_1", "char_id_2"]  // Array: Character IDs to assign to user
}
```

### Field Descriptions

1. **`newGamesPurchased`** (Optional)
   - Type: Integer (>= 0)
   - Description: Number of additional games to add to user's account
   - Behavior: Adds to existing `allowedGames` (does not replace)
   - Example: If user has 5 games and purchases 10, they get 15 total

2. **`maxMembers`** (Optional)
   - Type: Integer (>= 1)
   - Description: Maximum number of members allowed in user's game rooms
   - Behavior: Replaces the existing `maxMembers` value
   - Example: Upgrade from 4 to 8 members

3. **`characters`** (Optional)
   - Type: Array of strings (character IDs)
   - Description: Characters to unlock for the user
   - Behavior: Creates `UserCharacter` records (skips if already owned)
   - Example: Purchase a character pack to unlock multiple characters

## Response

### Success Response

```json
{
  "message": "User updated successfully",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "allowedGames": 15,
    "maxMembers": 8,
    "gamesPlayed": 2,
    "gamesWon": 1,
    "totalKills": 3
  },
  "purchasedCharacters": 2,
  "totalCharactersOwned": 5
}
```

### Error Responses

**400 Bad Request** - Invalid data
```json
{
  "message": "Number must be greater than or equal to 0"
}
```

**400 Bad Request** - Invalid characters
```json
{
  "message": "Some characters are invalid or inactive"
}
```

**401 Unauthorized** - Missing or invalid token
```json
{
  "message": "Unauthorized"
}
```

**500 Internal Server Error**
```json
{
  "message": "Internal server error"
}
```

## Usage Examples

### Example 1: Purchase Additional Games

After a user completes payment for 10 additional games:

```bash
curl -X PUT http://localhost:3000/api/user/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "newGamesPurchased": 10
  }'
```

**Result:** User's `allowedGames` increases by 10

### Example 2: Upgrade Member Capacity

After a user purchases a member upgrade:

```bash
curl -X PUT http://localhost:3000/api/user/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "maxMembers": 8
  }'
```

**Result:** User's `maxMembers` is set to 8

### Example 3: Purchase Characters

After a user purchases a character pack:

```bash
curl -X PUT http://localhost:3000/api/user/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "characters": ["char_id_1", "char_id_2", "char_id_3"]
  }'
```

**Result:** Characters are added to user's collection (creates `UserCharacter` records)

### Example 4: Combined Purchase

Purchase multiple items in one transaction:

```bash
curl -X PUT http://localhost:3000/api/user/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "newGamesPurchased": 10,
    "maxMembers": 12,
    "characters": ["char_id_1"]
  }'
```

**Result:** All purchases applied in one API call

## How It Works

### Game Purchases

1. Fetches current user's `allowedGames` value
2. Adds `newGamesPurchased` to the existing value
3. Updates the database with the new total

**Important:** This is additive. If a user has 5 games and purchases 10, they get 15.

### Member Upgrades

1. Directly sets `maxMembers` to the new value
2. Replaces any existing value

### Character Purchases

1. Validates all character IDs exist and are active
2. Uses `upsert` to create `UserCharacter` records
3. Skips if user already owns the character (unique constraint)
4. Returns count of newly purchased characters

## Integration with Purchase System

This API is typically called AFTER a successful payment:

```
1. User initiates purchase on mobile app
2. Payment processed (Stripe/in-app purchase)
3. Payment confirmed via webhook
4. Call /api/user/update to sync purchase
5. User account updated in database
```

## Testing

A comprehensive test script is available:

```bash
node scripts/test-user-update-api.js
```

This script tests:
- ✅ Login and JWT authentication
- ✅ Game purchase (adding to allowedGames)
- ✅ Max members update
- ✅ Character purchase (when characters exist)
- ✅ Combined purchases
- ✅ Invalid request validation

## Database Schema

This API updates these fields in the User model:

```prisma
model User {
  allowedGames  Int     @default(5)
  maxMembers    Int     @default(4)
  userCharacters UserCharacter[]
}

model UserCharacter {
  userId      String   @db.ObjectId
  characterId String   @db.ObjectId
  @@unique([userId, characterId])
}
```

## Security Considerations

1. **Authentication Required:** All requests must include valid JWT token
2. **User Isolation:** Users can only update their own account
3. **Validation:** Input validation via Zod schema
4. **Idempotency:** Purchasing same character twice is safe (upsert)

## Error Handling

The API includes comprehensive error handling:

- **Invalid Data:** Returns 400 with validation error message
- **Invalid Characters:** Returns 400 if character IDs don't exist or are inactive
- **Server Errors:** Returns 500 with generic error message (logs full error server-side)

## Notes

- At least one field must be provided (newGamesPurchased, maxMembers, or characters)
- Fields can be combined for bulk updates
- Character purchase uses upsert to handle duplicate purchases gracefully
- All numeric fields have validation (games >= 0, members >= 1)

