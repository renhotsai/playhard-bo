import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/generated/prisma';
import { auth } from '@/lib/auth';
import { isSystemAdmin } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = params;
    const hasSystemAdminAccess = isSystemAdmin(session.user?.role);

    // Check if user has access to this organization
    if (!hasSystemAdminAccess) {
      const userOrganizations = await auth.api.listUserOrganizations({
        headers: request.headers,
      });
      
      const hasAccess = userOrganizations?.some(org => org.id === organizationId);
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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