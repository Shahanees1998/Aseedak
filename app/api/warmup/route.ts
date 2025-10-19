import { NextRequest, NextResponse } from 'next/server'
import { warmupDatabase } from '@/lib/warmup'

/**
 * Warmup endpoint to prevent cold starts
 * 
 * Call this endpoint periodically (every 3-4 minutes) to keep
 * database connections alive and prevent slow first requests
 * 
 * Setup cron job (run every 4 minutes):
 * crontab: 4 minutes interval - curl https://yourdomain.com/api/warmup
 */
export async function GET(request: NextRequest) {
  const result = await warmupDatabase()
  
  return NextResponse.json({
    status: result.success ? 'warm' : 'error',
    message: result.success ? 'Database connections are warm' : 'Warmup failed',
    timestamp: result.timestamp || new Date().toISOString(),
    ...(result.error && { error: result.error })
  })
}

