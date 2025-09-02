"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { Users, UserCog, Shield, Users as TeamIcon, Settings, Activity } from "lucide-react";
import Link from "next/link";

export default function PermissionsOverviewPage() {
  const { data: session } = authClient.useSession();
  const isSystemAdmin = session?.user?.role === "admin";
  const userRole = session?.user?.role || "user";

  // 如果不是系統管理員，顯示無權限消息
  if (!isSystemAdmin) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="font-medium text-yellow-800">
                  權限管理僅限系統管理員
                </div>
                <div className="text-sm text-yellow-700">
                  您當前的角色是 {userRole}，無法存取權限管理功能。
                  如需權限變更，請聯絡系統管理員。
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const permissionCards = [
    {
      title: "用戶角色管理",
      description: "管理系統用戶和組織成員的角色分配",
      icon: Users,
      href: "/dashboard/permissions/users",
      permission: "user:list",
      count: "待實作", // TODO: 從 API 獲取實際數量
    },
    {
      title: "角色權限矩陣",
      description: "查看和管理各角色的權限配置",
      icon: Shield,
      href: "/dashboard/permissions/roles",
      permission: "user:read",
      count: "5個角色",
    },
    {
      title: "團隊權限管理",
      description: "管理組織內團隊的權限和成員",
      icon: TeamIcon,
      href: "/dashboard/permissions/teams",
      permission: "team:read",
      count: "待實作",
    },
    {
      title: "權限審計日誌",
      description: "查看權限變更和操作記錄",
      icon: Activity,
      href: "/dashboard/permissions/audit",
      permission: "user:list",
      count: "待實作",
    }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">權限管理</h1>
          <p className="text-muted-foreground">
            管理系統和組織權限，用戶角色，和存取控制
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isSystemAdmin ? "default" : "secondary"}>
            {isSystemAdmin ? "系統管理員" : `${userRole} 角色`}
          </Badge>
        </div>
      </div>

      {/* Permission System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            權限系統狀態
          </CardTitle>
          <CardDescription>
            Better Auth 權限系統集成狀態和配置資訊
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">系統角色</div>
                <div className="text-sm text-muted-foreground">Admin, User</div>
              </div>
              <Badge variant="outline">2個</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">組織角色</div>
                <div className="text-sm text-muted-foreground">Admin, Member, Guest</div>
              </div>
              <Badge variant="outline">3個</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">資源類型</div>
                <div className="text-sm text-muted-foreground">User, Organization, Project等</div>
              </div>
              <Badge variant="outline">7個</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permission Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {permissionCards.map((card) => {
          const Icon = card.icon;
          
          return (
            <Card key={card.title} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Icon className="h-6 w-6 text-primary" />
                  {card.title}
                </CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    數量: {card.count}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    需要: {card.permission}
                  </Badge>
                </div>
                
                <Button asChild className="w-full">
                  <Link href={card.href}>
                    進入管理
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>
            常用的權限管理操作
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard/permissions/users">
                <UserCog className="h-4 w-4 mr-2" />
                管理用戶角色
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link href="/dashboard/permissions/roles">
                <Shield className="h-4 w-4 mr-2" />
                查看權限矩陣
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link href="/dashboard/permissions/audit">
                <Activity className="h-4 w-4 mr-2" />
                查看操作日誌
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}