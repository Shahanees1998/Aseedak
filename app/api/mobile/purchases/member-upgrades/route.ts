import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/jwt-auth'

const prisma = new PrismaClient()

// Define available member upgrade tiers
const MEMBER_UPGRADES = [
  { maxMembers: 6, price: 299, name: 'Basic Plus', description: 'Upgrade to 6 members' },
  { maxMembers: 8, price: 499, name: 'Standard', description: 'Upgrade to 8 members' },
  { maxMembers: 12, price: 799, name: 'Premium', description: 'Upgrade to 12 members' },
  { maxMembers: 16, price: 1199, name: 'Pro', description: 'Upgrade to 16 members' },
  { maxMembers: 20, price: 1599, name: 'Ultimate', description: 'Upgrade to 20 members' }
]

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's current max members
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { maxMembers: true }
    })

    if (!userData) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Filter available upgrades (only show higher tiers)
    const availableUpgrades = MEMBER_UPGRADES.filter(
      upgrade => upgrade.maxMembers > userData.maxMembers
    )

    return NextResponse.json({
      currentMaxMembers: userData.maxMembers,
      availableUpgrades
    })

  } catch (error) {
    console.error('Error fetching member upgrades:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
