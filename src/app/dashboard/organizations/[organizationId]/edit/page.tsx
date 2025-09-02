"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  ArrowLeft, 
  Save,
  Loader2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

// Validation schema
const editOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "商戶名稱至少需要 2 個字元")
    .max(50, "商戶名稱不能超過 50 個字元")
    .regex(/^[\u4e00-\u9fff\w\s-]+$/, "商戶名稱只能包含中文、英文、數字、空格和破折號"),
});

interface OrganizationDetail {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

interface UpdateOrganizationData {
  name: string;
}

export default function EditOrganizationPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.organizationId as string;
  
  const [organization, setOrganization] = useState<OrganizationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch organization details using Better Auth
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await authClient.organization.getFullOrganization({
          organizationId
        });
        
        if (result.data) {
          setOrganization(result.data as OrganizationDetail);
        } else {
          throw new Error('組織未找到');
        }
      } catch (err) {
        console.error('Failed to fetch organization:', err);
        setError(err instanceof Error ? err : new Error('載入組織失敗'));
      } finally {
        setIsLoading(false);
      }
    };

    if (organizationId) {
      fetchOrganization();
    }
  }, [organizationId]);

  // Update organization using Better Auth
  const updateOrganization = async (data: UpdateOrganizationData) => {
    try {
      setIsUpdating(true);
      const result = await authClient.organization.update({
        organizationId,
        data: {
          name: data.name
        }
      });
      
      if (result.data) {
        toast.success("商戶資料更新成功！");
        router.push(`/dashboard/organization/${organizationId}`);
      } else {
        throw new Error('更新失敗');
      }
    } catch (err) {
      console.error('Failed to update organization:', err);
      const errorMessage = err instanceof Error ? err.message : '更新商戶失敗';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const form = useForm({
    defaultValues: {
      name: organization?.name || "",
    },
    onSubmit: async ({ value }) => {
      await updateOrganization(value);
    },
  });

  // Update form when organization data loads
  if (organization && form.state.values.name !== organization.name) {
    form.setFieldValue('name', organization.name);
  }

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
                <Button onClick={() => router.back()} variant="outline" size="sm">
                  返回
                </Button>
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
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <Link href={`/dashboard/organizations/${organizationId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回商戶詳情
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">編輯商戶</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              修改 {organization.name} 的基本資訊
            </p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              商戶基本資訊
            </CardTitle>
            <CardDescription>
              更新商戶的名稱和其他基本設定
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await form.handleSubmit();
              }}
              className="space-y-6"
            >
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => {
                    const result = editOrganizationSchema.shape.name.safeParse(value);
                    if (!result.success) {
                      return result.error.issues[0].message;
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="name">商戶名稱 *</Label>
                    <Input
                      id="name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="請輸入商戶名稱"
                      disabled={updateMutation.isPending}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <Separator />

              <div className="space-y-2">
                <Label>商戶代碼</Label>
                <div className="p-3 bg-muted rounded-md">
                  <code className="text-sm">@{organization.slug}</code>
                  <p className="text-xs text-muted-foreground mt-1">
                    商戶代碼無法修改
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>建立時間</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">
                    {new Date(organization.createdAt).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <Separator />

              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isFormSubmitting]) => (
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={!canSubmit || isFormSubmitting || isUpdating}
                      className="flex-1"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          更新中...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          保存更改
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      asChild
                      disabled={isUpdating}
                    >
                      <Link href={`/dashboard/organizations/${organizationId}`}>
                        取消
                      </Link>
                    </Button>
                  </div>
                )}
              </form.Subscribe>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}