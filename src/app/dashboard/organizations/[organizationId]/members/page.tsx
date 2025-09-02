"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Users, Mail, UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Member {
  id: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
}

interface OrganizationDetails {
  id: string;
  name: string;
  memberCount: number;
  members: Member[];
  pendingInvitations: Invitation[];
}

export default function OrganizationMembersPage() {
  const params = useParams();
  const organizationId = params.organizationId as string;
  const [organization, setOrganization] = useState<OrganizationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrganizationDetails = async () => {
    try {
      const response = await fetch('/api/organizations');
      if (response.ok) {
        const data = await response.json();
        const org = data.organizations.find((o: { id: string }) => o.id === organizationId);
        if (org) {
          setOrganization(org);
        } else {
          toast.error('Organization not found');
        }
      } else {
        toast.error('Failed to load organization details');
      }
    } catch (error) {
      console.error('Failed to fetch organization:', error);
      toast.error('Failed to load organization details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchOrganizationDetails();
    }
  }, [organizationId]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '擁有者';
      case 'member':
        return '成員';
      case 'guest':
        return '訪客';
      default:
        return role;
    }
  };

  const getRoleVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'member':
        return 'secondary';
      case 'guest':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const isInvitationExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">載入成員資料中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">找不到商戶</h3>
            <p className="text-muted-foreground mb-4">請檢查連結是否正確</p>
            <Button asChild>
              <Link href={`/dashboard/organizations/${organizationId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回商戶詳情
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/organizations/${organizationId}`}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回商戶詳情
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">{organization.name} - 成員管理</h1>
          <p className="text-muted-foreground mt-2">
            管理商戶成員及邀請狀態
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/organizations/${organizationId}/invite`}>
            <UserPlus className="mr-2 h-4 w-4" />
            邀請成員
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Current Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              目前成員 ({organization.members.length})
            </CardTitle>
            <CardDescription>
              商戶的所有活躍成員
            </CardDescription>
          </CardHeader>
          <CardContent>
            {organization.members.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                尚無成員
              </p>
            ) : (
              <div className="space-y-4">
                {organization.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {member.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user.name}</p>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleVariant(member.role)}>
                        {getRoleLabel(member.role)}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        加入於 {new Date(member.createdAt).toLocaleDateString('zh-TW')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {organization.pendingInvitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                待接受邀請 ({organization.pendingInvitations.length})
              </CardTitle>
              <CardDescription>
                已發送但尚未接受的邀請
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organization.pendingInvitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {isInvitationExpired(invitation.expiresAt) ? '邀請已過期' : '等待接受邀請'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleVariant(invitation.role)}>
                        {getRoleLabel(invitation.role)}
                      </Badge>
                      {isInvitationExpired(invitation.expiresAt) ? (
                        <Badge variant="destructive">已過期</Badge>
                      ) : (
                        <Badge variant="outline">待接受</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}