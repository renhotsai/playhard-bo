# Role Usage Examples

This document shows how to use the 4 role system (admin, owner, supervisor, employee) with Better Auth.

## Role Hierarchy

1. **`admin`** - System administrator (highest level)
2. **`owner`** - Organization owner  
3. **`supervisor`** - Organization supervisor
4. **`employee`** - Organization employee (basic level)

## Organization Role Assignment Examples

### Inviting Users with Roles

```typescript
import { authClient } from "@/lib/auth-client";

// Invite a user as organization owner
await authClient.organization.inviteMember({
  email: "owner@example.com",
  role: "owner",
  organizationId: "org-123"
});

// Invite a user as supervisor
await authClient.organization.inviteMember({
  email: "supervisor@example.com", 
  role: "supervisor",
  organizationId: "org-123"
});

// Invite a user as employee (default role)
await authClient.organization.inviteMember({
  email: "employee@example.com",
  role: "employee", // or omit for default
  organizationId: "org-123"
});
```

### Updating Member Roles

```typescript
// Promote employee to supervisor
await authClient.organization.updateMemberRole({
  memberId: "member-456",
  role: "supervisor",
  organizationId: "org-123"
});

// Change supervisor to owner
await authClient.organization.updateMemberRole({
  memberId: "member-789", 
  role: "owner",
  organizationId: "org-123"
});
```

### System Admin Operations

```typescript
// System admin creating organization (only admins can do this)
await authClient.organization.create({
  name: "New Company",
  slug: "new-company"
});

// System admin managing users across all organizations
await authClient.admin.listUsers(); // Admin plugin method
```

## Permission Checking Examples

### Client-Side Permission Guards

```typescript
import { PermissionGuard } from "@/components/permission-guard";

// Only owners and supervisors can manage teams
<PermissionGuard resource="team" action="create" organizationId={orgId}>
  <CreateTeamButton />
</PermissionGuard>

// Only system admins can create organizations
<PermissionGuard resource="organization" action="create">
  <CreateOrgButton />
</PermissionGuard>
```

### Server-Side Permission Checking

```typescript
import { createOrganizationRoute } from "@/lib/api-middleware";

// API route that checks organization membership and role
export const POST = createOrganizationRoute(async (request, { user, organization, permissions }) => {
  // Automatically validated: user is member of organization
  // permissions object contains user's role-based permissions
  
  if (permissions.hasPermission("team", "create")) {
    // User can create teams
  }
  
  return Response.json({ success: true });
});
```

## Role Configuration Files

- **`/src/lib/auth.ts`** - Better Auth server configuration with admin & organization plugins
- **`/src/lib/auth-client.ts`** - Better Auth client configuration 
- **`/src/lib/access-control.ts`** - Detailed role definitions and permissions
- **`/src/lib/permissions.ts`** - Permission checking service
- **`/src/lib/api-middleware.ts`** - API route protection middleware

This setup provides comprehensive role-based access control following Better Auth best practices.