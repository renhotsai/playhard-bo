"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient, magicLinkClient, organizationClient, usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  fetchOptions: {
    credentials: 'include' as RequestCredentials,
  },
  plugins: [
    usernameClient(),
    adminClient(),
    magicLinkClient(),
    organizationClient({
      teams: {
        enabled: true
      }
    })
  ],
});

// Export all the hooks and methods from authClient that actually exist
export const { 
  useSession, 
  signIn, 
  signOut, 
  signUp,
  organization,
  admin,
  magicLink,
  // Organization hooks with proper types
  useListOrganizations,
  useActiveOrganization
} = authClient;

// Type inference helpers for auth client hooks
export type AuthSession = NonNullable<ReturnType<typeof useSession>['data']>;
export type AuthOrganization = NonNullable<ReturnType<typeof useListOrganizations>['data']>[number];
export type AuthActiveOrganization = NonNullable<ReturnType<typeof useActiveOrganization>['data']>;