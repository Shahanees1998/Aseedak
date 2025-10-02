import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from './authMiddleware'
import { checkAndExpireOldRooms } from './roomExpiration'

/**
 * Enhanced middleware that combines authentication and room expiration checking
 * Use this for API routes that need both authentication and automatic room cleanup
 */
export async function withAuthAndExpiration(
  req: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // First check for expired rooms
  await checkAndExpireOldRooms()
  
  // Then proceed with authentication
  return withAuth(req, handler)
}

/**
 * Middleware for public API routes that only need room expiration checking
 * Use this for API routes that don't require authentication but should check for expired rooms
 */
export async function withExpiration(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Check for expired rooms first
  await checkAndExpireOldRooms()
  
  // Then execute the original handler
  return await handler(req)
}

/**
 * Middleware for authenticated routes that need room expiration checking
 * This is an alias for withAuthAndExpiration for better readability
 */
export const withAuthAndRoomCleanup = withAuthAndExpiration
