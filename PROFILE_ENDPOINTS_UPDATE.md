# Profile Endpoints Update

## Overview

Updated user profile endpoints to include purchase-related information: allowed games, max members, and purchased characters count.

## Updated Endpoints

### 1. GET /api/user/profile

**New Response Fields:**
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "phoneNumber": "+1234567890",
    "avatar": "IMAGE1",
    "profileImageUrl": "https://...",
    "role": "USER",
    "emailVerified": true,
    "gamesPlayed": 5,
    "gamesWon": 2,
    "totalKills": 8,
    "allowedGames": 15,              // ✅ NEW
    "maxMembers": 8,                   // ✅ NEW
    "purchasedCharacters": [            // ✅ NEW - Full character data
      {
        "id": "char_id_1",
        "name": "Warrior",
        "description": "A brave warrior",
        "imageUrl": "https://example.com/warrior.png",
        "price": 299,
        "isUnlocked": false,
        "isPaid": true
      },
      {
        "id": "char_id_2",
        "name": "Mage",
        "description": "Powerful mage",
        "imageUrl": "https://example.com/mage.png",
        "price": 399,
        "isUnlocked": false,
        "isPaid": true
      }
    ],
    "purchasedCharactersCount": 2,     // ✅ NEW
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. PUT /api/user/profile

**Updated Response Fields:**
Same as GET, now includes purchase data after update.

### 3. GET /api/auth/me

**New Response Fields:**
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "role": "USER",
    "isActive": true,
    "profileImage": "https://...",
    "avatar": "IMAGE1",
    "gamesPlayed": 5,
    "gamesWon": 2,
    "totalKills": 8,
    "emailVerified": true,
    "allowedGames": 15,              // ✅ NEW
    "maxMembers": 8,                   // ✅ NEW
    "purchasedCharactersCount": 3,     // ✅ NEW
    "createdAt": "2024-01-01T00:00:00.000Z",
    "status": "active"
  }
}
```

## New Fields Explained

### 1. `allowedGames` (Number)
- Total number of games the user can play
- Default: 5
- Increases when user purchases game credits

### 2. `maxMembers` (Number)
- Maximum number of players allowed in user's game rooms
- Default: 4
- Upgrades available (e.g., 4 → 8 → 12 → 16)

### 3. `purchasedCharacters` (Array)
- **Complete character data** for all characters the user has purchased
- Returns empty array `[]` if no characters purchased
- Each character object includes:
  - `id` - Character ID
  - `name` - Character name
  - `description` - Character description
  - `imageUrl` - Character image URL
  - `price` - Original purchase price
  - `isUnlocked` - Default unlock status
  - `isPaid` - Whether character requires purchase

### 4. `purchasedCharactersCount` (Number)
- Total count of characters the user has purchased (length of purchasedCharacters array)
- Returns 0 if no characters purchased
- Convenience field for quick access to count

## Implementation Details

### Code Changes

#### `/api/user/profile` (GET)
```typescript
// Get user's purchased characters with full details
const purchasedCharacters = await prisma.userCharacter.findMany({
  where: { userId: user.userId },
  include: {
    character: {
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        price: true,
        isUnlocked: true,
        isPaid: true
      }
    }
  }
})

return NextResponse.json({ 
  user: {
    ...userProfile,
    purchasedCharacters: purchasedCharacters.map(uc => uc.character),  // Full array
    purchasedCharactersCount: purchasedCharacters.length  // Count
  }
})
```

#### `/api/user/profile` (PUT)
```typescript
// Get user's purchased characters with full details after update
const purchasedCharacters = await prisma.userCharacter.findMany({
  where: { userId: user.userId },
  include: {
    character: {
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        price: true,
        isUnlocked: true,
        isPaid: true
      }
    }
  }
})

return NextResponse.json({
  message: 'Profile updated successfully',
  user: {
    ...updatedUser,
    purchasedCharacters: purchasedCharacters.map(uc => uc.character),  // Full array
    purchasedCharactersCount: purchasedCharacters.length  // Count
  }
})
```

#### `/api/auth/me`
```typescript
// Get user's purchased characters with full details
const purchasedCharacters = await prisma.userCharacter.findMany({
  where: { userId: user.id },
  include: {
    character: {
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        price: true,
        isUnlocked: true,
        isPaid: true
      }
    }
  }
})

return NextResponse.json({
  user: {
    // ... existing fields ...
    allowedGames: user.allowedGames,                // Added
    maxMembers: user.maxMembers,                    // Added
    purchasedCharacters: purchasedCharacters.map(uc => uc.character),  // Added - Full array
    purchasedCharactersCount: purchasedCharacters.length,  // Added - Count
    // ... rest of fields ...
  }
})
```

## Use Cases

### 1. Mobile App Profile Screen
Display user's purchase statistics:
- Games available to play
- Maximum room capacity
- Character collection size

### 2. In-App Store
Show purchase status:
- "You have 15 games remaining"
- "Upgrade to 12 members per room"
- "You own 3 characters"

### 3. Game Setup
Validate game creation:
- Check if user has available games
- Check max members for room creation
- Show available characters for selection

## Testing

A test script is available:

```bash
node scripts/test-profile-endpoints.js
```

**Test Coverage:**
- ✅ GET /api/user/profile includes purchase fields
- ✅ PUT /api/user/profile includes purchase fields
- ✅ GET /api/auth/me includes purchase fields
- ✅ All fields are numbers and valid
- ✅ No missing required fields

## Migration Notes

### No Breaking Changes

These changes are **additive only**. Existing API consumers will continue to work, and the new fields are available for those who need them.

### Mobile App Integration

Mobile apps can now:
1. Show user's game credits on profile screen
2. Display member upgrade status
3. Show character collection size
4. Validate purchases before allowing actions

### Example Integration

```typescript
// Fetch user profile with purchase data
const profile = await fetch('/api/user/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// Display purchase info
console.log(`Games remaining: ${profile.user.allowedGames}`);
console.log(`Max room members: ${profile.user.maxMembers}`);
console.log(`Characters owned: ${profile.user.purchasedCharactersCount}`);

// Access full character details
profile.user.purchasedCharacters.forEach(character => {
  console.log(`- ${character.name}: ${character.description}`);
  console.log(`  Image: ${character.imageUrl}`);
});
```

## Related APIs

- **GET /api/mobile/characters** - Get all characters with ownership info
- **PUT /api/user/update** - Update user after purchase
- **GET /api/mobile/store/characters** - Browse available characters

## Database Schema

### User Model
```prisma
model User {
  allowedGames  Int     @default(5)
  maxMembers    Int     @default(4)
  userCharacters UserCharacter[]
}
```

### UserCharacter Model
```prisma
model UserCharacter {
  userId      String    @db.ObjectId
  characterId String    @db.ObjectId
  user        User      @relation(...)
  character   Character @relation(...)
  @@unique([userId, characterId])
}
```

## Performance Considerations

- **Query Count:** Each endpoint now makes 2 queries:
  1. User data query
  2. UserCharacter count query
- **Optimization:** Count query is lightweight and indexed on `userId`
- **Response Size:** Adds 3 number fields (~24 bytes)

## Security

- All endpoints still require authentication
- Purchased characters count is user-specific
- No sensitive payment data exposed
- Data is calculated in real-time (always current)

