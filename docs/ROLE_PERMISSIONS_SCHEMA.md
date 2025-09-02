# Role Permissions Database Schema

This document describes the database schema needed to support organization-specific role permissions.

## Required Table: OrganizationRolePermission

Add this to your Prisma schema to support role-based permission templates for organizations:

```prisma
model OrganizationRolePermission {
  id             String   @id @default(cuid())
  organizationId String
  role          String    // 'supervisor', 'employee', etc.
  permissions   Json      // JSON object containing resource permissions
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  organization  Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Unique constraint to ensure one permission set per org per role
  @@unique([organizationId, role])
  @@map("organization_role_permissions")
}
```

## Update Organization Model

Add this relation to your existing Organization model:

```prisma
model Organization {
  // ... existing fields ...
  
  rolePermissions OrganizationRolePermission[]
  
  // ... rest of the model ...
}
```

## Permission Structure

The `permissions` JSON field should store permissions in this format:

```json
{
  "user": {
    "create": true,
    "read": true,
    "update": false,
    "delete": false
  },
  "merchants": {
    "create": false,
    "read": true,
    "update": true,
    "delete": false
  },
  "organization": {
    "members": {
      "read": true,
      "invite": false
    }
  }
}
```

## Usage in Code

To integrate with the existing API, update `/src/app/api/organizations/role-permissions/route.ts`:

1. Uncomment the database operations in the TODO sections
2. Replace mock responses with actual Prisma queries

Example implementation:

```typescript
// Load permissions
const rolePermissions = await prisma.organizationRolePermission.findUnique({
  where: {
    organizationId_role: {
      organizationId,
      role
    }
  }
});

const permissions = rolePermissions ? JSON.parse(rolePermissions.permissions) : {};

// Save permissions
await prisma.organizationRolePermission.upsert({
  where: {
    organizationId_role: {
      organizationId,
      role
    }
  },
  update: {
    permissions: JSON.stringify(permissions)
  },
  create: {
    organizationId,
    role,
    permissions: JSON.stringify(permissions)
  }
});
```

## Migration Command

After adding the schema, run:

```bash
npx prisma migrate dev --name add_organization_role_permissions
npx prisma generate
```

## Benefits

This implementation allows:

1. **Organization-specific role configurations**: Each org can define different permissions for supervisor/employee roles
2. **Flexible permission structure**: JSON storage allows complex nested permissions
3. **Role templates**: New users with specific roles inherit the org's permission template
4. **Scalable**: Easy to extend for new roles or permission types

The role permissions management UI is already implemented and will work seamlessly once the database schema is added.