/**
 * TanStack Query Key Factory
 * 
 * Centralized query key management for consistent caching and invalidation.
 * Following TanStack Query best practices for hierarchical key structure.
 * 
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */

// Base query key factories
export const queryKeys = {
  // Admin operations
  admin: {
    all: () => ['admin'] as const,
    users: () => [...queryKeys.admin.all(), 'users'] as const,
    allUsers: () => [...queryKeys.admin.users(), 'all'] as const,
    user: (userId: string) => [...queryKeys.admin.users(), userId] as const,
  },

  // Organizations
  organizations: {
    all: () => ['organizations'] as const,
    lists: () => [...queryKeys.organizations.all(), 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.organizations.lists(), filters] as const,
    details: () => [...queryKeys.organizations.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.organizations.details(), id] as const,
    members: (orgId: string) => 
      [...queryKeys.organizations.detail(orgId), 'members'] as const,
  },

  // Teams
  teams: {
    all: () => ['teams'] as const,
    byOrganization: (orgId: string) => 
      [...queryKeys.teams.all(), 'organization', orgId] as const,
    detail: (teamId: string) => [...queryKeys.teams.all(), 'detail', teamId] as const,
  },

  // Users
  users: {
    all: () => ['users'] as const,
    lists: () => [...queryKeys.users.all(), 'list'] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    profile: () => [...queryKeys.users.all(), 'profile'] as const,
  },
} as const;

/**
 * Query key utilities for cache invalidation patterns
 */
export const queryKeyUtils = {
  // Invalidate all admin queries
  invalidateAllAdmin: () => queryKeys.admin.all(),
  
  // Invalidate all users (both admin and regular user queries)
  invalidateAllUsers: () => [queryKeys.admin.users(), queryKeys.users.all()],
  
  // Invalidate all organizations
  invalidateAllOrganizations: () => queryKeys.organizations.all(),
  
  // Invalidate organization and its members
  invalidateOrganizationAndMembers: (orgId: string) => [
    queryKeys.organizations.detail(orgId),
    queryKeys.organizations.members(orgId),
  ],
} as const;