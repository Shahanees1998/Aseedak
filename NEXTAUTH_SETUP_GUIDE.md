# NextAuth Setup Guide for Aseedak

## Overview

This guide covers the NextAuth implementation for the Aseedak admin panel. The system now supports **dual authentication**:

- **NextAuth** for web admin panel (session-based)
- **JWT** for mobile app (token-based)

Both authentication methods work seamlessly together, allowing mobile apps to continue using JWT tokens while the web admin panel uses NextAuth sessions.

---

## ✅ What's Been Implemented

### 1. **NextAuth Core Setup**
- ✅ NextAuth API route at `/app/api/auth/[...nextauth]/route.ts`
- ✅ Credentials provider for email/password authentication
- ✅ Custom callbacks for JWT and session handling
- ✅ TypeScript type definitions for NextAuth

### 2. **Dual Authentication Middleware**
- ✅ Updated `lib/authMiddleware.ts` to support both JWT and NextAuth
- ✅ Priority order: JWT Bearer → JWT Cookie → NextAuth Session
- ✅ Zero breaking changes to existing mobile API endpoints

### 3. **Admin Panel Updates**
- ✅ Login page using NextAuth `signIn()`
- ✅ Admin layout using NextAuth session
- ✅ Profile sidebar with NextAuth `signOut()`
- ✅ Topbar with NextAuth session

### 4. **Route Protection**
- ✅ Middleware at `/middleware.ts` for route protection
- ✅ Only admins can access `/admin/*` routes
- ✅ Public routes remain accessible

### 5. **Provider Configuration**
- ✅ `SessionProvider` added to app providers
- ✅ Wrapped around all components for session access

---

## 🔧 Environment Variables Setup

### Required Environment Variables

Add these to your `.env` file:

```bash
# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"  # Change to your production URL
NEXTAUTH_SECRET="your-nextauth-secret-key-here-minimum-32-characters"

# Existing JWT (keep this for mobile app)
JWT_SECRET="your-jwt-secret-key-here"
```

### Generate NEXTAUTH_SECRET

Run one of these commands to generate a secure secret:

**Option 1: Using OpenSSL**
```bash
openssl rand -base64 32
```

**Option 2: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 3: Quick script**
```bash
npm run generate-secret
```

### Production Environment Variables

For production, update `NEXTAUTH_URL`:

```bash
NEXTAUTH_URL="https://yourdomain.com"  # No trailing slash
NEXTAUTH_SECRET="your-production-secret-different-from-jwt"
```

---

## 🚀 How Authentication Works

### Mobile App (Unchanged)

Mobile apps continue to work exactly as before:

1. Login via `/api/mobile/auth/login`
2. Receive JWT token
3. Send token in `Authorization: Bearer <token>` header
4. Access all `/api/admin/*` endpoints

**Example mobile API call:**
```javascript
fetch('https://yourdomain.com/api/admin/users', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  }
})
```

### Web Admin Panel (New)

Admin users login via NextAuth:

1. Visit `/auth/login`
2. Enter email and password
3. NextAuth creates a session
4. Redirected to `/admin`
5. Session automatically sent with requests

**No bearer token needed for web!**

---

## 🔐 Security Features

### NextAuth Security
- ✅ CSRF protection built-in
- ✅ Secure session cookies (httpOnly)
- ✅ Role-based access control
- ✅ Automatic session refresh
- ✅ XSS protection

### Dual Auth Priority
1. **JWT Bearer Token** (mobile priority)
2. **JWT Cookie** (legacy web)
3. **NextAuth Session** (new web admin)

This ensures mobile apps always get priority authentication.

---

## 📝 API Endpoint Compatibility

### All admin endpoints support BOTH auth methods:

```typescript
// Mobile app - JWT Bearer Token
GET /api/admin/users
Headers: { Authorization: 'Bearer jwt_token' }

// Web admin panel - NextAuth Session
GET /api/admin/users
// No auth header needed - session cookie sent automatically
```

### Admin API Routes That Work With Both:
- ✅ `/api/admin/users`
- ✅ `/api/admin/characters`
- ✅ `/api/admin/game-rooms`
- ✅ `/api/admin/words`
- ✅ `/api/admin/character-packs`
- ✅ `/api/admin/word-decks`
- ✅ `/api/admin/notifications`

---

## 🧪 Testing the Implementation

### Test Admin Login (Web)

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000/auth/login`

3. Login with admin credentials

4. You should be redirected to `/admin`

### Test Mobile API (Unchanged)

1. Login via mobile endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/mobile/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"password123"}'
   ```

2. Use the token to access admin endpoints:
   ```bash
   curl http://localhost:3000/api/admin/users \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

---

## 🛠️ Troubleshooting

### Issue: "NEXTAUTH_SECRET is not set"

**Solution:** Make sure you have `NEXTAUTH_SECRET` in your `.env` file.

```bash
# Generate a new secret
openssl rand -base64 32

# Add to .env
NEXTAUTH_SECRET="generated_secret_here"
```

### Issue: "Access denied" after login

**Solution:** Ensure the user has `role: 'ADMIN'` in the database.

```javascript
// Check user role in database
await prisma.user.findUnique({
  where: { email: 'admin@example.com' },
  select: { role: true }
})
```

### Issue: Mobile app can't access admin APIs

**Solution:** Mobile apps should continue working. Verify:
1. JWT token is valid
2. Token is sent in `Authorization: Bearer <token>` header
3. User has admin role

### Issue: Session not persisting

**Solution:** 
1. Clear browser cookies
2. Check `NEXTAUTH_URL` matches your domain
3. In production, ensure `secure: true` for cookies

---

## 🔄 Migration Notes

### No Migration Required for Mobile Apps

Mobile apps continue working without any changes. The JWT authentication flow is unchanged.

### Web Admin Users

Web admin users will need to:
1. Log out if currently logged in (old JWT cookies will be cleared)
2. Log back in via `/auth/login`
3. NextAuth session will be created

---

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [NextAuth Credentials Provider](https://next-auth.js.org/providers/credentials)
- [NextAuth Session Strategy](https://next-auth.js.org/configuration/options#session)

---

## 🎯 Next Steps (Optional Enhancements)

### Add OAuth Providers

You can add Google, GitHub, or other OAuth providers:

```typescript
// In app/api/auth/[...nextauth]/route.ts
import GoogleProvider from "next-auth/providers/google"

providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
  // ... existing credentials provider
]
```

### Add Two-Factor Authentication

Implement 2FA for admin users:
- Use authenticator apps (TOTP)
- SMS-based verification
- Email-based verification

### Session Management

Add admin session management:
- View active sessions
- Revoke sessions remotely
- Session history logs

---

## ✅ Checklist

Before deploying to production:

- [ ] Generate production `NEXTAUTH_SECRET`
- [ ] Set production `NEXTAUTH_URL`
- [ ] Test admin login on production domain
- [ ] Verify mobile app still works with JWT
- [ ] Test all admin API endpoints with both auth methods
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Review session duration (currently 7 days)
- [ ] Test logout functionality
- [ ] Verify CSRF protection is working

---

## 📞 Support

If you encounter any issues with NextAuth setup:

1. Check environment variables are set correctly
2. Verify user has admin role in database
3. Check browser console for errors
4. Review server logs for authentication failures

---

**Last Updated:** October 9, 2025
**Version:** 1.0.0

