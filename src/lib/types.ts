/**
 * Better Auth Types Utilities
 * 
 * This file provides type extensions and utilities for Better Auth types.
 * It follows Better Auth's native type system instead of creating custom interfaces.
 */

import type { 
  Organization, 
  Member, 
  Invitation, 
  Team
} from "better-auth/plugins/organization";
import type { User, Session } from "better-auth";

// Re-export Better Auth types for consistent imports
export type {
  Organization,
  Member,
  Invitation,
  Team,
  User,
  Session
};

/**
 * Better Auth Organization with additional API count data
 * This extends the native Organization type with computed fields from API responses
 */
export type OrganizationWithCounts = Organization & {
  _count?: {
    members?: number;
    invitations?: number;
    teams?: number;
  };
};

/**
 * Better Auth Member with populated user data
 * This represents the member type with user information populated
 */
export type MemberWithUser = Member & {
  user: Pick<User, 'id' | 'name' | 'email' | 'image'>;
};

/**
 * Organization with full member and invitation data for dashboard views
 */
export type FullOrganization = Organization & {
  members: MemberWithUser[];
  invitations: Invitation[];
  teams?: Team[];
  _count?: {
    members: number;
    invitations: number;
    teams?: number;
  };
};

/**
 * Type for organization list API responses
 */
export type OrganizationListItem = Pick<Organization, 'id' | 'name' | 'slug' | 'logo' | 'createdAt'> & {
  memberCount: number;
  pendingInvitationsCount?: number;
};

/**
 * Session with organization context from Better Auth
 */
export type SessionWithOrganization = Session & {
  activeOrganizationId?: string;
  activeTeamId?: string;
};

/**
 * Auth client inferred types
 * These types are automatically inferred from your auth client configuration
 */
export type AuthClientSession = NonNullable<ReturnType<typeof import('@/lib/auth-client').authClient.useSession>['data']>;
export type AuthClientOrganization = NonNullable<ReturnType<typeof import('@/lib/auth-client').authClient.useListOrganizations>['data']>[number];
export type AuthClientActiveOrganization = NonNullable<ReturnType<typeof import('@/lib/auth-client').authClient.useActiveOrganization>['data']>;

/**
 * API Response wrapper types
 */
export type APIResponse<T> = {
  data: T | null;
  error: string | null;
  success: boolean;
};

export type PaginatedAPIResponse<T> = APIResponse<{
  items: T[];
  total: number;
  page: number;
  limit: number;
}>;

/**
 * Organization role types from Better Auth configuration
 */
export type OrganizationRole = 'owner' | 'supervisor' | 'employee';
export type SystemRole = 'admin' | 'user';

/**
 * Utility type for forms that create/update organizations
 */
export type OrganizationFormData = Pick<Organization, 'name' | 'slug'> & {
  logo?: string | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * Utility type for member invitation forms
 */
export type InvitationFormData = {
  email: string;
  role: OrganizationRole;
  teamId?: string;
};