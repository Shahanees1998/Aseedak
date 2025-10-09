import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyJWT } from '@/lib/jwt'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth.config'

const prisma = new PrismaClient()

/**
 * DUAL AUTH SUPPORT
 * This endpoint supports both:
 * 1. JWT Bearer Token (mobile app using jose)
 * 2. JWT Cookie (legacy web)
 * 3. NextAuth Session (new webapp)
 */
export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null;

    // METHOD 1: Try JWT from Authorization header (MOBILE - Priority)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const decoded = await verifyJWT(token)
        if (decoded) {
          userId = decoded.userId
          console.log('✅ Authenticated via JWT Bearer (mobile)')
        }
      } catch (error) {
        console.log('JWT Bearer verification failed:', error)
      }
    }

    // METHOD 2: Try JWT from cookie (legacy web)
    if (!userId) {
      const cookieToken = request.cookies.get('token')?.value
      if (cookieToken) {
        try {
          const decoded = await verifyJWT(cookieToken)
          if (decoded) {
            userId = decoded.userId
            console.log('✅ Authenticated via JWT Cookie (legacy)')
          }
        } catch (error) {
          console.log('JWT Cookie verification failed:', error)
        }
      }
    }

    // METHOD 3: Try NextAuth session (new webapp)
    if (!userId) {
      try {
        const session = await getServerSession(authOptions)
        if (session?.user?.id) {
          userId = session.user.id
          console.log('✅ Authenticated via NextAuth Session (webapp)')
        }
      } catch (error) {
        console.log('NextAuth session verification failed:', error)
      }
    }

    // If no authentication method worked
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        profileImage: user.profileImageUrl,
        avatar: user.avatar,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        totalKills: user.totalKills,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        status: user.isActive ? 'active' : 'inactive'
      }
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
