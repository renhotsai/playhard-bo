import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/generated/prisma";
import { 
  admin as adminPlugin, 
  magicLink, 
  openAPI, 
  organization, 
  username 
} from "better-auth/plugins";
import { ac, admin, employee, owner, supervisor } from "./permissions";

const prisma = new PrismaClient();

export const auth = betterAuth({
  // Database configuration
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  
  // Basic configuration
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  
  // Enable email and password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for admin-created accounts
  },
  
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
  
  // Plugins configuration
  plugins: [
    // OpenAPI plugin for API documentation
    openAPI(),
    
    // Username plugin for username support
    username(),
    
    // Admin plugin for SYSTEM-LEVEL administration with full permissions
    adminPlugin({
      ac,
      roles: ["admin"], // Define which user roles have admin privileges
      // Optional: Add specific admin user IDs if needed
      // adminUserIds: ["specific-admin-user-id"],
    }),
    
    // Organization plugin for ORGANIZATION-LEVEL multi-tenant support
    organization({
      ac,                             // 統一權限控制器
      roles: {
	      owner,
	      supervisor,
	      employee
      },       // 組織級角色配置
      
      // Enable teams within organizations
      teams: {
        enabled: true,
      },
      
      // Custom invitation email handler
      sendInvitationEmail: async (data) => {
        const { sendMagicLinkEmail } = await import("./email");

        // Build invitation URL from invitation ID
        const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${data.invitation.id}`;

        await sendMagicLinkEmail({
          email: data.email,
          url: invitationUrl,
          token: data.invitation.id
        });
      },
    }),
    
    // Magic link plugin for passwordless authentication
    magicLink({
      expiresIn: 60 * 15, // 15 minutes
      sendMagicLink: async (data) => {
        const { sendMagicLinkEmail } = await import("./email");
        
        await sendMagicLinkEmail({
          email: data.email,
          url: data.url,
          token: data.token
        });
      }
    }),
  ],
  
  // Advanced configuration
  advanced: {
    crossSubDomainCookies: {
      enabled: false
    },
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});