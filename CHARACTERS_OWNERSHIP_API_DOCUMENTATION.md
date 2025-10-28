# Characters with Ownership API Documentation

## Overview

The `/api/mobile/characters` endpoint allows users to fetch **all characters** in the system with personalized ownership information. Each character includes whether the requesting user has purchased it and whether it's a default character.

## Endpoint

```
GET /api/mobile/characters
```

## Authentication

**Required:** Bearer token (JWT) in Authorization header

```http
Authorization: Bearer <jwt_token>
```

## Purpose

This API is designed for:
- **Character selection screens** in mobile apps
- **Showing available vs purchased** characters to users
- **Displaying default characters** that everyone has access to
- **Store frontends** to show what users can purchase

## Response Structure

### Success Response

```json
{
  "characters": [
    {
      "id": "character_id_1",
      "name": "Character Name",
      "description": "Character description",
      "imageUrl": "https://example.com/image.png",
      "price": 0,
      "isUnlocked": true,
      "isPaid": false,
      "packId": null,
      "pack": null,
      "isPurchased": false,
      "isDefault": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 16,
  "purchased": 3,
  "default": 13
}
```

### Error Responses

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

## Character Fields

### Core Character Data

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Character's unique ID |
| `name` | String | Character's display name |
| `description` | String | Character's description |
| `imageUrl` | String | Character's image URL |
| `price` | Number | Price in cents (0 for free) |
| `isUnlocked` | Boolean | Whether character is unlocked by default |
| `isPaid` | Boolean | Whether character requires purchase |
| `packId` | String? | ID of character pack (if in a pack) |
| `pack` | Object? | Character pack information |

### Ownership Fields (Added by API)

| Field | Type | Description |
|-------|------|-------------|
| `isPurchased` | Boolean | **true** if the requesting user has purchased this character |
| `isDefault` | Boolean | **true** if this is a default/free character |

### Summary Fields

| Field | Type | Description |
|-------|------|-------------|
| `total` | Number | Total number of characters |
| `purchased` | Number | Number of characters the user has purchased |
| `default` | Number | Number of default/free characters |

## Logic Details

### isPurchased Logic

- **true**: User has a `UserCharacter` record for this character
- **false**: User hasn't purchased this character

### isDefault Logic

- **true**: Character has `isUnlocked = true` OR `price = 0`
- **false**: Character requires purchase (`isPaid = true` and `price > 0`)

## Usage Examples

### Example 1: Fetch All Characters

```bash
curl -X GET http://localhost:3000/api/mobile/characters \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Use Case:** Load all available characters in a character selection screen

### Example 2: Filter Purchased Characters

```javascript
// JavaScript/TypeScript example
const response = await fetch('/api/mobile/characters', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();

// Get characters the user owns
const purchasedCharacters = data.characters.filter(
  char => char.isPurchased
);

// Get characters user can buy
const purchasableCharacters = data.characters.filter(
  char => !char.isDefault && !char.isPurchased
);

// Get default (free) characters
const defaultCharacters = data.characters.filter(
  char => char.isDefault
);
```

### Example 3: Display in UI

```react
// React example
const CharacterList = () => {
  const [characters, setCharacters] = useState([]);
  
  useEffect(() => {
    fetch('/api/mobile/characters', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCharacters(data.characters));
  }, []);

  return (
    <div>
      {characters.map(char => (
        <CharacterCard
          key={char.id}
          character={char}
          isOwned={char.isPurchased}
          isFree={char.isDefault}
        />
      ))}
    </div>
  );
};
```

## Database Schema

This API queries these tables:

```prisma
model Character {
  id          String
  name        String
  description String
  imageUrl    String
  price       Int
  isUnlocked  Boolean  // Default character flag
  isPaid      Boolean  // Requires purchase
  packId      String?
  pack        CharacterPack?
  userCharacters UserCharacter[]
}

model UserCharacter {
  userId      String    @db.ObjectId
  characterId String    @db.ObjectId
  user        User      @relation(...)
  character   Character @relation(...)
  @@unique([userId, characterId])
}
```

## Performance Considerations

- **Indexes used:**
  - Characters: `isActive` (filters active only)
  - UserCharacters: `userId` (fast ownership lookup)

- **Query optimization:**
  - Single query for all characters
  - Single query for user's purchased characters
  - Ownership calculated in-memory (fast)

- **Response size:**
  - Typical: 20-50 characters
  - Includes full character details + ownership flags
  - Summary statistics at root level

## Security Considerations

1. **Authentication Required:** All requests must include valid JWT token
2. **User Isolation:** Each user sees their own ownership status
3. **No Sensitive Data:** Only returns purchase status, not payment details
4. **Active Only:** Only returns `isActive = true` characters

## Use Cases

### 1. Character Selection Screen

Show users all available characters with:
- ✅ Green checkmark for purchased
- 🔓 "Free" badge for default characters
- 💰 "Buy" button for unpurchased characters

### 2. Store Frontend

Display:
- "Your Characters" (isPurchased = true)
- "Available to Purchase" (isDefault = false, isPurchased = false)
- "Free Characters" (isDefault = true)

### 3. Profile Page

Show character collection:
- Count of purchased characters
- Count of default characters
- Total collection percentage

### 4. Game Setup

Filter available characters based on ownership:
- Use purchased characters
- Fallback to default if none purchased

## Integration Example

```typescript
// CharacterService.ts
export class CharacterService {
  async fetchAllCharacters(token: string) {
    const response = await fetch('/api/mobile/characters', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch characters');
    }

    const data = await response.json();
    return data.characters;
  }

  async getUserPurchasedCharacters(token: string) {
    const characters = await this.fetchAllCharacters(token);
    return characters.filter(char => char.isPurchased);
  }

  async getPurchasableCharacters(token: string) {
    const characters = await this.fetchAllCharacters(token);
    return characters.filter(char => !char.isDefault && !char.isPurchased);
  }
}
```

## Testing

A test script is available:

```bash
node scripts/test-characters-with-ownership.js
```

**Test Coverage:**
- ✅ Login and JWT authentication
- ✅ Fetch all characters
- ✅ Verify isPurchased flags
- ✅ Verify isDefault logic
- ✅ Check summary statistics

## Notes

- **Default characters** are identified by `price = 0` or `isUnlocked = true`
- **Ownership** is determined by checking `UserCharacter` records
- **Statistics** are calculated in the API response for convenience
- **Pack information** is included if character belongs to a pack
- All characters in response are **active only** (`isActive = true`)

