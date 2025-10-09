import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Admin routes - require admin role
    if (path.startsWith('/admin')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
      
      if (token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/auth/login?error=access-denied', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // Public paths - allow access
        if (
          path.startsWith('/auth/') ||
          path.startsWith('/api/auth/') ||
          path.startsWith('/api/mobile/') ||
          path.startsWith('/_next/') ||
          path.startsWith('/static/') ||
          path === '/' ||
          path === '/favicon.ico'
        ) {
          return true
        }

        // Admin routes - require admin role
        if (path.startsWith('/admin')) {
          return !!token && token.role === 'ADMIN'
        }

        // Default - allow if authenticated
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - API routes that should remain open
     */
    '/((?!_next/static|_next/image|favicon.ico|public|images|api/mobile|api/auth).*)',
  ],
}

