import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@/generated/prisma";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
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

    // Use Better Auth listUsers with correct API structure
    const result = await auth.api.listUsers({
      query: queryParams,
      headers: request.headers
    });

    if (!result) {
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Transform the data to include organization information using Prisma
    // Since Better Auth doesn't include detailed organization membership data
    const enhancedUsers = await Promise.all(
      result.users.map(async (user) => {
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

    return NextResponse.json({
      users: enhancedUsers,
      total: result.total,
      // Better Auth listUsers doesn't return limit/offset in response
      // These are passed as query params, so we return the requested values
      limit: queryParams.limit,
      offset: queryParams.offset
    });

  } catch (error) {
    console.error("Admin users fetch error:", error);
    
    // Handle specific Better Auth errors
    if (error instanceof Error) {
      if (error.message.includes("unauthorized") || error.message.includes("admin")) {
        return NextResponse.json(
          { error: "System admin privileges required" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. 驗證當前用戶權限
    const session = await auth.api.getSession({
      headers: await headers()
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

    // 4. 創建用戶
    const newUser = await auth.api.createUser({
      body: {
        email: email,
        password: "TempPassword123!", // 臨時密碼，用戶透過 Magic Link 登入後會設置新密碼
        name: name,
        role: systemRole,
      }
    });

    if (!newUser.user) {
      throw new Error("Failed to create user");
    }

    // 5. 處理組織相關邏輯
    let organizationData = null;
    
    if (userType === 'owner' && organizationName) {
      // Owner 用戶：創建新組織
      const orgSlug = organizationName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50);

      // Step 1: Admin 創建組織（admin 自動成為 owner）
      organizationData = await auth.api.createOrganization({
        body: {
          name: organizationName,
          slug: `${orgSlug}-${Date.now()}`,
          keepCurrentActiveOrganization: false,
        },
        headers: await headers(),
      });

	    console.log('org:',JSON.stringify(organizationData))

      // Check for errors first
      if (organizationData.error) {
        throw new Error(`組織創建失敗: ${organizationData.error.message}`);
      }

      // The organization data is in the top-level response, not nested under .organization
      if (!organizationData?.id) {
        throw new Error("組織創建失敗：未返回組織 ID");
      }

      try {
        // Step 2: 將新用戶添加為 owner
        await auth.api.addMember({
          body: {
            userId: newUser.user.id,
            role: ["owner"], // 使用陣列格式
            organizationId: organizationData.id,
          },
        });

        // Step 3: Admin 離開組織，讓新用戶成為唯一 owner
        await auth.api.leaveOrganization({
          body: {
            organizationId: organizationData.id,
          },
          headers: await headers(), // 需要 session cookies
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
          role: userType,
          organizationId: organizationId,
          resend: true,
        }
      });
    }

    // 6. 發送 Magic Link 給新用戶
    await auth.api.signInMagicLink({
      body: {
        email: email,
        callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/set-username`
      },
      headers: await headers()
    });

    // 7. 根據用戶類型返回成功訊息
    const userTypeNames = {
      admin: '系統管理員',
      owner: '商業用戶',
      supervisor: '組織主管',
      employee: '組織員工'
    };

    const successMessage = organizationData 
      ? `${userTypeNames[userType]} ${name} 建立成功，組織 "${organizationName}" 已創建，設置連結已發送至 ${email}`
      : `${userTypeNames[userType]} ${name} 建立成功，設置連結已發送至 ${email}`;

    return NextResponse.json({
      success: true,
      message: successMessage,
      user: {
        id: newUser.user.id,
        name: newUser.user.name,
        email: newUser.user.email,
        role: newUser.user.role,
      },
      organization: organizationData?.data || null
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