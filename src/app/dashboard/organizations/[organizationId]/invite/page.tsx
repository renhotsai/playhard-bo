"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// import { InviteUserForm } from "@/components/forms/invite-user-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

interface OrganizationInfo {
  id: string;
  name: string;
  userRole: string;
}

export default function InviteUserPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const organizationId = params.organizationId as string;
  const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizationInfo = async () => {
      try {
        const response = await fetch('/api/organizations');
        if (response.ok) {
          const data = await response.json();
          const org = data.organizations.find((o: { id: string; name: string; members: Array<{ user: { id: string }; role: string }> }) => o.id === organizationId);
          if (org) {
            const userMembership = org.members.find((member: { user: { id: string }; role: string }) => member.user.id === user?.id);
            setOrganizationInfo({
              id: org.id,
              name: org.name,
              userRole: userMembership?.role || 'member'
            });
          } else {
            toast.error('Organization not found');
            router.push('/dashboard/merchants');
          }
        }
      } catch (error) {
        console.error('Failed to fetch organization:', error);
        toast.error('Failed to load organization details');
        router.push('/dashboard/merchants');
      } finally {
        setIsLoading(false);
      }
    };

    if (organizationId && user) {
      fetchOrganizationInfo();
    }
  }, [organizationId, user, router]);

  const handleSuccess = () => {
    router.push(`/dashboard/organization/${organizationId}/members`);
  };

  const canAssignAdminRole = user?.role === 'admin' || organizationInfo?.userRole === 'admin';

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">載入中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!organizationInfo) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">找不到商戶</h3>
            <p className="text-muted-foreground mb-4">請檢查連結是否正確</p>
            <Button asChild>
              <Link href="/dashboard/merchants">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回商戶列表
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/organizations/${organizationId}/members`}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回成員列表
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">邀請新成員</h1>
          <p className="text-muted-foreground mt-2">
            邀請新用戶加入 {organizationInfo.name}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              邀請功能暫時停用 - 請使用用戶管理頁面創建用戶
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}