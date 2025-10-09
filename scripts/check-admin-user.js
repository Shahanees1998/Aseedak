#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdminUser() {
  try {
    console.log('\n🔍 Checking for admin users...\n');

    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true
      }
    });

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found!\n');
      console.log('💡 To create an admin user, run: npm run setup:admin\n');
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):\n`);
      console.log('═'.repeat(70));
      
      adminUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive ? '✅ Yes' : '❌ No'}`);
        console.log(`   Email Verified: ${user.emailVerified ? '✅ Yes' : '❌ No'}`);
        
        if (!user.isActive) {
          console.log('   ⚠️  WARNING: Account is inactive!');
        }
        if (!user.emailVerified) {
          console.log('   ⚠️  WARNING: Email not verified!');
        }
      });
      
      console.log('\n' + '═'.repeat(70));
      console.log('\n✅ You can login with any of the above admin accounts.\n');
    }
    
  } catch (error) {
    console.error('❌ Error checking admin users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();

