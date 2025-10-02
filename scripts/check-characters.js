#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkCharacters() {
  try {
    console.log('🔍 Checking characters in database...\n')
    
    // Get all characters
    const allCharacters = await prisma.character.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`📊 Total characters: ${allCharacters.length}`)
    
    if (allCharacters.length === 0) {
      console.log('❌ No characters found in database!')
      console.log('🔧 Creating sample characters...\n')
      
      // Create sample characters
      const sampleCharacters = [
        {
          name: 'Detective',
          description: 'A sharp-eyed detective who notices every detail',
          imageUrl: '/images/characters/detective.png',
          isActive: true,
          isUnlocked: true
        },
        {
          name: 'Spy',
          description: 'A mysterious spy who blends into the shadows',
          imageUrl: '/images/characters/spy.png',
          isActive: true,
          isUnlocked: true
        },
        {
          name: 'Agent',
          description: 'A professional agent with years of experience',
          imageUrl: '/images/characters/agent.png',
          isActive: true,
          isUnlocked: true
        },
        {
          name: 'Investigator',
          description: 'A thorough investigator who never gives up',
          imageUrl: '/images/characters/investigator.png',
          isActive: true,
          isUnlocked: true
        },
        {
          name: 'Sleuth',
          description: 'A clever sleuth who solves mysteries',
          imageUrl: '/images/characters/sleuth.png',
          isActive: true,
          isUnlocked: true
        },
        {
          name: 'Operative',
          description: 'A skilled operative with special training',
          imageUrl: '/images/characters/operative.png',
          isActive: true,
          isUnlocked: true
        }
      ]
      
      for (const charData of sampleCharacters) {
        const character = await prisma.character.create({
          data: charData
        })
        console.log(`✅ Created character: ${character.name} (ID: ${character.id})`)
      }
      
      console.log('\n🎉 Sample characters created successfully!')
    } else {
      console.log('\n📋 Existing characters:')
      allCharacters.forEach((char, index) => {
        console.log(`${index + 1}. ${char.name}`)
        console.log(`   ID: ${char.id}`)
        console.log(`   Active: ${char.isActive}`)
        console.log(`   Unlocked: ${char.isUnlocked}`)
        console.log(`   Image: ${char.imageUrl}`)
        console.log(`   Created: ${char.createdAt}`)
        console.log('')
      })
    }
    
    // Check active characters specifically
    const activeCharacters = await prisma.character.findMany({
      where: { isActive: true }
    })
    
    console.log(`🟢 Active characters: ${activeCharacters.length}`)
    
    if (activeCharacters.length === 0) {
      console.log('⚠️  No active characters found! This will cause character assignment to fail.')
    }
    
  } catch (error) {
    console.error('❌ Error checking characters:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
checkCharacters()


