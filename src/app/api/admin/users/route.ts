import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('[Admin Users API] Request received:', {
      url: request.url,
      method: request.method,
      headers: {
        'user-agent': request.headers.get('user-agent'),
        'cookie': request.headers.get('cookie') ? 'present' : 'missing',
        'content-type': request.headers.get('content-type'),
        'origin': request.headers.get('origin')
      }
    });

    // Convert NextRequest headers to a proper Headers object for Better Auth
    const sessionHeaders = new Headers();
    
    // Copy all relevant headers
    const cookieHeader = request.headers.get('cookie');
    const authHeader = request.headers.get('authorization');
    const userAgentHeader = request.headers.get('user-agent');
    const originHeader = request.headers.get('origin');
    
    if (cookieHeader) sessionHeaders.set('cookie', cookieHeader);
    if (authHeader) sessionHeaders.set('authorization', authHeader);
    if (userAgentHeader) sessionHeaders.set('user-agent', userAgentHeader);
    if (originHeader) sessionHeaders.set('origin', originHeader);
    
    console.log('[Admin Users API] Session headers prepared:', {
      hasCookie: !!cookieHeader,
      hasAuth: !!authHeader,
      hasUserAgent: !!userAgentHeader,
      hasOrigin: !!originHeader
    });

    // Verify admin session with proper headers format
    const session = await auth.api.getSession({
      headers: sessionHeaders,
    });

    console.log('[Admin Users API] Session check result:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userRole: session?.user?.role,
      userId: session?.user?.id,
      sessionId: session?.session?.id,
      userEmail: session?.user?.email,
      sessionExpiry: session?.session?.expiresAt ? new Date(session.session.expiresAt).toISOString() : 'unknown'
    });

    if (!session?.user) {
      console.log('[Admin Users API] Authentication failed - no session or user');
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user has system admin privileges
    if (session.user.role !== 'admin') {
      console.log(`[Admin Users API] Authorization failed - user role ${session.user.role} is not admin`);
      return NextResponse.json(
        { error: "System admin privileges required" },
        { status: 403 }
      );
    }

    console.log('[Admin Users API] Admin privileges verified, proceeding with user listing');

    // Parse query parameters for Better Auth listUsers
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    const queryParams = {
      searchValue: searchParams.get('search') || undefined,
      searchField: searchParams.get('searchField') as 'email' | 'name' || undefined,
      searchOperator: searchParams.get('searchOperator') as 'contains' | 'starts_with' | 'ends_with' || 'contains',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortDirection: searchParams.get('sortDirection') as 'asc' | 'desc' || 'desc',
      filterField: searchParams.get('filterField') || undefined,
      filterValue: searchParams.get('filterValue') || undefined,
      filterOperator: searchParams.get('filterOperator') as 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte' || undefined,
    };

    console.log('[Admin Users API] Query parameters:', queryParams);

    // 由于Better Auth admin插件的权限问题，直接使用Prisma查询用户
    // 这样可以绕过Better Auth的权限检查，因为我们已经在上面验证了admin权限
    console.log('[Admin Users API] Using direct Prisma query instead of Better Auth listUsers');

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

    console.log('[Admin Users API] Prisma query result:', {
      userCount: users.length,
      total
    });

    // Transform the data to include organization information using Prisma
    const enhancedUsers = await Promise.all(
      users.map(async (user) => {
        try {
          // Get user's organization memberships with Prisma
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
        } catch (error) {
          console.error(`Failed to fetch organizations for user ${user.id}:`, error);
          return {
            ...user,
            organizationCount: 0,
            organizations: []
          };
        }
      })
    );

    const response = {
      users: enhancedUsers,
      total: total,
      // Return the requested pagination values
      limit: queryParams.limit,
      offset: queryParams.offset
    };

    console.log('[Admin Users API] Returning response:', {
      userCount: response.users.length,
      total: response.total,
      limit: response.limit,
      offset: response.offset
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error("[Admin Users API] Unexpected error:", error);
    
    // Handle specific Better Auth errors
    if (error instanceof Error) {
      console.error("[Admin Users API] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      if (error.message.includes("unauthorized") || error.message.includes("admin")) {
        return NextResponse.json(
          { error: "System admin privileges required" },
          { status: 403 }
        );
      }

      // Return specific error message for debugging
      return NextResponse.json(
        { error: `Server error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Admin Users API] POST request received');
    
    // 1. Prepare headers for Better Auth session validation
    const sessionHeaders = new Headers();
    const cookieHeader = request.headers.get('cookie');
    const authHeader = request.headers.get('authorization');
    const userAgentHeader = request.headers.get('user-agent');
    
    if (cookieHeader) sessionHeaders.set('cookie', cookieHeader);
    if (authHeader) sessionHeaders.set('authorization', authHeader);
    if (userAgentHeader) sessionHeaders.set('user-agent', userAgentHeader);
    
    // 驗證當前用戶權限
    const session = await auth.api.getSession({
      headers: sessionHeaders
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // 檢查是否有系統管理員權限 (admin 或 owner 都可以創建用戶)
    if (session.user.role !== 'admin' && session.user.role !== 'owner') {
      return NextResponse.json(
        { error: "系統管理員權限不足" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, userType, organizationName, organizationId } = body;

    // 2. 驗證輸入參數
    if (!name || !email || !userType) {
      return NextResponse.json(
        { error: "姓名、Email 和用戶類型為必填項目" },
        { status: 400 }
      );
    }

    // 3. 根據 userType 決定系統角色
    let systemRole: string | undefined;
    switch (userType) {
      case 'admin':
        systemRole = 'admin';
        break;
      case 'owner':
        systemRole = 'owner'; // 具備創建組織權限的商業用戶
        break;
      case 'supervisor':
      case 'employee':
        systemRole = 'user'; // 一般用戶，權限來自組織角色
        break;
      default:
        return NextResponse.json(
          { error: "無效的用戶類型" },
          { status: 400 }
        );
    }

    // 4. 創建用戶 - Better Auth signUpEmail method (correct API pattern)
    const newUserResult = await auth.api.signUpEmail({
      body: {
        email: email,
        password: "TempPassword123!", // 臨時密碼，用戶透過 Magic Link 登入後會設置新密碼
        name: name,
      }
    });

    // Better Auth signUpEmail returns the user directly
    if (!newUserResult?.user?.id) {
      throw new Error("Failed to create user - no user returned");
    }
    
    const newUser = newUserResult.user;

    // 5. 使用Prisma直接更新用戶角色 (Better Auth doesn't support role in signUpEmail)
    if (systemRole) {
      await prisma.user.update({
        where: { id: newUser.id },
        data: { role: systemRole }
      });
    }

    // 6. 處理組織相關邏輯
    let organizationData = null;
    
    if (userType === 'owner' && organizationName) {
      // Owner 用戶：創建新組織
      const orgSlug = organizationName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50);

      // Step 1: Admin 創建組織 - Better Auth organization plugin
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
        throw new Error("組織創建失敗：未返回組織 ID");
      }

      try {
        // Step 2: 將新用戶添加為 owner - Better Auth createInvitation method
        await auth.api.createInvitation({
          body: {
            email: newUser.email,
            organizationId: organizationData.id,
            role: "owner"
          },
          headers: sessionHeaders
        });

        // 包裝格式以符合後續代碼使用
        organizationData = { organization: organizationData };

      } catch (memberError) {
        console.error("組織成員操作失敗:", memberError);
        // 如果添加成員或離開組織失敗，組織仍然存在但成員關係可能不正確
        // 可以考慮是否需要刪除組織或記錄錯誤狀態
        throw new Error(`組織創建成功但成員設定失敗: ${memberError instanceof Error ? memberError.message : '未知錯誤'}`);
      }

    } else if ((userType === 'supervisor' || userType === 'employee') && organizationId) {
      // Supervisor/Employee：加入現有組織
      await auth.api.createInvitation({
        body: {
          email: email,
          organizationId: organizationId,
          role: userType
        },
        headers: sessionHeaders
      });
    }

    // 6. 發送 Magic Link 給新用戶 - Better Auth magic link method
    await auth.api.signInMagicLink({
      body: {
        email: email,
        callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/set-username`
      },
      headers: sessionHeaders
    });

    // 7. 根據用戶類型返回成功訊息
    const userTypeNames = {
      admin: '系統管理員',
      owner: '商業用戶',
      supervisor: '組織主管',
      employee: '組織員工'
    };

    const successMessage = organizationData 
      ? `${userTypeNames[userType as keyof typeof userTypeNames]} ${name} 建立成功，組織 "${organizationName}" 已創建，設置連結已發送至 ${email}`
      : `${userTypeNames[userType as keyof typeof userTypeNames]} ${name} 建立成功，設置連結已發送至 ${email}`;

    return NextResponse.json({
      success: true,
      message: successMessage,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: systemRole, // Use the systemRole we set earlier
      },
      organization: organizationData || null
    });

  } catch (error) {
    console.error("Admin create user error:", error);
    
    // 處理特定錯誤
    if (error instanceof Error) {
      if (error.message.includes("already exists") || error.message.includes("duplicate")) {
        return NextResponse.json({ 
          error: "此 Email 地址已被使用" 
        }, { status: 409 });
      }

      if (error.message.includes("organization") && error.message.includes("slug")) {
        return NextResponse.json({ 
          error: "組織名稱已被使用，請選擇不同的名稱" 
        }, { status: 409 });
      }
    }

    return NextResponse.json({ 
      error: "建立用戶失敗，請稍後再試" 
    }, { status: 500 });
  }
}