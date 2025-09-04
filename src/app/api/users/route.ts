import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, role, type, organizationId } = body;

    // Validate input
    if (!name || !email || !role) {
      return NextResponse.json({
        error: "姓名、Email 和角色為必填項目"
      }, { status: 400 });
    }

    if (!type || !['system', 'organization'].includes(type)) {
      return NextResponse.json({
        error: "必須指定建立類型：system 或 organization"
      }, { status: 400 });
    }

    if (type === 'system') {
      // 創建系統級用戶（只有 admin 或 user）
      if (!['admin', 'user'].includes(role)) {
        return NextResponse.json({
          error: "系統級角色只能是 admin 或 user"
        }, { status: 400 });
      }

      // 使用 Better Auth admin API 創建系統用戶
      const newUserResult = await auth.api.createUser({
        body: {
          email,
          name,
          password: "tempPassword123",
          role: role, // admin 或 user
          data: {
            emailVerified: false,
          }
        }
      });
      
      // Better Auth createUser may return user directly or in a wrapper
      const newUser = newUserResult?.user || newUserResult;

      return NextResponse.json({
        success: true,
        message: `系統${role === 'admin' ? '管理員' : '用戶'}建立成功`,
        user: newUser
      });

    } else if (type === 'organization') {
      // 組織邀請（owner, admin, member, guest）
      if (!organizationId) {
        return NextResponse.json({
          error: "組織邀請必須指定 organizationId"
        }, { status: 400 });
      }

      if (!['owner', 'supervisor', 'employee'].includes(role)) {
        return NextResponse.json({
          error: "組織角色必須是 owner, supervisor 或 employee 其中之一"
        }, { status: 400 });
      }

      // 使用 Better Auth organization API 發送邀請
      const invitation = await auth.api.createInvitation({
        body: {
          email,
          organizationId,
          role: role
        },
        headers: request.headers
      });

      // Generate appropriate role name for success message
      const roleNames = {
        owner: '擁有者',
        supervisor: '主管', 
        employee: '員工'
      };
      
      return NextResponse.json({
        success: true,
        message: `已發送組織${roleNames[role as keyof typeof roleNames]}邀請給 ${email}`,
        invitation: invitation
      });
    }

    // If we reach here, it means invalid type was provided
    return NextResponse.json({
      error: "無效的創建類型"
    }, { status: 400 });

  } catch (error) {
    console.error("Create user/invitation error:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        return NextResponse.json({ 
          error: "此 Email 地址已被使用或已受邀" 
        }, { status: 409 });
      }

      if (error.message.includes("unauthorized") || error.message.includes("permission")) {
        return NextResponse.json({ 
          error: "權限不足" 
        }, { status: 403 });
      }
      
      return NextResponse.json({ 
        error: error.message 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: "操作失敗，請稍後再試" 
    }, { status: 500 });
  }
}