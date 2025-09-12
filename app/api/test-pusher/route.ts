import { NextRequest, NextResponse } from 'next/server'
import { pusher } from '@/lib/pusher'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Pusher configuration...')
    
    // Test basic configuration
    const config = {
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET ? 'Set (hidden)' : 'Missing',
      cluster: process.env.PUSHER_CLUSTER
    }
    
    console.log('📊 Pusher Config:', config)
    
    // Test Pusher trigger
    if (!pusher) {
      return NextResponse.json({
        success: false,
        message: 'Pusher is not configured - missing environment variables',
        config: {
          appId: config.appId,
          key: config.key,
          cluster: config.cluster,
          secret: config.secret
        }
      })
    }

    try {
      await pusher.trigger('test-channel', 'test-event', {
        message: 'Test message from Aseedak',
        timestamp: new Date().toISOString()
      })
      
      console.log('✅ Pusher trigger successful')
      
      return NextResponse.json({
        success: true,
        message: 'Pusher is working correctly',
        config: {
          appId: config.appId,
          key: config.key,
          cluster: config.cluster,
          secret: config.secret
        }
      })
    } catch (triggerError: any) {
      console.error('❌ Pusher trigger failed:', triggerError)
      
      return NextResponse.json({
        success: false,
        message: 'Pusher trigger failed',
        error: {
          name: triggerError.name,
          message: triggerError.message,
          status: triggerError.status,
          body: triggerError.body
        },
        config: {
          appId: config.appId,
          key: config.key,
          cluster: config.cluster,
          secret: config.secret
        }
      })
    }
    
  } catch (error) {
    console.error('❌ Pusher test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Pusher test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
