# 權限管理系統重構 TODO

## 專案概述
重構權限系統為簡單的 checkbox 模式，採用表格化權限管理，支援用戶和團隊權限設置。

## 核心設計原則
1. **簡化設計**：使用 checkbox 表格管理權限，取代複雜的 AWS IAM 風格策略
2. **分層管理**：System Admin > Organization Owner > 用戶/團隊
3. **權限合併**：用戶最終權限 = 直接權限 ∪ 團隊權限
4. **組織邊界**：Admin 設定組織可用權限範圍

## 數據庫 Schema

### Permission 表格
```sql
Permission {
  id         String   @id @default(cuid())
  subjectType String  // "user" | "team"  
  subjectId   String  // user id 或 team id
  resource    String  // "user", "team", "organization", "report" 等
  action      String  // "create", "update", "delete", "read"
  granted     Boolean @default(false) 
  grantedAt   DateTime @default(now())
  grantedBy   String  // 誰給予的權限
  
  @@unique([subjectType, subjectId, resource, action])
}
```

### OrganizationPermissionLimit 表格
```sql
OrganizationPermissionLimit {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  resource       String       
  action         String       
  allowed        Boolean      @default(true)
  
  @@unique([organizationId, resource, action])
}
```

## UI 設計

### 權限設置表格
```
    資源        | All | Create | Update | Delete | Read |
    ------------|-----|--------|--------|--------|------|
    用戶管理     | ☐   |   ☑    |   ☐    |   ☐    |  ☑   |
    團隊管理     | ☐   |   ☐    |   ☑    |   ☐    |  ☑   |
    組織管理     | ☑   |   ☑    |   ☑    |   ☑    |  ☑   |
```

### 前端邏輯
- **All 欄位**：點擊後該行所有欄位都打勾/取消
- **Read 依賴性**：點擊 Create/Update/Delete 任一個，自動勾選 Read
- **Read 位置**：放在最後一欄

## TODO 清單

### ✅ Phase 1: 文檔準備
- [x] 創建 TODO.md 文件
- [ ] 更新 CLAUDE.md 文件

### 🔄 Phase 2: 數據庫重構
- [ ] 移除舊的複雜表格（CustomRole, CustomRolePermission, UserSystemRole, MemberRole）
- [ ] 新增 Permission 表格
- [ ] 新增 OrganizationPermissionLimit 表格
- [ ] 更新 User 和 Organization 表格關聯
- [ ] 生成新的 Prisma client

### 📋 Phase 3: 核心服務重構
- [ ] 重寫 permissions.ts（移除複雜的 Better Auth 整合）
- [ ] 創建 PermissionService 類別
- [ ] 實現權限檢查邏輯
- [ ] 實現權限合併邏輯（用戶 + 團隊權限）
- [ ] 實現組織權限邊界檢查

### 🔌 Phase 4: API 開發
- [ ] 創建 `/api/permissions/user/[userId]` 端點
- [ ] 創建 `/api/permissions/team/[teamId]` 端點
- [ ] 創建 `/api/organizations/[orgId]/permission-limits` 端點
- [ ] 更新權限檢查中間件
- [ ] 移除舊的角色管理 API

### 🎨 Phase 5: UI 實現
- [ ] 創建 PermissionMatrix 組件
- [ ] 實現 All 選項邏輯
- [ ] 實現 Read 依賴邏輯
- [ ] 創建用戶權限設置頁面
- [ ] 創建團隊權限設置頁面
- [ ] 創建組織權限限制設置頁面
- [ ] 更新導航和路由

### 🧪 Phase 6: 整合測試
- [ ] 測試權限檢查邏輯
- [ ] 測試權限合併功能
- [ ] 測試分層管理功能
- [ ] 測試組織權限邊界
- [ ] 更新現有頁面的權限檢查

### 🗑️ Phase 7: 清理
- [ ] 移除舊的權限相關文件
- [ ] 清理未使用的導入
- [ ] 更新文檔
- [ ] 提交最終代碼

## 權限層級

### System Admin
- 可設定所有組織的權限限制
- 可管理所有用戶和團隊權限

### Organization Owner  
- 可設定該組織內用戶和團隊權限
- 不能超過組織權限限制

### 用戶
- 擁有直接分配的權限
- 繼承所屬團隊的權限

## 注意事項
1. 所有權限變更都需要記錄操作者
2. Read 權限是其他權限的基礎
3. 組織權限限制是硬邊界，不可超越
4. 權限檢查需要考慮性能優化

## 完成標準
- [ ] 所有現有功能正常運行
- [ ] 新權限系統完全可用
- [ ] UI 直觀易用
- [ ] 無遺留的舊代碼
- [ ] 文檔更新完整