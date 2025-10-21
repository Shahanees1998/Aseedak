import { NextRequest, NextResponse } from 'next/server'
import { checkAndExpireOldRooms, getRoomExpirationStats } from '@/lib/roomExpiration'
import prisma from '@/lib/prisma'


export async function GET(request: NextRequest) {
  try {
    // Get current stats before expiration check
    const statsBefore = await getRoomExpirationStats()
    
    // Check for and expire old rooms
    await checkAndExpireOldRooms()
    
    // Get stats after expiration check
    const statsAfter = await getRoomExpirationStats()
    
    // Get all rooms with their status and timing info
    const allRooms = await prisma.gameRoom.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    
    // Calculate room ages
    const roomsWithAge = allRooms.map(room => {
      const now = new Date()
      const ageInHours = room.startedAt 
        ? Math.floor((now.getTime() - room.startedAt.getTime()) / (1000 * 60 * 60))
        : null
      
      return {
        ...room,
        ageInHours,
        isExpired: ageInHours !== null && ageInHours >= 24,
        startedAt: room.startedAt?.toISOString(),
        finishedAt: room.finishedAt?.toISOString(),
        createdAt: room.createdAt.toISOString()
      }
    })
    
    return NextResponse.json({
      message: 'Room expiration debug information',
      statsBefore,
      statsAfter,
      recentRooms: roomsWithAge,
      summary: {
        totalRooms: allRooms.length,
        inProgressRooms: allRooms.filter(r => r.status === 'IN_PROGRESS').length,
        expiredRooms: allRooms.filter(r => r.status === 'EXPIRED').length,
        oldInProgressRooms: roomsWithAge.filter(r => r.isExpired && r.status === 'IN_PROGRESS').length
      }
    })
    
  } catch (error) {
    console.error('Room expiration debug error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get room expiration debug information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Force check and expire old rooms
    console.log('🔄 Manually triggering room expiration check...')
    await checkAndExpireOldRooms()
    
    const stats = await getRoomExpirationStats()
    
    return NextResponse.json({
      message: 'Room expiration check completed manually',
      stats
    })
    
  } catch (error) {
    console.error('Manual room expiration error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to manually trigger room expiration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
