import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, JWTPayload } from './jwt';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * DUAL AUTH MIDDLEWARE
 * Supports both JWT (mobile app) and NextAuth (web admin panel)
 * Priority: JWT Bearer Token → JWT Cookie → NextAuth Session
 */
export async function withAuth(
  req: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    let user: JWTPayload | null = null;

    // METHOD 1: Try JWT from Authorization header (MOBILE - Priority)
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        user = await verifyJWT(token);
      } catch (error) {
        console.error('JWT Bearer token verification failed:', error);
      }
    }
    
    // METHOD 2: Try JWT from cookies (legacy web behavior)
    if (!user) {
      const cookieToken = req.cookies.get('token')?.value;
      if (cookieToken) {
        try {
          user = await verifyJWT(cookieToken);
        } catch (error) {
          console.error('JWT cookie token verification failed:', error);
        }
      }
    }
    
    // METHOD 3: Try NextAuth session (NEW - for admin panel)
    if (!user) {
      try {
        const session = await getServerSession(authOptions);
        if (session?.user) {
          user = {
            userId: session.user.id,
            email: session.user.email!,
            role: session.user.role
          };
        }
      } catch (error) {
        console.error('NextAuth session verification failed:', error);
      }
    }
    
    // If no authentication method worked
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Add user to request
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = user;

    return await handler(authenticatedReq);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
}

/**
 * Middleware to protect admin-only API routes
 */
export async function withAdminAuth(
  req: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(req, async (authenticatedReq) => {
    if (!authenticatedReq.user || authenticatedReq.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return await handler(authenticatedReq);
  });
}

/**
 * Get token from request (supports both cookies and headers)
 */
function getTokenFromRequest(req: NextRequest): string | null {
  // First try to get from Authorization header (for mobile clients)
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Then try to get from cookies (for web clients)
  const token = req.cookies.get('token')?.value;
  return token || null;
}
