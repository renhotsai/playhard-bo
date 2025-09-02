/*
  Warnings:

  - You are about to drop the `teamPermission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `userPermission` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."teamPermission" DROP CONSTRAINT "teamPermission_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."userPermission" DROP CONSTRAINT "userPermission_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."userPermission" DROP CONSTRAINT "userPermission_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."userPermission" DROP CONSTRAINT "userPermission_userId_fkey";

-- DropTable
DROP TABLE "public"."teamPermission";

-- DropTable
DROP TABLE "public"."userPermission";

-- CreateTable
CREATE TABLE "public"."permission_template" (
    "id" TEXT NOT NULL,
    "roleType" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_permission_override" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "user_permission_override_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permission_audit_log" (
    "id" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "organizationId" TEXT,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permission_template_roleType_roleName_resource_action_key" ON "public"."permission_template"("roleType", "roleName", "resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "user_permission_override_userId_organizationId_resource_act_key" ON "public"."user_permission_override"("userId", "organizationId", "resource", "action");

-- AddForeignKey
ALTER TABLE "public"."user_permission_override" ADD CONSTRAINT "user_permission_override_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_permission_override" ADD CONSTRAINT "user_permission_override_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."permission_audit_log" ADD CONSTRAINT "permission_audit_log_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."permission_audit_log" ADD CONSTRAINT "permission_audit_log_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
