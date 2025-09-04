/**
 * API Authentication Utilities
 * 
 * Centralized authentication and authorization helpers for API routes.
 * Eliminates code duplication across multiple API endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isSystemAdmin } from '@/lib/permissions';

// Custom API Error class for consistent error handling
export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Session type for better TypeScript support
export type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

/**
 * Require authentication for API route
 * Throws ApiError if authentication fails
 */
export async function requireAuth(request: NextRequest): Promise<NonNullable<AuthSession>> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    throw new ApiError('Authentication required', 401);
  }

  return session;
}

/**
 * Require system admin access for API route
 * Throws ApiError if user is not a system admin
 */
export async function requireSystemAdmin(request: NextRequest): Promise<NonNullable<AuthSession>> {
  const session = await requireAuth(request);

  if (!isSystemAdmin(session.user.role)) {
    throw new ApiError('System admin access required', 403);
  }

  return session;
}

/**
 * Check organization access for the current user
 * Supports both system admins (access to all) and organization members
 */
export async function requireOrganizationAccess(
  request: NextRequest,
  organizationId: string
): Promise<NonNullable<AuthSession>> {
  const session = await requireAuth(request);

  // System admins have access to all organizations
  if (isSystemAdmin(session.user.role)) {
    return session;
  }

  // Check if user has access to this specific organization
  const hasAccess = session.session?.activeOrganizationId === organizationId;
  
  if (!hasAccess) {
    // Try to get organization details to verify membership
    try {
      const orgDetails = await auth.api.getFullOrganization({
        headers: request.headers,
        query: {
          organizationId: organizationId
        }
      });
      
      if (!orgDetails) {
        throw new ApiError('Access denied to this organization', 403);
      }
    } catch {
      throw new ApiError('Access denied to this organization', 403);
    }
  }

  return session;
}

/**
 * Higher-order function to wrap API route handlers with authentication
 * Automatically handles errors and returns proper HTTP responses
 * 
 * @example
 * export const GET = withAuth(async (request, session) => {
 *   // Your API logic here, session is guaranteed to exist
 *   return NextResponse.json({ user: session.user });
 * });
 */
export function withAuth<T extends unknown[]>(
  handler: (request: NextRequest, session: NonNullable<AuthSession>, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const session = await requireAuth(request);
      return await handler(request, session, ...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Higher-order function to wrap API route handlers with system admin authentication
 * 
 * @example
 * export const DELETE = withSystemAdmin(async (request, session) => {
 *   // Admin-only API logic here
 *   return NextResponse.json({ success: true });
 * });
 */
export function withSystemAdmin<T extends unknown[]>(
  handler: (request: NextRequest, session: NonNullable<AuthSession>, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const session = await requireSystemAdmin(request);
      return await handler(request, session, ...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Higher-order function to wrap API route handlers with organization access check
 * 
 * @example
 * export const GET = withOrganizationAccess(async (request, session, { params }) => {
 *   const { organizationId } = await params;
 *   // Organization-scoped API logic here
 *   return NextResponse.json({ organizationId });
 * });
 */
export function withOrganizationAccess<T extends unknown[]>(
  handler: (request: NextRequest, session: NonNullable<AuthSession>, ...args: T) => Promise<NextResponse>
) {
  return async (
    request: NextRequest, 
    ...args: T
  ): Promise<NextResponse> => {
    try {
      // Extract organizationId from the first argument (params)
      const paramsArg = args[0] as { params: Promise<{ organizationId: string }> };
      const { organizationId } = await paramsArg.params;
      
      const session = await requireOrganizationAccess(request, organizationId);
      return await handler(request, session, ...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Centralized error handler for API routes
 * Converts ApiError instances to appropriate HTTP responses
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      { 
        error: error.message,
        code: error.code
      },
      { status: error.status }
    );
  }

  // Handle known Prisma/Database errors
  if (error instanceof Error) {
    if (error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Resource already exists' },
        { status: 409 }
      );
    }
    
    if (error.message.includes('Record not found')) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Generic error fallback
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  // Fallback for unknown errors
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

/**
 * Simple try-catch wrapper for API route handlers
 * Automatically handles and formats errors
 * 
 * @example
 * export async function GET(request: NextRequest) {
 *   return safeApiHandler(async () => {
 *     const data = await someAsyncOperation();
 *     return NextResponse.json(data);
 *   });
 * }
 */
export async function safeApiHandler(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    return handleApiError(error);
  }
}