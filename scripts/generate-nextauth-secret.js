#!/usr/bin/env node

const crypto = require('crypto');

console.log('\n🔐 Generating NextAuth Secret...\n');

const secret = crypto.randomBytes(32).toString('base64');

console.log('✅ Your NextAuth Secret:');
console.log('═'.repeat(50));
console.log(secret);
console.log('═'.repeat(50));
console.log('\n📝 Add this to your .env file:\n');
console.log(`NEXTAUTH_SECRET="${secret}"`);
console.log('\n⚠️  Important: Keep this secret secure and never commit it to git!\n');

