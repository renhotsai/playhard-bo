# Better Auth Types Guide

This document outlines the correct approach to using Better Auth types to avoid coupling issues.

## ❌ Previous Problematic Approach

**Issues:**
1. Created custom `OrganizationWithCount` interface extending Prisma types
2. Created custom `OrganizationDisplay` interface for UI components  
3. Required importing custom types across multiple files, creating coupling
4. Mixed Prisma types with Better Auth functionality

```typescript
// WRONG: Custom interfaces that create coupling
interface OrganizationWithCount extends Organization {
  _count?: { members: number; };
}

interface OrganizationDisplay {
  id: string;
  name: string;
  // ... custom fields
}
```

## ✅ Correct Better Auth Approach

**Benefits:**
1. Uses Better Auth's native type system
2. Leverages automatic type inference from auth client configuration
3. Eliminates custom interface coupling
4. Follows Better Auth plugin architecture

### 1. **Import Better Auth Plugin Types Directly**

```typescript
// Import native Better Auth types
import type { 
  Organization,
  Member, 
  Invitation,
  Team 
} from "better-auth/plugins/organization";

import type { User, Session } from "better-auth";
```

### 2. **Use Type Extensions, Not Custom Interfaces**

```typescript
// Extend Better Auth types when needed
export type OrganizationWithCounts = Organization & {
  _count?: {
    members?: number;
    invitations?: number;
    teams?: number;
  };
};

export type MemberWithUser = Member & {
  user: Pick<User, 'id' | 'name' | 'email' | 'image'>;
};
```

### 3. **Leverage Auth Client Type Inference**

```typescript
// Better Auth automatically provides correct types through the client
export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      teams: { enabled: true }
    })
  ]
});

// These hooks automatically have correct types:
const { data: session } = authClient.useSession();
const { data: organizations } = authClient.useListOrganizations();
const { data: activeOrganization } = authClient.useActiveOrganization();

// Export type helpers for the inferred types
export type AuthSession = NonNullable<ReturnType<typeof authClient.useSession>['data']>;
export type AuthOrganization = NonNullable<ReturnType<typeof authClient.useListOrganizations>['data']>[number];
```

### 4. **Centralized Type Utilities**

Created `/src/lib/types.ts` with:
- Re-exports of Better Auth native types
- Type extensions following Better Auth patterns
- API response wrapper types
- Form data utility types

```typescript
// Central type definitions following Better Auth patterns
export type {
  Organization,
  Member, 
  Invitation,
  Team,
  User,
  Session
};

export type OrganizationWithCounts = Organization & {
  _count?: {
    members?: number;
    invitations?: number;
    teams?: number;
  };
};
```

## Implementation Results

### Files Updated:

1. **`/src/app/dashboard/organizations/page.tsx`**
   - ✅ Now imports `OrganizationWithCounts` from `/src/lib/types.ts`
   - ✅ Uses Better Auth Organization type as base
   - ✅ Eliminates custom interface coupling

2. **`/src/components/merchants-list.tsx`**
   - ✅ Now imports `OrganizationListItem` from `/src/lib/types.ts`
   - ✅ Uses Better Auth Organization type as base
   - ✅ Eliminates custom interface coupling

3. **`/src/lib/auth-client.ts`**
   - ✅ Exports properly typed hooks: `useListOrganizations`, `useActiveOrganization`
   - ✅ Provides type inference helpers for auth client types

4. **`/src/lib/types.ts`** (New)
   - ✅ Centralizes all type definitions following Better Auth patterns
   - ✅ Provides type extensions without creating coupling
   - ✅ Re-exports Better Auth native types for consistent imports

## Better Auth Type System Benefits

1. **Automatic Type Inference**: Better Auth plugins provide automatic type inference based on your configuration
2. **Plugin Integration**: Types work seamlessly across all Better Auth plugins (organization, admin, username, etc.)
3. **Type Safety**: Full TypeScript support with proper error checking
4. **Future Compatibility**: Automatically updates when Better Auth types change
5. **No Coupling**: Uses native Better Auth type system instead of custom interfaces

## Key Patterns

### Session Management
```typescript
const { data: session, isPending } = authClient.useSession();
// session is automatically typed with Better Auth Session type + plugin extensions
```

### Organization Management  
```typescript
const { data: organizations } = authClient.useListOrganizations();
// organizations is automatically typed as Organization[] with plugin configuration
```

### Type Extensions
```typescript
// Extend Better Auth types when you need additional API data
type APIOrganization = Organization & {
  computedField: string;
  _count: { members: number };
};
```

This approach eliminates the coupling issues while maintaining full type safety and leveraging Better Auth's powerful type system.