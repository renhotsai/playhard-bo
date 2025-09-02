import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js Middleware for Better Auth
 * Follows Next.js 15 best practices
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check Better Auth session cookie
  const sessionToken = request.cookies.get("better-auth.session_token");
  const isAuthenticated = !!sessionToken?.value;
  
  // Handle protected routes
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin routes require system admin role
    if (pathname.startsWith("/dashboard/admin")) {
      // For admin routes, we need to validate the session on server side
      // Since we can't decode the session here, we'll let the API handle validation
      // and redirect if needed. The UI will also hide admin sections for non-admins.
    }
  }
  
  // Redirect authenticated users from root to dashboard
  if (pathname === "/" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  // Redirect unauthenticated users from root to login
  if (pathname === "/" && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Optimize matcher to follow Next.js recommendations
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
