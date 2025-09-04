import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { auth } from '@/lib/auth';
import { isSystemAdmin } from '@/lib/permissions';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = await params;
    const hasSystemAdminAccess = isSystemAdmin(session.user?.role);

    // Check if user has access to this organization
    if (!hasSystemAdminAccess) {
      // For non-system admins, check if they have access to this organization
      // Better Auth stores the active organization in the session
      const hasAccess = session?.session?.activeOrganizationId === organizationId;
      
      if (!hasAccess) {
        // If not in session, try to get organization details to verify membership
        try {
          const orgDetails = await auth.api.getFullOrganization({
            headers: request.headers,
            query: {
              organizationId: organizationId
            }
          });
          
          // If we can get org details without error, user has access
          if (!orgDetails) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
        } catch {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    // Fetch stores for the organization
    const stores = await prisma.store.findMany({
      where: {
        organizationId: organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ stores });
  } catch (error) {
    console.error('Error fetching organization stores:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}