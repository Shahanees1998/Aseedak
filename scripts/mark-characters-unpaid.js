const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function markAllCharactersUnpaid() {
  try {
    console.log('🔄 Marking all characters as unpaid (free)...')
    
    const result = await prisma.character.updateMany({
      data: { isPaid: false }
    })
    
    console.log(`✅ Successfully marked ${result.count} characters as unpaid (free)`)
    
    // Show some examples
    const characters = await prisma.character.findMany({
      select: {
        id: true,
        name: true,
        isPaid: true,
        isUnlocked: true,
        price: true
      },
      take: 5
    })
    
    console.log('\n📋 Sample characters:')
    characters.forEach(char => {
      console.log(`- ${char.name}: isPaid=${char.isPaid}, isUnlocked=${char.isUnlocked}, price=${char.price}`)
    })
    
  } catch (error) {
    console.error('❌ Error marking characters as unpaid:', error)
  } finally {
    await prisma.$disconnect()
  }
}

markAllCharactersUnpaid()
