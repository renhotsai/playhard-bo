"use client";

import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { StoreIcon, ArrowLeft, Building2 } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

// Validation functions
const validateRequired = (value: string) => {
  if (!value || value.trim().length === 0) return "此欄位為必填";
  return undefined;
};

const validateEmail = (value: string) => {
  if (!value) return undefined; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return "請輸入有效的 Email 地址";
  return undefined;
};

const validatePhone = (value: string) => {
  if (!value) return undefined; // Optional field
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  if (!phoneRegex.test(value)) return "請輸入有效的電話號碼";
  return undefined;
};

type CreateStoreFormData = {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  isActive: boolean;
};

export default function CreateStorePage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as string;
  const queryClient = useQueryClient();

  // Create store mutation
  const createStoreMutation = useMutation({
    mutationFn: async (storeData: CreateStoreFormData) => {
      const response = await fetch(`/api/organizations/${organizationId}/stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '門店創建失敗');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('門店創建成功');
      // Invalidate organization stores and detail queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.organizations.stores(organizationId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.organizations.detail(organizationId) 
      });
      // Navigate back to organization page
      router.push(`/dashboard/organizations/${organizationId}`);
    },
    onError: (error: Error) => {
      toast.error(`創建失敗: ${error.message}`);
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "TW",
      phone: "",
      email: "",
      isActive: true,
    } as CreateStoreFormData,
    onSubmit: async ({ value }) => {
      createStoreMutation.mutate(value);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <StoreIcon className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">創建新門店</h1>
            <p className="text-muted-foreground">
              為組織添加新的門店位置
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            門店資訊
          </CardTitle>
          <CardDescription>
            請填寫門店的基本資訊和聯繫方式
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
            {/* Basic Information */}
            <div className="grid gap-6 md:grid-cols-2">
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => validateRequired(value),
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="name">門店名稱 *</Label>
                    <Input
                      id="name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="輸入門店名稱"
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="isActive"
              >
                {(field) => (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="isActive">門店狀態</Label>
                      <p className="text-sm text-muted-foreground">
                        啟用後門店將顯示在系統中
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                    />
                  </div>
                )}
              </form.Field>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">地址資訊</h3>
              
              <form.Field
                name="address"
                validators={{
                  onChange: ({ value }) => validateRequired(value),
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="address">地址 *</Label>
                    <Input
                      id="address"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="輸入詳細地址"
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <div className="grid gap-4 md:grid-cols-3">
                <form.Field name="city">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="city">城市</Label>
                      <Input
                        id="city"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="城市"
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="state">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="state">縣市</Label>
                      <Input
                        id="state"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="縣市"
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="zipCode">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">郵遞區號</Label>
                      <Input
                        id="zipCode"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="郵遞區號"
                      />
                    </div>
                  )}
                </form.Field>
              </div>

              <form.Field name="country">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="country">國家</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TW">台灣</SelectItem>
                        <SelectItem value="CN">中國</SelectItem>
                        <SelectItem value="HK">香港</SelectItem>
                        <SelectItem value="MO">澳門</SelectItem>
                        <SelectItem value="SG">新加坡</SelectItem>
                        <SelectItem value="MY">馬來西亞</SelectItem>
                        <SelectItem value="US">美國</SelectItem>
                        <SelectItem value="CA">加拿大</SelectItem>
                        <SelectItem value="JP">日本</SelectItem>
                        <SelectItem value="KR">韓國</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">聯繫資訊</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <form.Field
                  name="phone"
                  validators={{
                    onChange: ({ value }) => validatePhone(value),
                  }}
                >
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="phone">電話號碼</Label>
                      <Input
                        id="phone"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="例：02-1234-5678"
                        aria-invalid={field.state.meta.errors.length > 0}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-sm text-destructive">
                          {field.state.meta.errors[0]}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>

                <form.Field
                  name="email"
                  validators={{
                    onChange: ({ value }) => validateEmail(value),
                  }}
                >
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="email">電子郵件</Label>
                      <Input
                        id="email"
                        type="email"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="store@example.com"
                        aria-invalid={field.state.meta.errors.length > 0}
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-sm text-destructive">
                          {field.state.meta.errors[0]}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-6 border-t">
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isFormSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={!canSubmit || isFormSubmitting || createStoreMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <StoreIcon className="h-4 w-4" />
                    {isFormSubmitting || createStoreMutation.isPending ? '創建中...' : '創建門店'}
                  </Button>
                )}
              </form.Subscribe>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createStoreMutation.isPending}
              >
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}