import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, JWTPayload } from './jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Middleware to protect API routes
 * Validates JWT token from cookies (web) or Authorization header (mobile)
 */
export async function withAuth(
  req: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const token = getTokenFromRequest(req);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the token
    const payload = await verifyJWT(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Add user to request
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = payload;

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
