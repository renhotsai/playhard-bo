# 共享認證系統的階層式用戶管理實作計畫（含 Resend 整合）

## 系統架構分析

### 現況評估
- **Web** 和 **Backoffice** 共用同一套 Better Auth 系統
- 現有 Better Auth 表結構：User, Session, Account, Verification
- 使用 **Resend** 作為 Email 服務提供商
- 需要擴展而非重建現有認證系統

### 資料庫設計策略

#### 1. 保留現有 Better Auth 核心表
```prisma
// 現有表保持不變，只擴展額外欄位
model User {
  // ... 現有欄位
  // 使用 Better Auth 的 additionalFields 擴展
}
```

#### 2. 新增業務邏輯表（獨立於認證系統）
```prisma
// 角色管理表
model UserRole {
  id       String   @id @default(cuid())
  userId   String   @unique
  role     RoleType @default(EMPLOYEE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("user_role")
}

enum RoleType {
  ADMIN
  MERCHANT_OWNER
  SUPERVISOR
  EMPLOYEE
}

// 商戶管理表
model Merchant {
  id          String   @id @default(cuid())
  name        String
  description String?
  ownerId     String   @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  owner  User    @relation("MerchantOwner", fields: [ownerId], references: [id])
  groups Group[]
  @@map("merchant")
}

// 群組管理表
model Group {
  id           String   @id @default(cuid())
  name         String
  description  String?
  merchantId   String
  supervisorId String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  merchant   Merchant              @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  supervisor User?                 @relation("GroupSupervisor", fields: [supervisorId], references: [id])
  members    UserGroupMembership[]
  
  @@map("group")
}

// 用戶群組關聯表
model UserGroupMembership {
  id        String   @id @default(cuid())
  userId    String
  groupId   String
  createdAt DateTime @default(now())
  
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  @@unique([userId, groupId])
  @@map("user_group_membership")
}
```

## Better Auth 配置增強

### 1. Magic Link + 額外欄位配置
```typescript
// bo/src/lib/auth.ts
import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { sendMagicLinkEmail } from "@/lib/email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [
    username(),
    magicLink({
      expiresIn: 15 * 60, // 15 分鐘
      sendMagicLink: async ({ email, token, url }, request) => {
        await sendMagicLinkEmail(email, url);
      }
    })
  ],
  user: {
    additionalFields: {
      passwordSet: {
        type: "boolean",
        defaultValue: false,
        input: false
      },
      isActive: {
        type: "boolean", 
        defaultValue: true,
        input: false
      }
    }
  }
});
```

### 2. 客戶端 Magic Link 集成
```typescript
// bo/src/lib/auth-client.ts
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    magicLinkClient()
  ]
});

export const {
  signIn,
  signUp, 
  signOut,
  useSession,
  getSession,
} = authClient;
```

## Resend Email 服務整合

### 1. Resend 配置
```typescript
// bo/src/lib/email.ts
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMagicLinkEmail(email: string, magicLinkUrl: string) {
  try {
    // Read HTML template
    const templatePath = path.join(process.cwd(), 'src/templates/emails/magic-link-invitation.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
    
    // Replace placeholders
    htmlTemplate = htmlTemplate
      .replace('{{magicLinkUrl}}', magicLinkUrl)
      .replace('{{expiresInMinutes}}', '15');
    
    const { data, error } = await resend.emails.send({
      from: 'PlayHard Admin <admin@playhard.local>',
      to: [email],
      subject: '您的 PlayHard 帳戶邀請',
      html: htmlTemplate,
      text: `點擊以下連結完成帳戶設定: ${magicLinkUrl}`
    });
    
    if (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send invitation email');
    }
    
    return data;
  } catch (error) {
    console.error('Resend error:', error);
    throw error;
  }
}
```

### 2. HTML Email 模板
```html
<!-- bo/src/templates/emails/magic-link-invitation.html -->
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PlayHard 帳戶邀請</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center;">
        <h1 style="color: white; margin: 0;">歡迎加入 PlayHard</h1>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; margin: 20px 0;">
        <h2 style="color: #333; margin-top: 0;">您已被邀請加入管理系統</h2>
        <p>您好！您已被邀請加入 PlayHard 後台管理系統。請點擊下方按鈕完成帳戶設定。</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{magicLinkUrl}}" 
               style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                完成帳戶設定
            </a>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
                <strong>重要提醒：</strong>此連結將在 {{expiresInMinutes}} 分鐘後失效。
            </p>
        </div>
        
        <p style="font-size: 14px; color: #666;">
            如果您無法點擊按鈕，請複製以下連結到瀏覽器：<br>
            <span style="background: #f0f0f0; padding: 5px; border-radius: 3px; word-break: break-all;">{{magicLinkUrl}}</span>
        </p>
    </div>
    
    <div style="text-align: center; color: #666; font-size: 12px;">
        <p>此郵件由 PlayHard 系統自動發送，請勿回覆。</p>
    </div>
</body>
</html>
```

## 權限系統架構

### 1. 角色權限檢查服務
```typescript
// bo/src/lib/permissions.ts
export class PermissionService {
  static async getUserRole(userId: string): Promise<RoleType | null> {
    const userRole = await prisma.userRole.findUnique({
      where: { userId }
    });
    return userRole?.role || null;
  }
  
  static async canCreateUser(currentUser: User, targetRole: RoleType): Promise<boolean> {
    const currentRole = await this.getUserRole(currentUser.id);
    
    // Admin 可以建立所有角色
    if (currentRole === 'ADMIN') return true;
    
    // Merchant Owner 可建立 Supervisor, Employee
    if (currentRole === 'MERCHANT_OWNER') {
      return ['SUPERVISOR', 'EMPLOYEE'].includes(targetRole);
    }
    
    // Supervisor 只能建立 Employee
    if (currentRole === 'SUPERVISOR') {
      return targetRole === 'EMPLOYEE';
    }
    
    return false;
  }
  
  static async getUsersWithPermission(currentUser: User): Promise<User[]> {
    const role = await this.getUserRole(currentUser.id);
    
    switch (role) {
      case 'ADMIN':
        return await prisma.user.findMany({
          include: { userRole: true }
        });
        
      case 'MERCHANT_OWNER':
        const merchant = await prisma.merchant.findUnique({
          where: { ownerId: currentUser.id }
        });
        
        if (!merchant) return [];
        
        return await prisma.user.findMany({
          where: {
            groupMemberships: {
              some: {
                group: { merchantId: merchant.id }
              }
            }
          },
          include: { userRole: true }
        });
        
      case 'SUPERVISOR':
        return await prisma.user.findMany({
          where: {
            groupMemberships: {
              some: {
                group: { supervisorId: currentUser.id }
              }
            }
          },
          include: { userRole: true }
        });
        
      default:
        return [];
    }
  }
}
```

### 2. API 權限中間件
```typescript
// bo/src/lib/middleware/auth-check.ts
export function withPermission(allowedRoles: RoleType[]) {
  return async function(req: NextRequest) {
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userRole = await PermissionService.getUserRole(session.user.id);
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return null; // 繼續執行
  }
}
```

## API Routes 實作

### 1. 用戶管理 API
```typescript
// bo/src/app/api/users/create/route.ts
export async function POST(req: NextRequest) {
  const authCheck = await withPermission(['ADMIN', 'MERCHANT_OWNER', 'SUPERVISOR'])(req);
  if (authCheck) return authCheck;
  
  const session = await getSession();
  const { name, email, username, role, groupIds } = await req.json();
  
  // 檢查是否有權限建立此角色
  const canCreate = await PermissionService.canCreateUser(session.user, role);
  if (!canCreate) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }
  
  try {
    // 建立用戶
    const user = await auth.api.createUser({
      name,
      email, 
      username,
      emailVerified: false,
      passwordSet: false
    });
    
    // 建立角色記錄
    await prisma.userRole.create({
      data: { userId: user.id, role }
    });
    
    // 指派群組（如果有）
    if (groupIds?.length) {
      await prisma.userGroupMembership.createMany({
        data: groupIds.map(groupId => ({ userId: user.id, groupId }))
      });
    }
    
    // 發送 Magic Link
    const magicLinkResult = await authClient.signIn.magicLink({
      email,
      callbackURL: '/set-password'
    });
    
    return NextResponse.json({ 
      success: true, 
      user: { id: user.id, name, email, role },
      magicLinkSent: !magicLinkResult.error
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
```

### 2. 商戶管理 API
```typescript
// bo/src/app/api/merchants/create/route.ts
export async function POST(req: NextRequest) {
  const authCheck = await withPermission(['ADMIN'])(req);
  if (authCheck) return authCheck;
  
  const { merchantName, merchantDescription, ownerName, ownerEmail, ownerUsername } = await req.json();
  
  try {
    // 建立 Merchant Owner 用戶
    const owner = await auth.api.createUser({
      name: ownerName,
      email: ownerEmail,
      username: ownerUsername,
      emailVerified: false,
      passwordSet: false
    });
    
    // 建立 Merchant 記錄
    const merchant = await prisma.merchant.create({
      data: {
        name: merchantName,
        description: merchantDescription,
        ownerId: owner.id
      }
    });
    
    // 設定 Owner 角色
    await prisma.userRole.create({
      data: { userId: owner.id, role: 'MERCHANT_OWNER' }
    });
    
    // 發送 Magic Link 邀請
    await authClient.signIn.magicLink({
      email: ownerEmail,
      callbackURL: '/set-password'
    });
    
    return NextResponse.json({ 
      success: true, 
      merchant, 
      owner: { id: owner.id, name: ownerName, email: ownerEmail }
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create merchant' }, { status: 500 });
  }
}
```

## 前端實作

### 1. TanStack Form 用戶建立表單
```typescript
// bo/src/components/forms/create-user-form.tsx
export function CreateUserForm() {
  const { permissions } = usePermissions();
  
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      username: '',
      role: 'EMPLOYEE' as RoleType,
      groupIds: [] as string[]
    },
    onSubmit: async ({ value }) => {
      const result = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value)
      });
      
      if (result.ok) {
        toast.success('用戶建立成功，邀請郵件已發送');
        form.reset();
      }
    }
  });
  
  return (
    <form onSubmit={form.handleSubmit}>
      <form.Field name="role">
        {(field) => (
          <Select
            value={field.state.value}
            onValueChange={field.handleChange}
          >
            {permissions.canCreateMerchantOwner && (
              <SelectItem value="MERCHANT_OWNER">商戶擁有者</SelectItem>
            )}
            {permissions.canCreateSupervisor && (
              <SelectItem value="SUPERVISOR">主管</SelectItem>
            )}
            <SelectItem value="EMPLOYEE">員工</SelectItem>
          </Select>
        )}
      </form.Field>
      {/* 其他欄位... */}
    </form>
  );
}
```

### 2. 動態權限側邊欄
```typescript
// bo/src/components/dashboard-layout.tsx
export function DashboardLayout({ children }) {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<RoleType>();
  
  useEffect(() => {
    if (user?.id) {
      PermissionService.getUserRole(user.id).then(setUserRole);
    }
  }, [user]);
  
  const sidebarGroups = useMemo(() => {
    const groups = [];
    
    if (userRole === 'ADMIN') {
      groups.push({
        title: "Merchants",
        items: [
          { title: "View Merchants", href: "/dashboard/merchants" },
          { title: "Add Merchant", href: "/dashboard/merchants/add" }
        ]
      });
    }
    
    if (['ADMIN', 'MERCHANT_OWNER', 'SUPERVISOR'].includes(userRole)) {
      groups.push({
        title: "Users", 
        items: [
          { title: "View Users", href: "/dashboard/users" },
          { title: "Add User", href: "/dashboard/users/add" },
          ...(userRole !== 'SUPERVISOR' ? [
            { title: "Groups", href: "/dashboard/users/groups" }
          ] : [])
        ]
      });
    }
    
    return groups;
  }, [userRole]);
  
  // ... 渲染邏輯
}
```

## 環境配置

### 1. Environment Variables
```env
# bo/.env
DATABASE_URL="postgres://postgres:playhard123@localhost:5432/playhard"
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3001/api/auth"
NEXT_PUBLIC_APP_URL="http://localhost:3001"

# Resend Configuration
RESEND_API_KEY="re_EoPf9JZW_CjG9HpPUPsVxqty735gFFaVc"
```

### 2. Package Dependencies
```bash
# Install Resend
npm install resend

# Install React Email (for templates)
npm install @react-email/components
```

## 開發實作順序

### 階段 1: 資料庫架構 (Day 1)
1. ✅ 新增 UserRole, Merchant, Group, UserGroupMembership 表
2. 保持現有 Better Auth 表結構
3. 執行資料庫遷移

### 階段 2: Better Auth + Resend 整合 (Day 2)
1. 配置 Magic Link 插件
2. 整合 Resend email 服務
3. 建立 HTML Email 模板
4. 測試 Magic Link 流程

### 階段 3: 權限系統實作 (Day 3)
1. 實作 PermissionService 類別
2. 建立 API 權限中間件
3. 實作角色檢查邏輯

### 階段 4: API Routes 開發 (Day 4-5)
1. 用戶建立/管理 API
2. 商戶建立/管理 API  
3. 群組管理 API
4. 權限檢查 API

### 階段 5: 前端 UI 實作 (Day 6-8)
1. TanStack Form 整合
2. shadcn/ui 組件實作
3. 動態權限側邊欄
4. 用戶/商戶/群組管理頁面

### 階段 6: 整合測試 (Day 9-10)
1. 端到端權限測試
2. Magic Link 邀請流程測試
3. Email 發送測試
4. 跨角色權限驗證

## 技術優勢總結

### 1. 資料架構
- 認證系統與業務邏輯分離
- 保持 Better Auth 原生功能
- web/bo 共享認證，獨立業務邏輯

### 2. Email 整合
- Resend 提供可靠的 email 發送
- 獨立 HTML 模板系統
- 完整的錯誤處理和重試機制

### 3. 開發體驗
- TypeScript 全面型別安全
- TanStack Form 響應式表單管理
- shadcn/ui 一致的設計系統
- Better Auth 內建安全機制

此計畫在不影響現有 web/bo 共享認證的基礎上，建立完整的階層式用戶管理系統，並使用 Resend 確保邀請郵件的可靠送達。

## 權限矩陣

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

## Magic Link 邀請流程

### 1. 管理員建立用戶流程
1. 填寫用戶資訊表單（TanStack Form）
2. API 建立 User 記錄和 UserRole 記錄
3. 生成 Magic Link（15分鐘有效）
4. 使用 Resend 發送 HTML 邀請 Email
5. 用戶狀態設為 `passwordSet: false`

### 2. 用戶設定流程
1. 點擊 Magic Link 自動登入
2. 導向 `/set-password` 頁面
3. 設定密碼後更新 `passwordSet: true`
4. 根據角色導向對應儀表板

此實作計畫確保系統的可擴展性、安全性和可維護性，同時保持與現有認證系統的兼容性。