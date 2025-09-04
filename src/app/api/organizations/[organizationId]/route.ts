import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Mock stores data - in real implementation, fetch from database
const mockStores = [
  {
    id: "store-1",
    name: "總店",
    address: "台北市信義區信義路五段7號",
    city: "台北市",
    zipCode: "110",
    phone: "(02) 2345-6789",
    email: "main@example.com",
    isActive: true,
    createdAt: "2024-01-15T00:00:00Z"
  },
  {
    id: "store-2",
    name: "分店一",
    address: "台北市大安區敦化南路二段216號",
    city: "台北市",
    zipCode: "106",
    phone: "(02) 2876-5432",
    email: "branch1@example.com",
    isActive: true,
    createdAt: "2024-02-20T00:00:00Z"
  }
];

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ organizationId: string }> }
) {
  const { organizationId } = await params;
  
  if (!organizationId) {
    return NextResponse.json(
      { error: "Organization ID is required" },
      { status: 400 }
    );
  }

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

  // Get organization details using Better Auth
  // Note: Better Auth may not have getFullOrganization method
  // Use getOrganization or query directly
  let organizationResult;
  
  try {
    // Try using the organization API
    organizationResult = await auth.api.getFullOrganization({
      headers: request.headers,
      query: {
        organizationId: organizationId
      }
    });
  } catch (error) {
    console.error('Error with getFullOrganization:', error);
    // Fallback: you may need to implement this with direct database queries
    // For now, return an error
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 }
    );
  }

  if (!organizationResult) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 }
    );
  }

  // Extract organization data from Better Auth response
  const organization = organizationResult;
  
  // Add owner information from metadata if available
  const ownerInfo = organization.metadata ? {
    id: organization.metadata.ownerId,
    name: organization.metadata.ownerName,
    email: organization.metadata.ownerEmail,
    role: 'owner'
  } : null;

  // Better Auth getFullOrganization already includes members
  const organizationMembers = organization.members || [];

  // Include owner in members list if not already present
  const membersWithOwner = ownerInfo && !organizationMembers.find((m) => m.userId === ownerInfo.id) 
    ? [{
        id: `owner-${ownerInfo.id}`,
        role: 'owner',
        user: {
          id: ownerInfo.id,
          name: ownerInfo.name,
          email: ownerInfo.email
        }
      }, ...organizationMembers]
    : organizationMembers;

  const organizationWithStores = {
    ...organization,
    stores: mockStores, // In real implementation, filter stores by organizationId
    members: membersWithOwner,
    memberCount: membersWithOwner.length,
    owner: ownerInfo
  };

  return NextResponse.json({
    organization: organizationWithStores
  });
}

export async function PATCH(
  request: NextRequest, 
  { params }: { params: Promise<{ organizationId: string }> }
) {
  const { organizationId } = await params;
  
  if (!organizationId) {
    return NextResponse.json(
      { error: "Organization ID is required" },
      { status: 400 }
    );
  }

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

  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json(
      { error: "Valid name is required" },
      { status: 400 }
    );
  }

  // Update organization using Better Auth
  const updatedOrg = await auth.api.updateOrganization({
    headers: request.headers,
    body: {
      organizationId,
      data: {
        name
      }
    }
  });

  if (!updatedOrg) {
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    organization: updatedOrg
  });
}