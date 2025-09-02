import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isSystemAdmin } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  // Get session and check authentication
  const session = await auth.api.getSession({
    headers: request.headers
  });

  if (!session?.user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  // System admins can see all organizations  
  if (isSystemAdmin(session.user.role || '')) {
    // For system admin: get all organizations with pagination
    const allOrganizations = await auth.api.organization.listOrganizations({
      query: { limit, offset }
    });

    const transformedOrganizations = (allOrganizations?.organizations || []).map((org: {
      id: string;
      name: string;
      slug: string;
      createdAt: string;
      members?: Array<unknown>;
      invitations?: Array<{ status: string }>;
    }) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      createdAt: org.createdAt,
      memberCount: org.members?.length || 0,
      pendingInvitationsCount: org.invitations?.filter((inv) => inv.status === 'pending')?.length || 0,
      members: org.members || [],
      pendingInvitations: org.invitations?.filter((inv) => inv.status === 'pending') || []
    }));

    return NextResponse.json({
      data: transformedOrganizations,
      pagination: {
        page,
        limit,
        total: allOrganizations?.total || 0,
        totalPages: Math.ceil((allOrganizations?.total || 0) / limit),
        hasNext: page * limit < (allOrganizations?.total || 0),
        hasPrev: page > 1
      }
    });
  }

  // Regular users: get their organizations only
  const userOrganizations = await auth.api.listUserOrganizations({
    headers: request.headers
  });

  if (!userOrganizations) {
    return NextResponse.json({
      data: [],
      pagination: {
        page: 1,
        limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    });
  }

  // Transform the data to match our expected format
  const transformedOrganizations = userOrganizations.map((org: { 
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    members?: Array<unknown>;
    invitations?: Array<{ status: string }>;
  }) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    createdAt: org.createdAt,
    memberCount: org.members?.length || 0,
    pendingInvitationsCount: org.invitations?.filter((inv) => inv.status === 'pending')?.length || 0,
    members: org.members || [],
    pendingInvitations: org.invitations?.filter((inv) => inv.status === 'pending') || []
  }));

  // Apply pagination to user organizations
  const total = transformedOrganizations.length;
  const paginatedData = transformedOrganizations.slice(offset, offset + limit);

  return NextResponse.json({
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  });
}