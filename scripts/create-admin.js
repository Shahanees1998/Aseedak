const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@yopmail.com' }
    })

    if (existingAdmin) {
      console.log('❌ Admin user already exists!')
      return
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('Admin123!', 12)

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@yopmail.com',
        password: hashedPassword,
        firstName: 'admin',
        lastName: 'aseedak',
        username: 'admin_aseedak',
        role: 'ADMIN',
        avatar: 'IMAGE1',
        isActive: true,
        emailVerified: true, // Skip email verification for admin
        gamesPlayed: 0,
        gamesWon: 0,
        totalKills: 0
      }
    })

    console.log('✅ Admin user created successfully!')
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

  } catch (error) {
    console.error('❌ Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createAdminUser()
