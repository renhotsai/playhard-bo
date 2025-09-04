"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { Shield, Crown, Users, UserCheck, Eye, Plus, Info } from "lucide-react";
// Remove non-existent imports - we'll define locally or remove functionality

// Role display names mapping
const ROLE_DISPLAY_NAMES: { [key: string]: string } = {
  admin: '系統管理員',
  owner: '組織擁有者',
  supervisor: '組織主管',  
  employee: '組織員工'
};

// Function to get roles that can be created by a given role
const getCreatableRoles = (currentRole: string): string[] => {
  switch (currentRole) {
    case 'admin':
      return ['admin', 'owner', 'supervisor', 'employee'];
    case 'owner':
      return ['supervisor', 'employee'];
    case 'supervisor':
      return ['employee'];
    case 'employee':
      return [];
    default:
      return [];
  }
};

// 角色定義
const ALL_ROLES = [
  {
    id: "admin",
    name: "系統管理員",
    description: "擁有系統完全權限",
    type: "系統角色",
    icon: Crown,
    color: "bg-yellow-100 text-yellow-800"
  },
  {
    id: "owner",
    name: "組織擁有者", 
    description: "組織內的完全權限",
    type: "組織角色",
    icon: Crown,
    color: "bg-purple-100 text-purple-800"
  },
  {
    id: "supervisor",
    name: "組織主管",
    description: "組織內的管理權限",
    type: "組織角色",
    icon: UserCheck,
    color: "bg-orange-100 text-orange-800"
  },
  {
    id: "employee",
    name: "組織員工",
    description: "組織內的基本權限",
    type: "組織角色",
    icon: Users,
    color: "bg-blue-100 text-blue-800"
  }
];

export default function RolePermissionMatrixPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const isSystemAdmin = session?.user?.role === "admin";

  const handleViewRole = (roleId: string) => {
    router.push(`/dashboard/permissions/roles/${roleId}`);
  };

  const handleCreateRole = () => {
    router.push(`/dashboard/permissions/roles/create`);
  };

  // 如果不是系統管理員，顯示無權限消息
  if (!isSystemAdmin) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">需要系統管理員權限</h2>
              <p className="text-muted-foreground">
                角色管理功能僅限系統管理員使用
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8" />
              角色管理
            </h1>
            <p className="text-muted-foreground">
              管理系統中的所有角色和權限
            </p>
          </div>
          <Button onClick={handleCreateRole} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            新增角色
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>角色列表</CardTitle>
            <CardDescription>
              查看和管理系統中的所有角色
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>角色名稱</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>類型</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ALL_ROLES.map((role) => {
                  const Icon = role.icon;
                  return (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          <div className="font-medium">{role.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {role.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={role.color}>
                          {role.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewRole(role.id)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          查看詳情
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              角色建立權限
            </CardTitle>
            <CardDescription>
              各角色可以建立的其他角色權限表
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>當前角色</TableHead>
                  <TableHead>可建立的角色</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      <span className="font-medium">系統管理員 (Admin)</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getCreatableRoles('admin').map((role) => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {ROLE_DISPLAY_NAMES[role]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      <span className="font-medium">組織擁有者 (Owner)</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getCreatableRoles('owner').map((role) => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {ROLE_DISPLAY_NAMES[role]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      <span className="font-medium">組織主管 (Supervisor)</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getCreatableRoles('supervisor').map((role) => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {ROLE_DISPLAY_NAMES[role]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">組織員工 (Employee)</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      無建立權限
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
  );
}