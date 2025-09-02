import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

// 創建基本的 Better Auth 配置
export const statement = {
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

// Better Auth 角色定義
export const admin = ac.newRole({
  ...adminAc.statements,
  organization: ["create", "read", "update", "delete", "list"],
  user: ["create", "read", "update", "delete", "list", "ban", "unban"],
});

export const owner = ac.newRole({
  user: ["create", "read", "update", "list"],
  organization: ["read", "update", "list"],
  // Better Auth organization plugin permissions
  "organization:member": ["create", "read", "update", "delete", "list"],
  "organization:invitation": ["create", "read", "update", "delete", "list"],
});

export const supervisor = ac.newRole({
  user: ["read", "update", "list"],
  organization: ["read"],
  // Better Auth organization plugin permissions  
  "organization:member": ["read", "list"],
  "organization:invitation": ["read", "list"],
});

export const employee = ac.newRole({
  user: ["read", "list"],
  organization: ["read"],
  // Better Auth organization plugin permissions
  "organization:member": ["read", "list"],
});

// Permission helper functions
export const isSystemAdmin = (role?: string | null): boolean => {
  return role === 'admin';
};

export const isOwner = (role?: string | null): boolean => {
  return role === 'owner';
};

export const canCreateUsers = (role?: string | null): boolean => {
  return isSystemAdmin(role) || isOwner(role);
};

