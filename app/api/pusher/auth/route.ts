import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Pusher from 'pusher'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { socket_id, channel_name } = await request.json()

    // Verify channel name format
    if (!channel_name.startsWith('room-')) {
      return NextResponse.json(
        { message: 'Invalid channel' },
        { status: 400 }
      )
    }

    // Extract room code from channel name
    const roomCode = channel_name.replace('room-', '')
    
    // Verify user has access to this room
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/game-rooms/${roomCode}`, {
      headers: {
        'Authorization': `Bearer ${session.user.id}`
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }

    const authResponse = pusher.authorizeChannel(socket_id, channel_name, {
      user_id: session.user.id,
      user_info: {
        username: session.user.username,
        avatar: session.user.avatar
      }
    })

    return NextResponse.json(authResponse)

  } catch (error) {
    console.error('Pusher auth error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
