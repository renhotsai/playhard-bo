# Access Control Architecture - Better Auth 重構完成

## 🎯 重構目標達成

根據Better Auth官方文檔，我們成功分離了兩個不同層級的權限系統：

### ❌ 舊架構問題
- 混合系統級和組織級權限於一個 `access-control.ts`
- Admin Plugin和Organization Plugin共用同一個access control實例  
- 違背Better Auth的設計理念

### ✅ 新架構解決方案

## 🏗️ 新權限系統架構

### 1. **系統級權限** (Admin Plugin)

**檔案**: `src/lib/admin-access-control.ts`
- **角色**: `admin`, `user`
- **資源**: `user`, `session` (系統級資源)
- **用途**: 系統管理員 vs 一般用戶的區分
- **插件**: Better Auth Admin Plugin

```typescript
// 系統級權限檢查
import { SystemPermissionGuard } from "@/components/system-permission-guard";

<SystemPermissionGuard resource="user" action="create">
  <CreateUserButton />
</SystemPermissionGuard>
```

### 2. **組織級權限** (Organization Plugin)

**檔案**: `src/lib/organization-roles.ts`  
- **角色**: `owner`, `supervisor`, `employee`
- **資源**: Organization內部資源 (members, teams等)
- **用途**: 組織內部成員權限管理
- **插件**: Better Auth Organization Plugin內建角色系統

```typescript
// 組織級權限檢查
import { OrganizationPermissionGuard } from "@/components/organization-permission-guard";

<OrganizationPermissionGuard permission="MEMBER_INVITE" organizationId="org-123">
  <InviteUserButton />
</OrganizationPermissionGuard>
```

## 📋 角色映射表

| 舊角色系統 | 新系統級角色 | 新組織級角色 | 權限範圍 |
|-----------|-------------|-------------|----------|
| `admin` | `admin` | N/A (系統管理員) | 全系統 |
| `owner` | `user` | `owner` | 單一組織 |
| `supervisor` | `user` | `supervisor` | 單一組織 |
| `employee` | `user` | `employee` | 單一組織 |

## 🔧 技術實施

### 檔案結構
```
src/lib/
├── admin-access-control.ts      # 系統級權限 (Admin Plugin)
├── organization-roles.ts        # 組織級角色定義  
├── auth.ts                     # Better Auth配置 (分離兩個插件)
├── auth-client.ts              # 客戶端配置
└── access-control.ts           # ⚠️ 待移除

src/components/
├── system-permission-guard.tsx      # 系統級權限守護
├── organization-permission-guard.tsx # 組織級權限守護
└── permission-guard.tsx            # ⚠️ 舊版本，待重構
```

### Auth.ts 配置重構

```typescript
// ✅ 正確的分離配置
import { adminAc, adminRoles } from "./admin-access-control";
import { organizationRoles, defaultOrganizationRole } from "./organization-roles";

export const auth = betterAuth({
  plugins: [
    // 系統級管理 (Admin Plugin)
    adminPlugin({
      ac: adminAc,              // 只處理系統級權限
      roles: adminRoles,        // admin, user
      adminRoles: ["admin"],
    }),
    
    // 組織級管理 (Organization Plugin)  
    organization({
      roles: organizationRoles,         // ["owner", "supervisor", "employee"]
      defaultRole: defaultOrganizationRole, // "employee"
      // 使用組織插件內建權限系統，無需外部access control
    }),
  ],
});
```

## 🔐 權限檢查方式

### 系統級權限檢查
```typescript
// 檢查是否為系統管理員
const isAdmin = isSystemAdmin(user.role);

// 使用系統級權限守護
<SystemPermissionGuard resource="user" action="delete">
  <DeleteUserButton />
</SystemPermissionGuard>
```

### 組織級權限檢查
```typescript
// 獲取組織內角色
const { memberRole } = useOrganizationRole(organizationId);

// 使用組織級權限守護
<OrganizationPermissionGuard permission="TEAM_CREATE" organizationId={orgId}>
  <CreateTeamButton />
</OrganizationPermissionGuard>
```

## 🚀 優勢

1. **符合Better Auth官方設計理念**
2. **清晰的權限層級分離**
3. **更好的可維護性**
4. **正確的插件職責劃分**
5. **完整的TypeScript類型安全**

## 🔄 遷移指南

### 組件更新
- 將`PermissionGuard`替換為`SystemPermissionGuard`或`OrganizationPermissionGuard`
- 更新import路徑到新的權限檔案
- 調整權限檢查邏輯

### API路由更新
- 系統級權限：使用admin access control檢查
- 組織級權限：通過Organization Plugin API檢查成員角色

### 測試驗證
- ✅ Better Auth endpoints正常運行
- ✅ OpenAPI文檔正常生成
- ✅ 系統編譯無錯誤
- ✅ 權限分離架構完成

## 📚 相關文件

- [Better Auth Admin Plugin](https://www.better-auth.com/docs/plugins/admin#access-control)
- [Better Auth Organization Plugin](https://www.better-auth.com/docs/plugins/organization#access-control) 
- `ROLE_USAGE_EXAMPLES.md` - 角色使用範例
- `BETTER_AUTH_REFERENCE.md` - Better Auth參考文檔