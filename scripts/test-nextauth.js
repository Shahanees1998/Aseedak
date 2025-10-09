#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🔧 NextAuth Configuration Test\n');
console.log('═'.repeat(70));

// Check .env file
const envPath = path.join(__dirname, '..', '.env');
let envVars = {};

if (fs.existsSync(envPath)) {
  console.log('✅ .env file exists\n');
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim();
    }
  });
  
  // Check NEXTAUTH_URL
  if (envVars.NEXTAUTH_URL) {
    console.log(`✅ NEXTAUTH_URL: ${envVars.NEXTAUTH_URL}`);
  } else {
    console.log('❌ NEXTAUTH_URL: NOT SET');
    console.log('   Add: NEXTAUTH_URL="http://localhost:3000"');
  }
  
  // Check NEXTAUTH_SECRET
  if (envVars.NEXTAUTH_SECRET && envVars.NEXTAUTH_SECRET !== '"your-nextauth-secret-key-here-minimum-32-characters"') {
    console.log('✅ NEXTAUTH_SECRET: SET (length: ' + envVars.NEXTAUTH_SECRET.replace(/"/g, '').length + ' chars)');
    
    const secret = envVars.NEXTAUTH_SECRET.replace(/"/g, '');
    if (secret.length < 32) {
      console.log('   ⚠️  WARNING: Secret should be at least 32 characters!');
    }
  } else {
    console.log('❌ NEXTAUTH_SECRET: NOT SET OR USING DEFAULT');
    console.log('   Run: npm run generate:secret');
  }
  
  // Check JWT_SECRET
  if (envVars.JWT_SECRET) {
    console.log('✅ JWT_SECRET: SET (for mobile app)');
  } else {
    console.log('❌ JWT_SECRET: NOT SET');
  }
  
  // Check DATABASE_URL
  if (envVars.DATABASE_URL) {
    console.log('✅ DATABASE_URL: SET');
  } else {
    console.log('❌ DATABASE_URL: NOT SET');
  }
  
} else {
  console.log('❌ .env file NOT FOUND!\n');
  console.log('   Create .env file from env.example:');
  console.log('   cp env.example .env');
}

console.log('\n' + '═'.repeat(70));

// Check if node_modules has next-auth
const nextAuthPath = path.join(__dirname, '..', 'node_modules', 'next-auth');
if (fs.existsSync(nextAuthPath)) {
  console.log('✅ next-auth package installed');
} else {
  console.log('❌ next-auth package NOT FOUND');
  console.log('   Run: npm install');
}

// Check if NextAuth route exists
const nextAuthRoutePath = path.join(__dirname, '..', 'app', 'api', 'auth', '[...nextauth]', 'route.ts');
if (fs.existsSync(nextAuthRoutePath)) {
  console.log('✅ NextAuth API route exists');
} else {
  console.log('❌ NextAuth API route NOT FOUND');
}

// Check if middleware exists
const middlewarePath = path.join(__dirname, '..', 'middleware.ts');
if (fs.existsSync(middlewarePath)) {
  console.log('✅ Middleware file exists');
} else {
  console.log('❌ Middleware file NOT FOUND');
}

console.log('═'.repeat(70));

// Summary
const hasEnv = fs.existsSync(envPath);
const hasNextAuthUrl = envVars.NEXTAUTH_URL ? true : false;
const hasNextAuthSecret = envVars.NEXTAUTH_SECRET && envVars.NEXTAUTH_SECRET !== '"your-nextauth-secret-key-here-minimum-32-characters"';
const hasNextAuthInstalled = fs.existsSync(nextAuthPath);
const hasNextAuthRoute = fs.existsSync(nextAuthRoutePath);

if (hasEnv && hasNextAuthUrl && hasNextAuthSecret && hasNextAuthInstalled && hasNextAuthRoute) {
  console.log('\n✅ NextAuth is properly configured!\n');
  console.log('You can now:');
  console.log('1. Run: npm run dev');
  console.log('2. Visit: http://localhost:3000/auth/login');
  console.log('3. Login with your admin credentials\n');
} else {
  console.log('\n⚠️  NextAuth configuration incomplete!\n');
  console.log('To fix:');
  if (!hasEnv) {
    console.log('1. Create .env file: cp env.example .env');
  }
  if (!hasNextAuthSecret) {
    console.log('2. Generate secret: npm run generate:secret');
    console.log('3. Add secret to .env file');
  }
  if (!hasNextAuthUrl) {
    console.log('4. Add NEXTAUTH_URL to .env file');
  }
  if (!hasNextAuthInstalled) {
    console.log('5. Install packages: npm install');
  }
  console.log('\n');
}

