import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    
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
    const { email, role = 'member' } = body;

    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }

    // Create invitation using Better Auth's organization API
    const invitationResult = await auth.api.createInvitation({
      body: {
        email,
        organizationId,
        role
      },
      headers: request.headers
    });

    return NextResponse.json({
      success: true,
      invitation: invitationResult
    });

  } catch (error) {
    console.error('Invite user error:', error);
    return NextResponse.json({ 
      error: 'Failed to send invitation' 
    }, { status: 500 });
  }
}