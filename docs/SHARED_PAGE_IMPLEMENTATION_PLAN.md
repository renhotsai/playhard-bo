# Admin + Organization 共用頁面實施規劃

基於Better Auth 2025最佳實踐和官方文檔研究，以下是admin和organization共用頁面的完整實施規劃。

## 🎯 架構原則

### 核心原則
- **Server-side**: 使用 `auth.api` 方法進行數據獲取
- **Client-side**: 使用 `authClient` 方法進行狀態管理
- **一致性**: 在同一操作流程中使用一致的API，避免同步問題

## 🏗️ 共用頁面架構設計

### 1. 雙重角色檢查系統

```typescript
// src/lib/dual-role-helper.ts
import { auth } from "@/lib/auth";
import { isSystemAdmin } from "@/lib/admin-access-control";
import { headers } from "next/headers";

export async function getDualRoleContext() {
  const session = await auth.api.getSession({ 
    headers: await headers() 
  });

  if (!session?.user) {
    return { 
      isAuthenticated: false,
      isSystemAdmin: false,
      organizationRole: null,
      activeOrganizationId: null,
      canAccessResource: false
    };
  }

  const isAdmin = isSystemAdmin(session.user.role);
  
  // 如果是系統管理員，可以訪問所有資源
  if (isAdmin) {
    return {
      isAuthenticated: true,
      isSystemAdmin: true,
      organizationRole: 'system-admin',
      activeOrganizationId: session.activeOrganizationId,
      canAccessResource: true
    };
  }

  // 檢查組織成員權限
  const organizationId = session.activeOrganizationId;
  if (!organizationId) {
    return {
      isAuthenticated: true,
      isSystemAdmin: false,
      organizationRole: null,
      activeOrganizationId: null,
      canAccessResource: false
    };
  }

  // 獲取組織角色
  const member = await auth.api.getOrganizationMemberRole({
    organizationId,
    userId: session.user.id
  });

  return {
    isAuthenticated: true,
    isSystemAdmin: false,
    organizationRole: member?.role || null,
    activeOrganizationId: organizationId,
    canAccessResource: !!member
  };
}
```

### 2. 統一數據獲取Layer

```typescript
// src/lib/data-access-layer.ts
import { getDualRoleContext } from "./dual-role-helper";
import { auth } from "@/lib/auth";

export class DataAccessLayer {
  /**
   * 獲取用戶列表 - Admin可以看全部，組織成員只能看組織內成員
   */
  static async getUsers(params: {
    organizationId?: string;
    page?: number;
    limit?: number;
  }) {
    const context = await getDualRoleContext();
    
    if (!context.canAccessResource) {
      throw new Error("Unauthorized access");
    }

    // 系統管理員：可以訪問所有用戶
    if (context.isSystemAdmin) {
      if (params.organizationId) {
        // 管理員查看特定組織用戶
        return await auth.api.listOrganizationMembers({
          organizationId: params.organizationId,
          limit: params.limit || 50,
          // page 處理
        });
      } else {
        // 管理員查看系統所有用戶
        return await auth.api.listUsers({
          limit: params.limit || 50,
          // page 處理
        });
      }
    }

    // 組織成員：只能查看自己組織的成員
    if (context.activeOrganizationId) {
      return await auth.api.listOrganizationMembers({
        organizationId: context.activeOrganizationId,
        limit: params.limit || 50,
      });
    }

    throw new Error("No accessible data");
  }

  /**
   * 獲取組織列表 - Admin可以看全部，用戶只能看自己的組織
   */
  static async getOrganizations(params: { page?: number; limit?: number }) {
    const context = await getDualRoleContext();
    
    if (!context.isAuthenticated) {
      throw new Error("Not authenticated");
    }

    // 系統管理員：查看所有組織
    if (context.isSystemAdmin) {
      return await auth.api.listOrganizations({
        limit: params.limit || 50,
        // page 處理
      });
    }

    // 一般用戶：只能查看自己參與的組織
    return await auth.api.getUserOrganizations({
      limit: params.limit || 50,
    });
  }

  /**
   * 獲取單一用戶詳情
   */
  static async getUserDetails(userId: string) {
    const context = await getDualRoleContext();
    
    if (!context.canAccessResource) {
      throw new Error("Unauthorized access");
    }

    // 系統管理員：可以查看任何用戶
    if (context.isSystemAdmin) {
      return await auth.api.getUser({ userId });
    }

    // 組織成員：只能查看同組織用戶
    if (context.activeOrganizationId) {
      const member = await auth.api.getOrganizationMember({
        organizationId: context.activeOrganizationId,
        userId: userId
      });
      
      if (member) {
        return await auth.api.getUser({ userId });
      }
    }

    throw new Error("User not accessible");
  }
}
```

### 3. 共用頁面組件設計

```typescript
// src/components/shared-user-list.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { isSystemAdmin } from "@/lib/admin-access-control";
import { DataAccessLayer } from "@/lib/data-access-layer";

interface SharedUserListProps {
  organizationId?: string; // 如果提供，顯示特定組織用戶
  showSystemActions?: boolean; // 是否顯示系統級操作
}

export function SharedUserList({ 
  organizationId, 
  showSystemActions = false 
}: SharedUserListProps) {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const isAdmin = isSystemAdmin(session?.user?.role);
  const canShowSystemActions = isAdmin && showSystemActions;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // 使用統一的 Data Access Layer
        const userData = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizationId }),
          credentials: 'include'
        });
        
        if (userData.ok) {
          const result = await userData.json();
          setUsers(result.users);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchUsers();
    }
  }, [session, organizationId]);

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {organizationId ? 'Organization Members' : 'All Users'}
        </h2>
        
        {/* 角色指示器 */}
        {isAdmin && (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
            System Admin
          </span>
        )}
      </div>

      <div className="grid gap-4">
        {users.map((user: any) => (
          <div key={user.id} className="p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-gray-600">{user.email}</p>
                {user.role && (
                  <span className="text-sm text-blue-600">
                    Role: {user.role}
                  </span>
                )}
              </div>
              
              <div className="space-x-2">
                {/* 組織級操作 */}
                <button className="px-3 py-1 bg-blue-500 text-white rounded">
                  View
                </button>
                
                {/* 系統級操作 - 只有系統管理員可見 */}
                {canShowSystemActions && (
                  <>
                    <button className="px-3 py-1 bg-yellow-500 text-white rounded">
                      Edit System Role
                    </button>
                    <button className="px-3 py-1 bg-red-500 text-white rounded">
                      Ban User
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. API路由實施

```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { DataAccessLayer } from "@/lib/data-access-layer";

export async function POST(request: NextRequest) {
  try {
    const { organizationId, page, limit } = await request.json();
    
    // 使用統一的 Data Access Layer
    const users = await DataAccessLayer.getUsers({
      organizationId,
      page,
      limit
    });

    return NextResponse.json({ 
      success: true, 
      users,
      message: "Users fetched successfully" 
    });
    
  } catch (error) {
    console.error("API Error:", error);
    
    if (error instanceof Error && error.message === "Unauthorized access") {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
```

### 5. 頁面路由設計

```typescript
// src/app/dashboard/users/page.tsx
import { SharedUserList } from "@/components/shared-user-list";
import { SystemPermissionGuard } from "@/components/system-permission-guard";
import { OrganizationPermissionGuard } from "@/components/organization-permission-guard";
import { getDualRoleContext } from "@/lib/dual-role-helper";

export default async function UsersPage({
  searchParams
}: {
  searchParams: { orgId?: string }
}) {
  const context = await getDualRoleContext();
  const organizationId = searchParams.orgId;

  if (!context.isAuthenticated) {
    return <div>Please log in to access this page.</div>;
  }

  return (
    <div className="p-6">
      {/* 系統管理員視圖 */}
      {context.isSystemAdmin ? (
        <SystemPermissionGuard resource="user" action="list">
          <SharedUserList 
            organizationId={organizationId}
            showSystemActions={true}
          />
        </SystemPermissionGuard>
      ) : (
        /* 組織成員視圖 */
        <OrganizationPermissionGuard permission="VIEW_MEMBERS">
          <SharedUserList 
            organizationId={context.activeOrganizationId}
            showSystemActions={false}
          />
        </OrganizationPermissionGuard>
      )}
    </div>
  );
}
```

## 🔑 核心優勢

### 1. **統一的數據訪問**
- Data Access Layer確保權限檢查一致性
- 避免client/server API不同步問題

### 2. **靈活的權限控制**  
- 系統管理員可以跨組織操作
- 組織成員限制在自己組織內

### 3. **可重用的組件**
- 同一個組件支持不同權限級別
- 根據用戶角色顯示不同功能

### 4. **類型安全**
- 完整的TypeScript支持
- 編譯期權限檢查

## 📋 實施步驟

1. ✅ **創建雙重角色檢查系統**
2. ✅ **實施統一數據訪問層**  
3. ✅ **開發共用組件**
4. ✅ **配置API路由**
5. ✅ **設計頁面路由**

這個架構確保admin和organization用戶可以安全地共用同一個頁面，同時維護適當的權限分離和數據隔離。