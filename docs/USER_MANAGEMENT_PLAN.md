# 階層式用戶管理系統與權限控制實作計畫

## 系統架構概述
建立嚴格的階層式權限系統：**Admin** → **Merchant** → **Merchant Owner** → **Supervisor** → **Employee**，每個層級只能查看和管理下層用戶，並整合 Better Auth Magic Link 進行安全邀請。

## 權限矩陣設計

### 角色權限層級
```
Admin (最高權限)
├─ 可查看：所有 Merchant + 所有用戶
├─ 可建立：Merchant + Merchant Owner
└─ 不可查看：無限制

Merchant Owner
├─ 可查看：自己 Merchant 的 Supervisor + Employee
├─ 可建立：Supervisor + Employee (限自己 Merchant)
└─ 不可查看：其他 Merchant 用戶、Admin

Supervisor  
├─ 可查看：指派 Group 內的 Employee
├─ 可建立：Employee (限指派 Group)
└─ 不可查看：其他 Merchant、Admin、其他 Supervisor、其他 Group

Employee
├─ 可查看：基本資訊、自己的資料
├─ 可建立：無
└─ 不可查看：Admin、Merchant Owner、Supervisor、其他 Employee
```

## 資料庫架構更新

### 1. Prisma Schema 擴展
```prisma
enum UserRole {
  ADMIN
  MERCHANT_OWNER  
  SUPERVISOR
  EMPLOYEE
}

model Merchant {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // 關聯
  owner       User?    @relation("MerchantOwner")
  users       User[]   @relation("MerchantUsers")
  groups      Group[]
}

model Group {
  id          String   @id @default(cuid())
  name        String
  description String?
  merchantId  String
  supervisorId String? // 指派的 Supervisor
  
  // 關聯
  merchant    Merchant @relation(fields: [merchantId], references: [id])
  supervisor  User?    @relation("GroupSupervisor", fields: [supervisorId], references: [id])
  members     UserGroup[]
}

model User {
  id          String    @id @default(cuid())
  username    String    @unique
  email       String    @unique
  name        String
  role        UserRole
  merchantId  String?   // null for Admin
  passwordSet Boolean   @default(false)
  isActive    Boolean   @default(true)
  
  // 關聯
  merchant         Merchant? @relation("MerchantUsers", fields: [merchantId], references: [id])
  ownedMerchant   Merchant? @relation("MerchantOwner")
  supervisedGroups Group[]  @relation("GroupSupervisor")
  groups          UserGroup[]
}

model UserGroup {
  id      String @id @default(cuid())
  userId  String
  groupId String
  
  user    User   @relation(fields: [userId], references: [id])
  group   Group  @relation(fields: [groupId], references: [id])
  
  @@unique([userId, groupId])
}
```

## Better Auth Magic Link 配置

### 1. 伺服器端設定 (`bo/src/lib/auth.ts`)
```typescript
import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";

export const auth = betterAuth({
  // ... existing config
  plugins: [
    username(),
    magicLink({
      expiresIn: 15 * 60, // 15 分鐘
      sendMagicLink: async ({ email, token, url }) => {
        // 發送邀請 Email (開發環境 console.log)
        console.log(`Magic Link for ${email}: ${url}`);
      }
    })
  ]
});
```

### 2. 客戶端配置 (`bo/src/lib/auth-client.ts`)
```typescript
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    magicLinkClient()
  ]
});
```

## API 權限控制邏輯

### 1. 權限檢查中間件 (`/api/middleware/auth.ts`)
```typescript
export function checkPermission(requiredRole: UserRole, resourceMerchantId?: string) {
  // 實作階層式權限檢查
  // 1. 檢查用戶角色層級
  // 2. 檢查 Merchant 歸屬
  // 3. 檢查 Group 權限範圍
}
```

### 2. API Routes 設計

#### Merchant 管理
- `POST /api/merchants/create` - 建立商戶 (Admin only)
- `GET /api/merchants` - 取得商戶列表 (權限過濾)
- `GET /api/merchants/[id]/users` - 取得商戶用戶 (權限檢查)

#### User 管理  
- `POST /api/users/create` - 建立用戶 + Magic Link (權限控制)
- `GET /api/users` - 取得用戶列表 (階層過濾)
- `PUT /api/users/[id]` - 更新用戶 (權限驗證)

#### Group 管理
- `POST /api/groups/create` - 建立群組 (Merchant Owner+)
- `GET /api/groups` - 取得群組列表 (權限過濾)
- `POST /api/groups/[id]/assign-users` - 指派用戶到群組

## 前端頁面架構

### 1. 側邊欄動態渲染
```typescript
// 根據用戶角色顯示選單
const sidebarItems = {
  ADMIN: [
    { title: "Merchants", items: ["View Merchants", "Add Merchant"] },
    { title: "Users", items: ["View Users", "Add User", "Groups"] }
  ],
  MERCHANT_OWNER: [
    { title: "Users", items: ["View Users", "Add User", "Groups"] }
  ],
  SUPERVISOR: [
    { title: "Users", items: ["View Users", "Add User"] }
  ],
  EMPLOYEE: [
    { title: "Profile", items: ["My Profile"] }
  ]
};
```

### 2. 頁面權限控制

#### `/dashboard/merchants` (Admin only)
- 顯示所有 Merchant 列表
- 每個 Merchant 顯示 Owner 資訊
- 建立新 Merchant 按鈕

#### `/dashboard/merchants/add` (Admin only)  
- Merchant 基本資訊表單
- Merchant Owner 資訊 (Username, Email)
- 建立成功後自動發送 Magic Link

#### `/dashboard/users` (分層顯示)
- **Admin**: 所有用戶 + Merchant 標籤
- **Merchant Owner**: 自己 Merchant 的 Supervisor + Employee  
- **Supervisor**: 指派 Group 的 Employee
- **Employee**: 只顯示自己資料

#### `/dashboard/users/add` (權限控制)
- **Admin**: 可選擇 Merchant + 建立 Merchant Owner
- **Merchant Owner**: 限制自己 Merchant + 建立 Supervisor/Employee
- **Supervisor**: 限制指派 Group + 建立 Employee

#### `/dashboard/users/groups` (分層管理)
- **Admin**: 所有 Group + 跨 Merchant 查看
- **Merchant Owner**: 自己 Merchant 的 Group 管理
- **Supervisor**: 自己管理的 Group

## 數據過濾實作

### 1. API 層數據過濾
```typescript
// 根據用戶角色和權限過濾數據
export async function getUsersWithPermission(currentUser: User) {
  switch (currentUser.role) {
    case 'ADMIN':
      return await prisma.user.findMany(); // 全部
    case 'MERCHANT_OWNER':
      return await prisma.user.findMany({
        where: { 
          merchantId: currentUser.merchantId,
          role: { in: ['SUPERVISOR', 'EMPLOYEE'] }
        }
      });
    case 'SUPERVISOR':
      return await prisma.user.findMany({
        where: {
          groups: {
            some: { 
              group: { supervisorId: currentUser.id }
            }
          },
          role: 'EMPLOYEE'
        }
      });
    default:
      return []; // Employee 無查看權限
  }
}
```

### 2. 前端權限檢查
```typescript
// 頁面層級權限守衛
export function useRoleGuard(allowedRoles: UserRole[]) {
  const { user } = useAuth();
  
  if (!user || !allowedRoles.includes(user.role)) {
    router.push('/unauthorized');
  }
}
```

## Magic Link 邀請流程

### 1. 用戶建立流程
1. 管理員填寫用戶表單
2. 系統建立用戶記錄 (`passwordSet: false`)
3. 生成 15 分鐘 Magic Link
4. 發送邀請 Email
5. 顯示建立成功訊息

### 2. 用戶設定流程
1. 用戶點擊 Email 中的 Magic Link
2. 自動驗證並登入系統
3. 導向 `/set-password` 頁面
4. 設定密碼後更新 `passwordSet: true`
5. 根據角色導向對應 Dashboard

### 3. 密碼設定頁面 (`/set-password`)
- 密碼強度驗證
- 確認密碼輸入
- 設定完成後根據角色導向：
  - Admin → 全功能 Dashboard
  - Merchant Owner → Merchant 管理
  - Supervisor → Group 管理  
  - Employee → 基本功能

## 安全性措施

### 1. 權限驗證
- API 層強制權限檢查
- 前端路由保護
- 資源存取權限驗證

### 2. 數據隔離  
- Merchant 間完全隔離
- Group 層級權限控制
- 個人資料保護

### 3. Magic Link 安全
- 15 分鐘自動失效
- 單次使用限制
- Email 驗證機制

## 開發實作順序

### 階段 1: 資料庫與認證
1. 更新 Prisma Schema
2. 配置 Better Auth Magic Link
3. 實作權限檢查中間件

### 階段 2: Merchant 管理
1. Merchant 建立 API + 頁面
2. Merchant 列表 API + 頁面  
3. Merchant Owner 邀請流程

### 階段 3: User 管理
1. User 建立 API (權限控制)
2. User 列表 API (分層過濾)
3. User 管理頁面 (動態權限)

### 階段 4: Group 管理
1. Group 建立/管理 API
2. User-Group 關聯管理
3. Group 權限控制實作

### 階段 5: 整合測試
1. 完整權限流程測試
2. Magic Link 邀請測試
3. 階層權限驗證測試

此計畫將建立一個完整的階層式用戶管理系統，確保嚴格的權限分離和安全的 Magic Link 邀請流程，每個角色都只能查看和管理適當層級的用戶。