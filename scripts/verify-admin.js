const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyAdminUser() {
  try {
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@yopmail.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        avatar: true,
        isActive: true,
        emailVerified: true,
        createdAt: true
      }
    })

    if (adminUser) {
      console.log('✅ Admin user verified successfully!')
      console.log('📋 Admin Details:')
      console.log(`   ID: ${adminUser.id}`)
      console.log(`   Email: ${adminUser.email}`)
      console.log(`   Username: ${adminUser.username}`)
      console.log(`   Name: ${adminUser.firstName} ${adminUser.lastName}`)
      console.log(`   Role: ${adminUser.role}`)
      console.log(`   Avatar: ${adminUser.avatar}`)
      console.log(`   Active: ${adminUser.isActive}`)
      console.log(`   Email Verified: ${adminUser.emailVerified}`)
      console.log(`   Created: ${adminUser.createdAt}`)
    } else {
      console.log('❌ Admin user not found!')
    }

  } catch (error) {
    console.error('❌ Error verifying admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the verification
verifyAdminUser()
