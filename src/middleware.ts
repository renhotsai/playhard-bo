import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { isSystemAdmin } from "@/lib/permissions";

/**
 * Next.js Middleware for Better Auth with proper session validation
 * Follows Next.js 15 and Better Auth best practices
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth', '/set-username'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  try {
    // PROPER Better Auth session validation
    const session = await auth.api.getSession({
      headers: request.headers
    });

    // If no valid session, redirect to login
    if (!session?.user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin routes require system admin role
    if (pathname.startsWith("/dashboard/admin")) {
      if (!isSystemAdmin(session.user.role)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Redirect authenticated users from root to dashboard
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
    
  } catch (error) {
    // Session validation failed, redirect to login
    console.error("Session validation error:", error);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
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
