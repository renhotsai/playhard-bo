"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Users, UserCog, Search, Filter, Plus, Edit3, Shield, Crown, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  role?: string;
  banned?: boolean;
  createdAt: string;
  organizations?: Array<{
    organization: { id: string; name: string };
    role: string;
    joinedAt: string;
  }>;
}

export default function UserRoleManagementPage() {
  const { data: session } = authClient.useSession();
  const isSystemAdmin = session?.user?.role === "admin";
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState<string>("");

  // Fetch users with their roles and organizations
  const { data: users = [], isLoading } = useQuery({
    queryKey: queryKeys.users.list({ search: searchTerm, role: roleFilter }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (roleFilter && roleFilter !== 'all') params.set('role', roleFilter);
      
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      return data.users as User[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update user role mutation
  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user role');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
      toast.success('用戶角色已成功更新');
      setShowRoleDialog(false);
      setSelectedUser(null);
      setNewRole("");
    },
    onError: (error: Error) => {
      toast.error(`更新失敗: ${error.message}`);
    },
  });


  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const handleUpdateRole = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role || 'user');
    setShowRoleDialog(true);
  };

  const handleRoleSubmit = () => {
    if (!selectedUser || !newRole) return;
    
    updateUserRole.mutate({
      userId: selectedUser.id,
      role: newRole,
    });
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'user':
        return <UserIcon className="h-4 w-4 text-blue-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'default' as const;
      case 'user':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
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
                用戶角色管理功能僅限系統管理員使用
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
              <Users className="h-8 w-8" />
              用戶角色管理
            </h1>
            <p className="text-muted-foreground">
              管理系統用戶的角色和權限分配
            </p>
          </div>
          
          <Button asChild>
            <Link href="/dashboard/users/create">
              <Plus className="h-4 w-4 mr-2" />
              創建新用戶
            </Link>
          </Button>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">搜索和篩選</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">搜索用戶</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="姓名、郵箱或用戶名..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role-filter">角色篩選</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有角色</SelectItem>
                    <SelectItem value="admin">系統管理員</SelectItem>
                    <SelectItem value="user">普通用戶</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setRoleFilter("all");
                  }}
                  className="w-full"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  清除篩選
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              用戶列表 ({filteredUsers.length})
            </CardTitle>
            <CardDescription>
              系統中所有用戶的角色和狀態管理
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用戶資訊</TableHead>
                    <TableHead>系統角色</TableHead>
                    <TableHead>組織關係</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>註冊時間</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        載入中...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        沒有找到符合條件的用戶
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            {user.username && (
                              <div className="text-xs text-muted-foreground">@{user.username}</div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge 
                            variant={getRoleBadgeVariant(user.role)}
                            className="flex items-center gap-1 w-fit"
                          >
                            {getRoleIcon(user.role)}
                            {user.role === 'admin' ? '系統管理員' : '普通用戶'}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            {user.organizations?.length ? (
                              user.organizations.slice(0, 2).map((org, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {org.organization.name} ({org.role})
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">無組織關係</span>
                            )}
                            {user.organizations && user.organizations.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{user.organizations.length - 2} 個組織
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant={user.banned ? "destructive" : "outline"}>
                            {user.banned ? "已封禁" : "正常"}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm">
                            {new Date(user.createdAt).toLocaleDateString('zh-TW')}
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateRole(user)}
                            >
                              <UserCog className="h-4 w-4 mr-1" />
                              編輯角色
                            </Button>
                            
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/dashboard/permissions/users/${user.id}`}>
                                <Edit3 className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Role Update Dialog */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>更新用戶角色</DialogTitle>
              <DialogDescription>
                為 {selectedUser?.name} ({selectedUser?.email}) 設置新的系統角色
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role-select">系統角色</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-yellow-600" />
                        系統管理員
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-blue-600" />
                        普通用戶
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {newRole === 'admin' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Crown className="h-4 w-4" />
                    <span className="font-medium">系統管理員權限</span>
                  </div>
                  <div className="text-sm text-yellow-700 mt-1">
                    此用戶將獲得完整的系統管理權限，包括用戶管理、組織管理等。
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                取消
              </Button>
              <Button 
                onClick={handleRoleSubmit}
                disabled={updateUserRole.isPending || !newRole}
              >
                {updateUserRole.isPending ? "更新中..." : "確認更新"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}