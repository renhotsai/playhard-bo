import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@/generated/prisma";
import { isSystemAdmin } from "@/lib/permissions";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { organizationId } = params;

    // Check if user is system admin or member of the organization
    const isAdmin = isSystemAdmin(session.user.role);
    
    if (!isAdmin) {
      // For non-admin users, verify they're a member of the organization
      const membership = await prisma.member.findFirst({
        where: {
          userId: session.user.id,
          organizationId: organizationId
        }
      });

      if (!membership) {
        return NextResponse.json(
          { error: "Forbidden: Not a member of this organization" },
          { status: 403 }
        );
      }
    }

    // Fetch organization members with user details
    const members = await prisma.member.findMany({
      where: {
        organizationId: organizationId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            image: true,
            emailVerified: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      members,
      total: members.length
    });

  } catch (error) {
    console.error("Error fetching organization members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}