import { NextRequest } from 'next/server'
import { verifyJWT } from './jwt'

export interface AuthenticatedUser {
  userId: string
  email: string
  role: string
}

export async function verifyToken(request: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    return await verifyJWT(token)
  } catch (error) {
    return null
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await verifyToken(request)
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  return await verifyToken(request)
}