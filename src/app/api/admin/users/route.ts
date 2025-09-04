import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@/generated/prisma";
import { generateRandomString } from "better-auth/crypto";
import { withSystemAdmin } from "@/lib/api-auth";

const prisma = new PrismaClient();

export const GET = withSystemAdmin(async (request: NextRequest) => {

    // Parse query parameters for Better Auth listUsers
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    const queryParams = {
      searchValue: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortDirection: searchParams.get('sortDirection') as 'asc' | 'desc' || 'desc',
    };

    const users = await prisma.user.findMany({
      take: queryParams.limit,
      skip: queryParams.offset,
      orderBy: {
        [queryParams.sortBy]: queryParams.sortDirection
      },
      where: queryParams.searchValue ? {
        OR: [
          { email: { contains: queryParams.searchValue, mode: 'insensitive' } },
          { name: { contains: queryParams.searchValue, mode: 'insensitive' } },
        ]
      } : undefined
    });

    const total = await prisma.user.count({
      where: queryParams.searchValue ? {
        OR: [
          { email: { contains: queryParams.searchValue, mode: 'insensitive' } },
          { name: { contains: queryParams.searchValue, mode: 'insensitive' } },
        ]
      } : undefined
    });

    // Transform the data to include organization information
    const enhancedUsers = await Promise.all(
      users.map(async (user) => {
        const memberships = await prisma.member.findMany({
          where: { userId: user.id },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        });

        return {
          ...user,
          organizationCount: memberships.length,
          organizations: memberships.map((membership) => ({
            id: membership.organization.id,
            name: membership.organization.name,
            role: membership.role,
            joinedAt: membership.createdAt
          }))
        };
      })
    );

    return NextResponse.json({
      users: enhancedUsers,
      total,
      limit: queryParams.limit,
      offset: queryParams.offset
    });
});

export const POST = withSystemAdmin(async (request: NextRequest) => {
    // Prepare headers for Better Auth API calls
    const sessionHeaders = new Headers();
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) sessionHeaders.set('cookie', cookieHeader);

    const body = await request.json();
    const { name, email, userType, organizationName, organizationId } = body;

    // Validate required fields
    if (!name || !email || !userType) {
      return NextResponse.json(
        { error: "Name, Email and user type are required" },
        { status: 400 }
      );
    }

    // Determine system role based on userType
    let systemRole: string | undefined;
    switch (userType) {
      case 'admin':
        systemRole = 'admin';
        break;
      case 'owner':
        systemRole = 'owner'; // Business user with organization creation privileges
        break;
      case 'supervisor':
      case 'employee':
        systemRole = 'user'; // Regular user, permissions come from organization role
        break;
      default:
        return NextResponse.json(
          { error: "Invalid user type" },
          { status: 400 }
        );
    }

    // Create user - Better Auth compliant secure temporary password approach
    const temporaryPassword = generateRandomString(32); // Better Auth crypto utility
    const newUserResult = await auth.api.createUser({
      body: {
        email: email,
        name: name,
        password: temporaryPassword, // Secure temporary password (never exposed)
        role: systemRole === 'admin' ? 'admin' : undefined,
      }
    });

    // Better Auth signUpEmail returns the user directly
    if (!newUserResult?.user?.id) {
      throw new Error("Failed to create user - no user returned");
    }
    
    const newUser = newUserResult.user;

    // Trigger password reset flow - Better Auth secure password setup
    const resetResult = await auth.api.forgetPassword({
      body: {
        email: email,
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/set-username`
      }
    });

    if (!resetResult.status) {
      console.error('Failed to send password reset email');
    }

    // Handle organization-related logic
    let organizationData = null;
    
    if (userType === 'owner' && organizationName) {
      // Owner user: Create new organization
      const orgSlug = organizationName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50);

      // Step 1: Admin creates organization - Better Auth organization plugin
      organizationData = await auth.api.createOrganization({
        body: {
          name: organizationName,
          slug: `${orgSlug}-${Date.now()}`
        },
        headers: sessionHeaders
      });

      console.log('Organization created:', JSON.stringify(organizationData));

      // Better Auth createOrganization returns the organization directly
      if (!organizationData?.id) {
        throw new Error("Organization creation failed: No organization ID returned");
      }

      try {
        // Step 2: Add new user as owner - Better Auth createInvitation method
        await auth.api.createInvitation({
          body: {
            email: newUser.email,
            organizationId: organizationData.id,
            role: "owner"
          },
          headers: sessionHeaders
        });

        // Wrap format for subsequent code usage
        organizationData = { organization: organizationData };

      } catch (memberError) {
        console.error("Organization member operation failed:", memberError);
        // If adding member fails, organization still exists but member relationship might be incorrect
        throw new Error(`Organization created but member setup failed: ${memberError instanceof Error ? memberError.message : 'Unknown error'}`);
      }

    } else if ((userType === 'supervisor' || userType === 'employee') && organizationId) {
      // Supervisor/Employee: Join existing organization
      await auth.api.createInvitation({
        body: {
          email: email,
          organizationId: organizationId,
          role: userType
        },
        headers: sessionHeaders
      });
    }

    // Send Magic Link to new user - Better Auth magic link method
    await auth.api.signInMagicLink({
      body: {
        email: email,
        callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/set-username`
      },
      headers: sessionHeaders
    });

    // Return success message based on user type
    const userTypeNames = {
      admin: 'System Administrator',
      owner: 'Business User',
      supervisor: 'Organization Supervisor',
      employee: 'Organization Employee'
    };

    const successMessage = organizationData 
      ? `${userTypeNames[userType as keyof typeof userTypeNames]} ${name} created successfully, organization "${organizationName}" has been created, setup link sent to ${email}`
      : `${userTypeNames[userType as keyof typeof userTypeNames]} ${name} created successfully, setup link sent to ${email}`;

    return NextResponse.json({
      success: true,
      message: successMessage,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: systemRole,
      },
      organization: organizationData || null
    });
});