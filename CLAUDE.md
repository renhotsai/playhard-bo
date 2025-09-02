# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Backoffice (BO)** application for PlayHard - a Next.js 15 admin panel for managing users, organizations, and business operations. This is part of a larger multi-project monorepo.

## Development Commands

**Core Commands:**
- `npm run dev` - Start development server with Turbopack on port 3000
- `npm run build` - Build application with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

**Database Commands:**
- `npx prisma generate` - Generate Prisma client (output to src/generated/prisma)
- `npx prisma migrate dev` - Run database migrations
- `npx prisma studio` - Open Prisma Studio
- `npx prisma db push` - Push schema changes to database

**API Testing:**
- Visit `http://localhost:3000/api/auth/reference` - Better Auth OpenAPI documentation
- Use Swagger UI to test authentication endpoints interactively
- All Better Auth endpoints are automatically documented and testable

## Tech Stack & Architecture

**Core Technologies:**
- **Next.js 15** with App Router and Turbopack
- **Better Auth** with username, admin, organization, and magic-link plugins
- **Prisma ORM** with PostgreSQL (custom output to src/generated/prisma)
- **TanStack Suite** as project standard (https://tanstack.com/):
  - **TanStack React Query v5** for server state management
  - **TanStack React Form** for form state management and validation
  - **TanStack React Table** for data tables and datagrids
- **shadcn/ui** component library with Radix UI
- **Tailwind CSS** for styling
- **Resend** for email services

**Authentication System:**
- Better Auth with session-based authentication (see BETTER_AUTH_REFERENCE.md for detailed patterns)
- Magic Link authentication for user invitations
- Multi-level permission system (system admin, organization roles)
- Username plugin for user identification
- Organization plugin with teams support
- OpenAPI plugin for API documentation and testing
- Framework-agnostic TypeScript authentication library

## Database Schema Architecture

**Core Better Auth Tables:**
- `user` - User accounts with basic info and role field
- `session` - User sessions with organization context
- `account` - OAuth accounts and passwords
- `verification` - Email verification and magic links

**Organization Management:**
- `organization` - Companies/merchants with slug and metadata
- `member` - User-organization relationships with roles
- `invitation` - Pending organization invitations
- `team` - Teams within organizations
- `teamMember` - User-team relationships

**Role System:**
- **System Roles:** 'admin' (stored in user.role)
- **Organization Roles:** 'owner', 'supervisor', 'employee' (stored in member.role)
- Hierarchical permissions with system admin having global access

## Permission System Architecture

**Current Permission System:**
The system uses Better Auth's built-in access control with a simplified role-based approach:

1. **Role Definitions (`src/lib/permissions.ts`):**
   - 4-tier hierarchy: System Admin (4) > Owner (3) > Supervisor (2) > Employee (1)
   - Better Auth access control integration with `createAccessControl()`
   - Role-based permissions using Better Auth statements
   - Hierarchical role creation permissions (admin can create all, owner excludes admin, etc.)

2. **Authentication Flow:**
   - System-level roles stored in `user.role` field
   - Organization-level roles stored in `member.role` field  
   - Session-based authentication with organization context
   - Magic link authentication for invitations

## Key Architecture Components

**Authentication & Authorization:**
- `src/lib/auth.ts` - Better Auth server configuration with plugins
- `src/lib/auth-client.ts` - Client-side auth methods and hooks
- `src/middleware.ts` - Next.js middleware for session-based route protection
- `src/lib/permissions.ts` - Role hierarchy definitions and utility functions

**UI Components:**
- `src/components/app-sidebar.tsx` - Navigation sidebar with role-based menu items
- `src/app/dashboard/layout.tsx` - Dashboard layout with sidebar integration
- `src/components/ui/` - shadcn/ui components for consistent styling
- `src/components/forms/` - Form components using TanStack Form

**API Architecture:**
- `/api/auth/[...all]/route.ts` - Better Auth API handler
- Organization-scoped endpoints with automatic role validation
- Custom pagination and error handling patterns
- System admin specific routes for global operations

## API Architecture

**Better Auth Routes:**
- `/api/auth/[...all]` - Better Auth handler
- `/api/auth/magic-link/verify` - Magic link verification with invitation support

**Business Logic APIs:**
- `/api/organizations` - Organization CRUD operations
- `/api/organizations/[id]/invite` - User invitation to organizations
- `/api/create-admin` - System admin creation

**API Development Patterns:**
- Check authentication status using Better Auth session validation
- System admin routes check `isSystemAdmin(session.user.role)`
- Organization-scoped data with pagination support
- Consistent error handling with appropriate HTTP status codes
- Transform API responses to match frontend expectations

## Environment Configuration

**Required Environment Variables:**
```env
DATABASE_URL="postgres://postgres:password@localhost:5432/playhard"
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000/api/auth"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RESEND_API_KEY="your-resend-api-key"
```

**Better Auth Configuration:**
- Session-based authentication with PostgreSQL adapter
- Enhanced organization plugin with role-based permissions and teams support
- Magic link expiration: 15 minutes with custom invitation email handling
- Admin plugin with comprehensive access control integration
- Organization creation restricted to system admins only
- New user callback: `/set-username`
- Default callback: `/dashboard`

## User Management Flow

**Admin User Creation:**
1. System admin uses `/api/create-admin` to create admin users
2. Magic link sent via Resend email service
3. User clicks link → auto-login → set username if needed → dashboard

**Merchant Creation & Invitation Flow:**
1. Admin creates user account via Better Auth `signUp.email()` 
2. Admin creates organization via Better Auth `organization.create()`
3. Admin sends invitation via `organization.inviteMember()`
4. User receives email with invitation link
5. User clicks link → `/accept-invitation/[invitationId]` → login if needed
6. After login → auto-accepts invitation → checks username
7. If no username: redirect to `/set-username`, else redirect to `/dashboard`

**Permission Hierarchy:**
- **System Admin**: Full access to all organizations and users
- **Organization Owner**: Manage their organization, teams, and members
- **Organization Supervisor**: Manage teams within their organization
- **Organization Employee**: Basic access within their organization

## Development Patterns

**Agent Consultation Requirements:**
- **Better Auth**: For ALL authentication-related implementations, ALWAYS consult the better-auth-validator agent first
- **shadcn/ui**: For ALL UI component implementations, ALWAYS consult the shadcn-ui-designer agent first
- **TanStack**: For query, table, and form implementations, ALWAYS consult the tanstack-expert agent first
  - React Query (server state management)
  - React Table (data tables and datagrids) 
  - React Form (form state management and validation)
- **Next.js**: For project structure, routing, and Next.js best practices, ALWAYS consult the nextjs-compliance-checker agent first

**Better Auth Development Guidelines:**
- **CRITICAL**: For ALL authentication-related implementations, ALWAYS consult the better-auth-validator agent first
- **Priority Rule**: Use `authClient.*` methods whenever possible instead of custom fetch APIs
- **System Admin Exception**: Admin users are NOT members of organizations, so they require custom API endpoints for organization access:
  - Regular users: Use `authClient.organization.list()` and `authClient.organization.listMembers()`  
  - System Admin: Use `/api/admin/organizations` and `/api/admin/organizations/members/[id]` custom endpoints
- **API Development**: Always verify Better Auth API availability before implementing custom solutions
- **Consultation Required**: Any auth-related code must be validated against Better Auth documentation patterns

**Authentication & Session Patterns:**
- Use `useSession()` hook from `@/lib/auth-client` for client-side auth state
- Check user roles with `isSystemAdmin()` utility function  
- Session management with Better Auth built-in session handling
- Role-based UI rendering in components like `AppSidebar`

**Database Patterns:**
- Prisma client imported from `@/generated/prisma` (custom output location)
- Use Better Auth's organization APIs: `auth.api.listUserOrganizations()`
- System admins access all data, regular users get filtered results
- Always validate user permissions before database operations

**TanStack Query Patterns (Project Standard):**
- Use custom hooks in `src/hooks/` for API calls (see TANSTACK_QUERY_REFERENCE.md)
- Follow query key naming convention: `entityKeys.all()`, `entityKeys.detail(id)`
- Implement optimistic updates for better UX
- Use QueryClient for cache management and invalidation
- Always handle loading, error, and success states
- Configure stale time (5min) and cache time (10min) appropriately
- Use React Query DevTools in development

**TanStack Form Patterns (Project Standard):**
- Use TanStack Form for all form implementations (see TANSTACK_FORM_REFERENCE.md)
- Implement schema validation with Zod for type safety
- Handle async validation with debouncing
- Use field-level granular reactivity
- Integrate with TanStack Query for data mutations

**TanStack Table Patterns (Project Standard):**
- Use TanStack Table for all data tables (see TANSTACK_TABLE_REFERENCE.md)
- Implement headless UI with full control over styling
- Support sorting, filtering, pagination, and row selection
- Integrate with TanStack Query for server-side data
- Use shadcn/ui components for consistent table styling

**Email Integration:**
- Resend service for transactional emails
- HTML templates in `src/templates/emails/`
- Magic link email for user invitations

## File Structure

```
src/
   app/                    # Next.js App Router
      api/               # API routes
      dashboard/         # Protected admin pages
      login/             # Authentication pages
      set-username/      # User onboarding
   components/            # React components
      ui/               # shadcn/ui components
      forms/            # Form components
      auth-*.tsx        # Authentication components
   lib/                   # Utilities and services
      auth.ts           # Better Auth server config
      auth-client.ts    # Better Auth client
      permissions.ts    # Permission service
      email.ts          # Email service
   generated/prisma/      # Generated Prisma client
   templates/emails/      # Email templates
```

## Security Considerations

**Multi-Tenant Security:**
- Organization-scoped data access based on user membership
- Hierarchical permission system: System Admin > Organization Owner > Supervisor > Employee  
- API routes validate organization membership and user roles
- Session-based authentication prevents unauthorized access

**Authentication Security:**
- Better Auth session management with secure cookies
- Magic links expire in 15 minutes for security
- CSRF protection and session validation built into Better Auth
- Role-based access control with clear hierarchy

**API Security:**  
- Session validation on all protected routes
- Role-based data filtering (system admin vs organization member)
- Input validation and error handling with proper HTTP status codes
- Organization membership validation before data access

## 🚧 Current Development: Checkbox-Based Permission System

**IMPORTANT: The system is currently being refactored to a simpler checkbox-based permission management system.**

**Current Status:** The complex role-based permission system is being replaced with a table-based checkbox interface for better usability.

**Active TODO:** See `TODO.md` for detailed implementation plan and current progress.

### New Permission System Overview
- **Simple Design**: Checkbox table interface for managing permissions
- **Two Main Tables**: `Permission` and `OrganizationPermissionLimit`
- **Permission Logic**: User permissions = Direct permissions ∪ Team permissions
- **UI Pattern**: Resource rows with Create/Update/Delete/Read checkboxes plus "All" option

### Key Changes in Progress
1. **Database Schema**: Replacing complex role tables with simple Permission table
2. **Permission Service**: New PermissionService replacing DynamicRoleService
3. **UI Components**: New PermissionMatrix component with checkbox logic
4. **API Endpoints**: New permission management APIs

**⚠️ Legacy Warning:** Files marked with `[LEGACY]` are being phased out during this refactor.

## Reference Documentation

**TanStack Suite (Project Standards):**
- See `TANSTACK_QUERY_REFERENCE.md` for server state management patterns
- See `TANSTACK_FORM_REFERENCE.md` for form state management and validation
- See `TANSTACK_TABLE_REFERENCE.md` for data table implementations
- All based on latest TanStack best practices from https://tanstack.com/

**Better Auth Patterns:**
- See `BETTER_AUTH_REFERENCE.md` for comprehensive Better Auth usage patterns
- Includes plugin configurations, client setup, and security best practices
- Based on official Better Auth LLMs.txt documentation