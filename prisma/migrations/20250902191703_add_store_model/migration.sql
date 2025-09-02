/*
  Warnings:

  - You are about to drop the `permission_audit_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permission_template` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_permission_override` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."permission_audit_log" DROP CONSTRAINT "permission_audit_log_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."permission_audit_log" DROP CONSTRAINT "permission_audit_log_targetUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_permission_override" DROP CONSTRAINT "user_permission_override_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_permission_override" DROP CONSTRAINT "user_permission_override_userId_fkey";

-- DropTable
DROP TABLE "public"."permission_audit_log";

-- DropTable
DROP TABLE "public"."permission_template";

-- DropTable
DROP TABLE "public"."user_permission_override";

-- CreateTable
CREATE TABLE "public"."store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT DEFAULT 'TW',
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."store" ADD CONSTRAINT "store_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
