"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft, Building2, Edit, Loader2, MapPin, Store } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { isSystemAdmin } from "@/lib/permissions";
import { useEffect } from "react";

interface Store {
  id: string;
  name: string;
  address: string;
  city?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Remove mock stores data - now using real data from database

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.organizationId as string;
  const { data: session, isPending: isSessionLoading } = authClient.useSession();
  const { data: userOrganizations } = authClient.useListOrganizations();
  const hasSystemAdminAccess = isSystemAdmin(session?.user?.role);

  // Check if user has permission to view this organization
  useEffect(() => {
    if (!isSessionLoading && session && !hasSystemAdminAccess) {
      // For non-admin users, check if they're a member of this organization
      const hasAccess = userOrganizations?.some(org => org.id === organizationId);
      if (!hasAccess) {
        router.push('/dashboard');
        return;
      }
    }
  }, [isSessionLoading, session, hasSystemAdminAccess, userOrganizations, organizationId, router]);

	const { data: organization, isLoading, error, refetch } = useQuery({
		queryKey: ["organization", organizationId],
		queryFn: async () => {
			const { data, error } = await authClient.organization.getFullOrganization({
				query:{
					organizationId: organizationId,
				}
			});
			if (error) throw new Error(error.message);

			return data;
		},
		enabled: !!organizationId,
	});

	// Fetch stores for the organization
	const { data: storesData, isLoading: isLoadingStores } = useQuery({
		queryKey: ["organization", organizationId, "stores"],
		queryFn: async () => {
			const response = await fetch(`/api/organizations/${organizationId}/stores`);
			if (!response.ok) {
				throw new Error('Failed to fetch stores');
			}
			return response.json();
		},
		enabled: !!organizationId && !!organization,
	});


  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground mt-2">載入商戶資料中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold mb-2">載入失敗</h3>
                <p className="text-muted-foreground mb-4">
                  {error instanceof Error ? error.message : '無法載入商戶資料'}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => refetch()} variant="outline" size="sm">
                    重試
                  </Button>
                  <Button onClick={() => router.back()} variant="ghost" size="sm">
                    返回
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Only show back button for system admin users */}
          {hasSystemAdminAccess && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">{organization.name}</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              建立於 {new Date(organization.createdAt).toLocaleDateString('zh-TW')}
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-6">
        {/* 商戶資訊 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              商戶資訊
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">商戶名稱</div>
              <div className="text-base">{organization.name}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">門店數量</div>
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                <span>{storesData?.stores?.length || 0} 家門店</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 門店列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                門店列表
              </CardTitle>
              <CardDescription>
                商戶旗下的所有門店資訊
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/organizations/${organizationId}/stores/create`}>
                <Store className="h-4 w-4 mr-2" />
                添加門店
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingStores ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-2">載入門店資料中...</p>
            </div>
          ) : storesData?.stores && storesData.stores.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>門店名稱</TableHead>
                    <TableHead>地址</TableHead>
                    <TableHead>聯絡資訊</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>建立時間</TableHead>
                    <TableHead>編輯時間</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storesData.stores.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell className="font-medium">{store.name}</TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <div>{store.address}</div>
                            {store.city && (
                              <div className="text-muted-foreground">
                                {store.city} {store.zipCode}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {store.phone && (
                            <div className="text-muted-foreground">
                              電話: {store.phone}
                            </div>
                          )}
                          {store.email && (
                            <div className="text-muted-foreground">
                              Email: {store.email}
                            </div>
                          )}
                          {!store.phone && !store.email && (
                            <div className="text-muted-foreground">無聯絡資訊</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={store.isActive ? "default" : "secondary"}>
                          {store.isActive ? "營業中" : "暫停營業"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(store.createdAt).toLocaleDateString('zh-TW')}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(store.updatedAt).toLocaleDateString('zh-TW')}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/organizations/${organizationId}/stores/${store.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            編輯
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">尚無門店</h3>
              <p className="text-muted-foreground mb-4">
                此商戶尚未添加任何門店資訊
              </p>
              <Button variant="outline" asChild>
                <Link href={`/dashboard/organizations/${organizationId}/stores/create`}>
                  <Store className="h-4 w-4 mr-2" />
                  添加門店
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}