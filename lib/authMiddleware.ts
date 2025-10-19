import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, JWTPayload } from './jwt';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * OPTIMIZED DUAL AUTH MIDDLEWARE
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
        // If JWT valid, skip other checks (FAST PATH for mobile)
        if (user) {
          const authenticatedReq = req as AuthenticatedRequest;
          authenticatedReq.user = user;
          return await handler(authenticatedReq);
        }
      } catch (error) {
        // JWT invalid, continue to other methods
      }
    }
    
    // METHOD 2: Try JWT from cookies (legacy web behavior)
    if (!user) {
      const cookieToken = req.cookies.get('token')?.value;
      if (cookieToken) {
        try {
          user = await verifyJWT(cookieToken);
          // If JWT valid, skip NextAuth check (FAST PATH)
          if (user) {
            const authenticatedReq = req as AuthenticatedRequest;
            authenticatedReq.user = user;
            return await handler(authenticatedReq);
          }
        } catch (error) {
          // JWT invalid, continue to NextAuth
        }
      }
    }
    
    // METHOD 3: Try NextAuth session (ONLY if no JWT found)
    // This is the slow path, only for web admin without JWT
    if (!user) {
      // Only check NextAuth if there's a next-auth session cookie
      const hasNextAuthCookie = req.cookies.get('next-auth.session-token') || 
                               req.cookies.get('__Secure-next-auth.session-token');
      
      if (hasNextAuthCookie) {
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
          // NextAuth session invalid
        }
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
