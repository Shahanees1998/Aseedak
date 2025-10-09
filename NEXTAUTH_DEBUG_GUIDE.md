# NextAuth Login Debugging Guide

## 🔍 Troubleshooting Login Issues

If you're experiencing login issues where the button shows loading but nothing happens, follow these steps:

---

## Step 1: Check Environment Variables

Make sure your `.env` file has these variables:

```bash
# Check if these exist
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
DATABASE_URL="mongodb://localhost:27017/aseedak"
JWT_SECRET="your-jwt-secret"
```

### Generate NEXTAUTH_SECRET if missing:
```bash
npm run generate:secret
```

---

## Step 2: Check Admin Users

Run this command to see all admin users:

```bash
npm run check:admin
```

Expected output:
- ✅ At least one user with `role: 'ADMIN'`
- ✅ `isActive: true`
- ✅ `emailVerified: true`

---

## Step 3: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try logging in
4. Look for these logs:

**Successful login logs:**
```
Attempting login with: admin@yopmail.com
Login result: {ok: true, error: null, status: 200, url: null}
Login successful, redirecting...
```

**Failed login logs:**
```
Attempting login with: admin@yopmail.com
Login result: {ok: false, error: "CredentialsSignin", status: 401, url: null}
```

---

## Step 4: Check Server Console

Look at your terminal running `npm run dev` for these logs:

### Successful Login:
```
🔍 Looking for user: admin@yopmail.com
👤 User found: Yes
📋 User details: {
  id: '...',
  email: 'admin@yopmail.com',
  role: 'ADMIN',
  isActive: true,
  emailVerified: true
}
🔑 Password valid: true
✅ Authorization successful for: admin@yopmail.com
```

### Failed Login (Wrong Password):
```
🔍 Looking for user: admin@yopmail.com
👤 User found: Yes
🔑 Password valid: false
❌ Invalid password, returning null
```

### Failed Login (Not Admin):
```
🔍 Looking for user: user@yopmail.com
👤 User found: Yes
🔑 Password valid: true
❌ User is not admin, role: USER
```

---

## Step 5: Common Issues & Solutions

### Issue 1: "Invalid email or password" (even with correct credentials)

**Possible Causes:**
- Password doesn't match database hash
- User doesn't exist

**Solution:**
```bash
# Reset admin password
npm run setup:admin
# Follow prompts to update password
```

---

### Issue 2: Button loads but nothing happens (no error)

**Possible Causes:**
- `NEXTAUTH_SECRET` not set
- `NEXTAUTH_URL` doesn't match current URL
- Session callback error

**Solution:**

1. Check environment variables:
```bash
# Make sure .env exists and has:
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."  # Must be set!
```

2. Restart dev server:
```bash
# Kill the server (Ctrl+C)
npm run dev
```

3. Clear browser cookies:
- Open DevTools → Application → Cookies
- Delete all cookies for localhost:3000

---

### Issue 3: "Email not verified" error

**Solution:**
```javascript
// In MongoDB or Prisma Studio:
// Find your user and set emailVerified: true

// Or via script:
await prisma.user.update({
  where: { email: 'admin@yopmail.com' },
  data: { emailVerified: true }
})
```

---

### Issue 4: "Account is inactive" error

**Solution:**
```javascript
// In MongoDB or Prisma Studio:
// Find your user and set isActive: true

// Or via script:
await prisma.user.update({
  where: { email: 'admin@yopmail.com' },
  data: { isActive: true }
})
```

---

### Issue 5: "Access denied. Admin privileges required."

**Solution:**
```javascript
// In MongoDB or Prisma Studio:
// Find your user and set role: 'ADMIN'

// Or via script:
await prisma.user.update({
  where: { email: 'admin@yopmail.com' },
  data: { role: 'ADMIN' }
})
```

---

## Step 6: Test Login with Known Credentials

Use one of these admin accounts (from `npm run check:admin`):

```
Email: admin@yopmail.com
Password: [your password]
```

If you don't know the password, reset it:

```bash
npm run setup:admin
```

---

## Step 7: Check Database Connection

```bash
# Test database connection
npx prisma studio
```

This should open Prisma Studio in your browser. If it doesn't:
- Check DATABASE_URL in .env
- Make sure MongoDB is running
- Check network connection

---

## Step 8: Manual Login Test

Try this in browser console on login page:

```javascript
// Test signIn directly
const { signIn } = await import('next-auth/react')

const result = await signIn('credentials', {
  email: 'admin@yopmail.com',
  password: 'your-password',
  redirect: false
})

console.log('Result:', result)
// Should see: {ok: true, error: null, status: 200, url: null}
```

---

## Step 9: Check Middleware

The middleware might be blocking the request. Check `middleware.ts`:

```typescript
// Make sure /auth/login is in the authorized paths
if (
  path.startsWith('/auth/') ||  // ← This should be here
  path.startsWith('/api/auth/')
) {
  return true
}
```

---

## Step 10: Nuclear Option - Fresh Start

If nothing works, try this:

```bash
# 1. Stop the dev server
# Ctrl+C

# 2. Clear Next.js cache
rm -rf .next

# 3. Regenerate Prisma client
npx prisma generate

# 4. Restart dev server
npm run dev

# 5. Clear browser cache & cookies
# In browser: Ctrl+Shift+Delete

# 6. Try logging in again
```

---

## 🐛 Still Not Working?

### Enable Full Debug Mode

1. Update `app/api/auth/[...nextauth]/route.ts`:

```typescript
export const authOptions: NextAuthOptions = {
  // ... existing config
  debug: true,  // ← Make sure this is true
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata)
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      console.log('NextAuth Debug:', code, metadata)
    }
  }
}
```

2. Check server logs for detailed errors

---

## ✅ Successful Login Checklist

When login works correctly, you should see:

- [ ] Form submits and button shows "Signing In..."
- [ ] Browser console shows "Login successful, redirecting..."
- [ ] Server console shows "✅ Authorization successful for: [email]"
- [ ] Page redirects to `/admin`
- [ ] Admin dashboard loads successfully
- [ ] User info appears in top-right corner

---

## 📞 Quick Commands Reference

```bash
# Check admin users
npm run check:admin

# Generate NextAuth secret
npm run generate:secret

# Setup/reset admin
npm run setup:admin

# Check database
npx prisma studio

# Restart dev server
npm run dev
```

---

## 🔐 Test Credentials

After running `npm run check:admin`, you found these admin accounts:

- admin@yopmail.com
- admin1@yopmail.com
- admin11@yopmail.com
- admin22@yopmail.com
- (and more...)

All have `isActive: true` and `emailVerified: true`.

If you don't know the password, run:
```bash
npm run setup:admin
```

---

**Last Updated:** October 9, 2025

