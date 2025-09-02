"use client";

import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

// Simple validation functions
const validateName = (value: string) => {
  if (!value || value.length < 2) return "姓名至少需要 2 個字元";
  if (value.length > 100) return "姓名不能超過 100 個字元";
  return undefined;
};

const validateEmail = (value: string) => {
  if (!value) return "Email 為必填項目";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return "請輸入有效的 Email 地址";
  return undefined;
};

type CreateOrgUserInput = {
  name: string;
  email: string;
  role: string;
  organizationId: string;
};

interface CreateOrgUserFormProps {
  onSuccess?: () => void;
  defaultOrganizationId?: string;
}

export function CreateOrgUserForm({ onSuccess, defaultOrganizationId }: CreateOrgUserFormProps) {
  // Fetch organizations for select dropdown
  const { data: organizationsData, isLoading: isLoadingOrgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await fetch('/api/organizations/list');
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }
      return response.json();
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      role: "",
      organizationId: defaultOrganizationId || "",
    } as CreateOrgUserInput,
    onSubmit: async ({ value }) => {
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: value.name,
            email: value.email,
            type: 'organization',
            role: value.role,
            organizationId: value.organizationId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || "操作失敗");
          return;
        }

        toast.success(data.message);
        
        if (onSuccess) {
          onSuccess();
        }
      } catch (err) {
        console.error("Create organization user error:", err);
        toast.error(err instanceof Error ? err.message : "操作失敗");
      }
    },
  });

  return (
    <form 
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await form.handleSubmit();
      }}
      className="space-y-4 max-w-md"
    >
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) => validateName(value),
        }}
      >
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="name">姓名 *</Label>
            <Input
              id="name"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="輸入用戶姓名"
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
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="輸入 Email 地址"
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
        name="organizationId"
        validators={{
          onChange: ({ value }) => !value ? "請選擇組織" : undefined,
        }}
      >
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="organizationId">組織 *</Label>
            <Select
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value)}
              disabled={isLoadingOrgs}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingOrgs ? "載入中..." : "選擇組織"} />
              </SelectTrigger>
              <SelectContent>
                {organizationsData?.organizations?.map((org: { id: string; name: string }) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field
        name="role"
        validators={{
          onChange: ({ value }) => !value ? "請選擇角色" : undefined,
        }}
      >
        {(roleField) => (
          <div className="space-y-2">
            <Label htmlFor="role">組織角色 *</Label>
            <Select
              value={roleField.state.value}
              onValueChange={(value) => roleField.handleChange(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner - 組織擁有者</SelectItem>
                <SelectItem value="supervisor">Supervisor - 組織主管</SelectItem>
                <SelectItem value="employee">Employee - 組織員工</SelectItem>
              </SelectContent>
            </Select>
            {roleField.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">
                {roleField.state.meta.errors[0]}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              組織邀請將發送邀請郵件
            </p>
          </div>
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isFormSubmitting]) => (
          <Button 
            type="submit" 
            disabled={!canSubmit || isFormSubmitting}
            className="w-full"
          >
            {isFormSubmitting ? '發送邀請中...' : '發送組織邀請'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}