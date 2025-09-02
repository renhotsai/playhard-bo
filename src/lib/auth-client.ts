"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient, magicLinkClient, organizationClient, usernameClient } from "better-auth/client/plugins";
import { ac, admin, employee, owner, supervisor } from './permissions';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    usernameClient(),
    
    // Admin client with full permission configuration
    adminClient({
      ac,
      roles: {
	      admin
			}
    }),
    
    magicLinkClient(),
    
    // Organization client with permission configuration
    organizationClient({
      ac,                             // 統一權限控制器
	    roles: {
		    owner,
		    supervisor,
		    employee
	    },      // 組織級角色配置
      teams: {
        enabled: true
      }
    })
  ],
});