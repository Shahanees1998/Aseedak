# ✅ Dual Authentication Implementation Complete

## 🎯 Overview

Your Aseedak application now supports **dual authentication**:

1. **JWT (jose)** - For mobile app
2. **NextAuth** - For web admin panel

Both authentication methods work seamlessly on **ALL** admin APIs.

---

## 📊 What's Been Implemented

### 1. NextAuth for Web Admin Panel
- ✅ Session-based authentication
- ✅ Credentials provider (email/password)
- ✅ Admin-only access validation
- ✅ Secure session management

### 2. JWT (jose) for Mobile App  
- ✅ Bearer token authentication
- ✅ Unchanged - all mobile functionality works as before
- ✅ Full admin API access

### 3. Dual Auth Middleware
- ✅ All `/api/admin/*` endpoints support BOTH auth methods
- ✅ `/api/auth/me` supports BOTH auth methods
- ✅ Priority: JWT Bearer → JWT Cookie → NextAuth Session

---

## 🔐 Authentication Methods Supported

### Method 1: JWT Bearer Token (Mobile App)
```bash
# Mobile app sends JWT in Authorization header
curl https://yourdomain.com/api/admin/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Priority:** ⭐ Highest (checked first)

### Method 2: JWT Cookie (Legacy)
```bash
# Old web clients with JWT cookie
# Cookie: token=YOUR_JWT_TOKEN
```

**Priority:** ⭐⭐ Medium (checked if Bearer fails)

### Method 3: NextAuth Session (New Web)
```bash
# New web admin panel
# Uses NextAuth session cookies automatically
# No Authorization header needed!
```

**Priority:** ⭐⭐⭐ Lowest (checked last)

---

## 📝 Files Modified/Created

### Created Files:
1. `/lib/auth.config.ts` - NextAuth configuration
2. `/app/api/auth/[...nextauth]/route.ts` - NextAuth API route
3. `/types/next-auth.d.ts` - TypeScript types for NextAuth
4. `/middleware.ts` - Route protection middleware
5. `/scripts/generate-nextauth-secret.js` - Secret generator
6. `/scripts/check-admin-user.js` - Admin user checker
7. `/scripts/test-nextauth.js` - Configuration tester

### Modified Files:
1. `/lib/authMiddleware.ts` - ✅ **Dual auth support added**
2. `/app/api/auth/me/route.ts` - ✅ **Dual auth support added**
3. `/app/providers.tsx` - Added SessionProvider
4. `/app/auth/login/page.tsx` - Updated to use NextAuth
5. `/app/admin/layout.tsx` - Updated to use NextAuth session
6. `/layout/AppTopbar.tsx` - Updated to use NextAuth session
7. `/layout/AppProfileSidebar.tsx` - Updated logout to use NextAuth
8. `/env.example` - Added NextAuth variables
9. `/package.json` - Added helper scripts

---

## 🚀 Admin APIs with Dual Auth

All these endpoints now accept BOTH JWT (jose) and NextAuth:

### User Management:
- ✅ `GET /api/admin/users` - List users
- ✅ `POST /api/admin/users` - Create user
- ✅ `GET /api/admin/users/[id]` - Get user
- ✅ `PUT /api/admin/users/[id]` - Update user
- ✅ `DELETE /api/admin/users/[id]` - Delete user
- ✅ `PUT /api/admin/users/[id]/toggle-status` - Toggle user status
- ✅ `PUT /api/admin/users/[id]/assign-avatar` - Assign avatar
- ✅ `GET /api/admin/users/statistics` - User statistics

### Character Management:
- ✅ `GET /api/admin/characters` - List characters
- ✅ `POST /api/admin/characters` - Create character
- ✅ `GET /api/admin/characters/[id]` - Get character
- ✅ `PUT /api/admin/characters/[id]` - Update character
- ✅ `DELETE /api/admin/characters/[id]` - Delete character
- ✅ `PUT /api/admin/characters/[id]/toggle-status` - Toggle character status
- ✅ `POST /api/admin/characters/mark-all-unpaid` - Mark characters unpaid

### Word & Deck Management:
- ✅ `GET /api/admin/words` - List words
- ✅ `POST /api/admin/words` - Create word
- ✅ `GET /api/admin/words/[id]` - Get word
- ✅ `PUT /api/admin/words/[id]` - Update word
- ✅ `DELETE /api/admin/words/[id]` - Delete word
- ✅ `GET /api/admin/word-decks` - List word decks

### Game & Notification Management:
- ✅ `GET /api/admin/game-rooms` - List game rooms
- ✅ `GET /api/admin/character-packs` - List character packs
- ✅ `POST /api/admin/notifications/test` - Test notifications

### Profile Management:
- ✅ `GET /api/auth/me` - Get current user (BOTH auth methods)

**Total:** 15+ admin API routes with dual auth support

---

## 🧪 Testing Guide

### Test Mobile App (JWT)

```bash
# 1. Login to get JWT token
curl -X POST https://yourdomain.com/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yopmail.com","password":"yourpassword"}'

# Response: { "token": "YOUR_JWT_TOKEN" }

# 2. Use token to access admin API
curl https://yourdomain.com/api/admin/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Should return list of users ✅
```

### Test Web Admin Panel (NextAuth)

```bash
# 1. Visit your domain
https://yourdomain.com/auth/login

# 2. Login with admin credentials
Email: admin@yopmail.com
Password: yourpassword

# 3. Should redirect to /admin ✅

# 4. Admin panel automatically sends NextAuth session
# No Bearer token needed!
```

### Test API Endpoint Access

```bash
# Check if /api/auth/me works for both

# Method 1: With JWT (mobile)
curl https://yourdomain.com/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Method 2: With NextAuth (web - needs session cookie)
# Just visit https://yourdomain.com/api/auth/me in browser
# while logged in to admin panel
```

---

## 🔧 Environment Variables Required

### Production Deployment

Add these to your Digital Ocean Droplet:

```bash
# Database
DATABASE_URL="mongodb://your-mongo-connection-string"

# JWT (for mobile app)
JWT_SECRET="your-jwt-secret-key"

# NextAuth (for web admin panel)
NEXTAUTH_URL="https://yourdomain.com"  # Your production URL
NEXTAUTH_SECRET="your-nextauth-secret-minimum-32-chars"

# Other existing variables...
PUSHER_KEY="..."
PUSHER_SECRET="..."
# etc.
```

### Generate Secrets Locally

```bash
# Generate NEXTAUTH_SECRET
npm run generate:secret

# Copy output to your .env file on server
```

---

## 📱 Mobile App - No Changes Needed

Your mobile app continues to work **exactly as before**:

```javascript
// 1. Login
const response = await fetch('https://yourdomain.com/api/mobile/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { token } = await response.json();

// 2. Use token for ALL requests (including admin APIs)
const users = await fetch('https://yourdomain.com/api/admin/users', {
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// ✅ Works perfectly!
```

---

## 🌐 Web Admin Panel - New NextAuth

Web admin panel now uses NextAuth:

```javascript
// 1. Login via form (automatic)
// User enters credentials at /auth/login

// 2. NextAuth creates session

// 3. All API calls automatically include session
// No Bearer token needed in code!

const response = await fetch('/api/admin/users');
// ✅ Session sent automatically via cookies
```

---

## 🔍 How Authentication Priority Works

```typescript
// Authentication check order in authMiddleware:

1. Check Authorization: Bearer header (MOBILE)
   ✅ If found and valid → Allow access
   ❌ If not found → Try next method

2. Check JWT Cookie (LEGACY)
   ✅ If found and valid → Allow access
   ❌ If not found → Try next method

3. Check NextAuth Session (WEB)
   ✅ If found and valid → Allow access
   ❌ If not found → Return 401 Unauthorized
```

---

## ✅ Deployment Checklist

### On Your Digital Ocean Droplet:

- [ ] Set `NEXTAUTH_URL` to your production domain
- [ ] Set `NEXTAUTH_SECRET` (use `npm run generate:secret`)
- [ ] Keep `JWT_SECRET` unchanged
- [ ] Rebuild application: `npm run build`
- [ ] Restart application
- [ ] Test mobile app login (should work as before)
- [ ] Test web admin login (should use NextAuth)
- [ ] Test `/api/auth/me` from both mobile and web

---

## 🐛 Troubleshooting

### Issue: Mobile app getting 401 on admin APIs

**Cause:** JWT token not being sent properly

**Solution:**
```javascript
// Make sure Authorization header is set
headers: {
  'Authorization': `Bearer ${token}`,  // Don't forget 'Bearer '
}
```

### Issue: Web admin panel getting 401

**Cause:** NextAuth session not created

**Solution:**
1. Check `NEXTAUTH_URL` matches your domain exactly
2. Check `NEXTAUTH_SECRET` is set
3. Clear browser cookies
4. Login again

### Issue: "/api/auth/me says unauthorized"

**Cause:** Neither JWT nor NextAuth session found

**Solution:**
1. **For Mobile:** Check JWT token is valid and sent in header
2. **For Web:** Make sure you're logged in to admin panel
3. Check server logs for authentication method used

---

## 📊 Summary

| Feature | Mobile App | Web Admin |
|---------|------------|-----------|
| **Auth Method** | JWT (jose) | NextAuth |
| **Token Type** | Bearer Token | Session Cookie |
| **Login Endpoint** | `/api/mobile/auth/login` | `/auth/login` (NextAuth) |
| **Token Validity** | 7 days | 7 days |
| **Admin API Access** | ✅ Yes | ✅ Yes |
| **Changes Needed** | ❌ None | ✅ Already Done |

---

## 🎉 What This Means

### For Mobile Developers:
- ✅ **No changes needed** to mobile app code
- ✅ All admin APIs still work with JWT tokens
- ✅ Same login flow as before
- ✅ Same token management as before

### For Web Developers:
- ✅ **Better security** with NextAuth sessions
- ✅ **No bearer tokens** to manage in frontend
- ✅ **Automatic session handling** by NextAuth
- ✅ **CSRF protection** built-in

### For Backend:
- ✅ **Single codebase** for both auth methods
- ✅ **Same API routes** serve both mobile and web
- ✅ **Automatic fallback** if one auth method fails
- ✅ **Zero breaking changes** to existing APIs

---

## 📞 Quick Commands

```bash
# Check admin users
npm run check:admin

# Test NextAuth configuration
npm run test:nextauth

# Generate NextAuth secret
npm run generate:secret

# Build for production
npm run build

# Start production server
npm start
```

---

## 🔗 Related Documentation

- [NextAuth Setup Guide](./NEXTAUTH_SETUP_GUIDE.md)
- [NextAuth Debug Guide](./NEXTAUTH_DEBUG_GUIDE.md)
- [Mobile API Guide](./MOBILE_API_GUIDE.md)

---

**Last Updated:** October 9, 2025  
**Status:** ✅ Production Ready  
**Build:** ✅ Passing


