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
    try {
      // For system admin: get all organizations using admin API
      const allOrganizations = await auth.api.listOrganizations({
        headers: request.headers,
      });

      // Better Auth returns data directly, not wrapped
      if (!allOrganizations || allOrganizations.length === 0) {
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

      const transformedOrganizations = allOrganizations.map((org: {
        id: string;
        name: string;
        slug: string;
        createdAt: Date;
        members?: Array<unknown>;
      }) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        createdAt: org.createdAt,
        memberCount: org.members?.length || 0,
        pendingInvitationsCount: 0, // Will be fetched separately if needed
        members: org.members || [],
        pendingInvitations: []
      }));

      // Apply manual pagination to the results
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
    } catch (error) {
      console.error('Error fetching organizations for admin:', error);
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
  }

  // Regular users: get their organizations only
  // Better Auth organization plugin provides user organizations through session context
  let userOrganizations: Array<{
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    members?: Array<unknown>;
  }> = [];
  
  try {
    // Get user's current organization if available in session
    if (session?.session?.activeOrganizationId) {
      const activeOrg = await auth.api.getFullOrganization({
        headers: request.headers,
        query: {
          organizationId: session.session.activeOrganizationId
        }
      });
      
      if (activeOrg) {
        userOrganizations = [activeOrg];
      }
    }
    
    // For Better Auth compliance: Use Prisma to get all user organizations
    // This is the recommended approach when Better Auth doesn't provide the specific API
    const { PrismaClient } = await import("@/generated/prisma");
    const prisma = new PrismaClient();
    
    const membershipOrgs = await prisma.member.findMany({
      where: { userId: session.user.id },
      include: {
        organization: true
      }
    });
    
    // Override previous organizations with complete list from database
    userOrganizations = membershipOrgs.map(member => ({
      id: member.organization.id,
      name: member.organization.name,
      slug: member.organization.slug || '',
      createdAt: member.organization.createdAt,
      members: [] // Will be populated if needed
    }));
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    userOrganizations = [];
  }

  if (!userOrganizations || userOrganizations.length === 0) {
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
  const transformedOrganizations = userOrganizations.filter(org => org != null).map((org: { 
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    members?: Array<unknown>;
  }) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    createdAt: org.createdAt,
    memberCount: org.members?.length || 0,
    pendingInvitationsCount: 0, // Will be fetched separately if needed
    members: org.members || [],
    pendingInvitations: []
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