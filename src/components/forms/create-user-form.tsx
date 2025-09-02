"use client";

import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

// Simple validation functions using Better Auth standards
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

// Debounced email validation for better UX
const validateEmailDebounced = (value: string) => {
  return new Promise<string | undefined>((resolve) => {
    setTimeout(() => {
      resolve(validateEmail(value));
    }, 300); // 300ms debounce
  });
};

type CreateUserInput = {
  name: string;
  email: string;
  userCategory: 'system' | 'organization';
  userType: 'admin' | 'owner' | 'supervisor' | 'employee';
  organizationOption?: 'existing' | 'new'; // For organization owners
  organizationId?: string;
  organizationName?: string;
};

interface CreateUserFormProps {
  onSuccess?: () => void;
}

export function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const queryClient = useQueryClient();

  // Fetch organizations for select dropdown
  const { data: organizationsData, isLoading: isLoadingOrgs } = useQuery({
    queryKey: queryKeys.organizations.list(),
    queryFn: async () => {
      const response = await fetch('/api/organizations/list');
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }
      return response.json();
    },
  });

  // Create user mutation with proper cache invalidation - Define mutation first
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserInput) => {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          userType: userData.userType,
          organizationId: userData.organizationId || undefined,
          organizationName: userData.organizationName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 創建自定義錯誤對象，包含狀態碼和錯誤信息
        const error = new Error(data.error || "操作失敗") as Error & { status?: number };
        error.status = response.status;
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch the admin users list
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.allUsers(),
      });
      
      // Optionally also invalidate organizations list in case user counts changed
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.all(),
      });

      // Reset the form after successful submission
      form.reset();

      toast.success(data.message);
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      console.error("Create user error:", error);
      console.log("Error status:", 'status' in error ? (error as Error & { status?: number }).status : 'no status');
      
      if (error instanceof Error && 'status' in error) {
        const errorWithStatus = error as Error & { status?: number };
        console.log("Processing error with status:", errorWithStatus.status);
        
        switch (errorWithStatus.status) {
          case 409:
            // Email already exists - provide specific guidance
            toast.error("此 Email 地址已被使用", {
              description: "請使用不同的 Email 地址，或前往用戶列表查看現有用戶。",
              action: {
                label: "查看用戶列表",
                onClick: () => {
                  if (onSuccess) onSuccess(); // Navigate to users list
                }
              }
            });
            break;
          case 403:
            // Permission error
            toast.error("權限不足", {
              description: "您沒有權限執行此操作，請聯繫系統管理員。"
            });
            break;
          case 400:
            // Validation error - show the specific message from API
            toast.error(error.message || "輸入資料有誤", {
              description: "請檢查表單內容並重試。"
            });
            break;
          default:
            // Generic server error
            toast.error(error.message || "操作失敗", {
              description: "請稍後再試，如問題持續請聯繫系統管理員。"
            });
        }
      } else {
        // Fallback for unknown error types
        console.log("Fallback error handling - no status property found");
        toast.error("操作失敗", {
          description: "請稍後再試，如問題持續請聯繫系統管理員。"
        });
      }
    },
  });

  // Initialize form after mutation is defined
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      userCategory: "system" as 'system' | 'organization',
      userType: "admin" as 'admin' | 'owner' | 'supervisor' | 'employee',
      organizationOption: "existing" as 'existing' | 'new',
      organizationId: "",
      organizationName: "",
    } as CreateUserInput,
    validators: {
      // Form-level validation for cross-field dependencies
      onSubmit: ({ value }) => {
        // Organization users validation
        if (value.userCategory === 'organization') {
          if ((value.userType === 'supervisor' || value.userType === 'employee') && !value.organizationId) {
            return {
              form: "Supervisor 和 Employee 必須選擇組織",
              fields: {
                organizationId: "必須選擇組織"
              }
            };
          }
          
          // Owner with organization option validation
          if (value.userType === 'owner') {
            if (value.organizationOption === 'existing' && !value.organizationId) {
              return {
                form: "選擇現有組織時必須指定組織",
                fields: {
                  organizationId: "必須選擇組織"
                }
              };
            }
            if (value.organizationOption === 'new' && !value.organizationName) {
              return {
                form: "創建新組織時必須輸入組織名稱",
                fields: {
                  organizationName: "必須輸入組織名稱"
                }
              };
            }
          }
        }
        return undefined;
      }
    },
    onSubmit: async ({ value }) => {
      // Use the mutation with proper async handling
      await createUserMutation.mutateAsync(value);
    },
  });

  return (
    <form 
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await form.handleSubmit();
      }}
      className="space-y-6 max-w-2xl"
    >
      {/* 用戶分類選擇 */}
      <form.Field
        name="userCategory"
        validators={{
          onChange: ({ value }) => !value ? "請選擇用戶分類" : undefined,
        }}
      >
        {(field) => (
          <div className="space-y-3">
            <Label htmlFor="userCategory">用戶分類 *</Label>
            <RadioGroup
              value={field.state.value}
              onValueChange={(value) => {
                const newCategory = value as 'system' | 'organization';
                field.handleChange(newCategory);
                
                // Reset userType and clear fields when category changes
                if (newCategory === 'system') {
                  form.setFieldValue('userType', 'admin');
                  form.setFieldValue('organizationId', '');
                  form.setFieldValue('organizationName', '');
                  form.setFieldValue('organizationOption', 'existing');
                } else {
                  form.setFieldValue('userType', 'owner');
                  form.setFieldValue('organizationOption', 'new');
                }
              }}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system" className="font-normal">
                  系統用戶 (System Users) - 系統管理員
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="organization" id="organization" />
                <Label htmlFor="organization" className="font-normal">
                  組織用戶 (Organization Users) - 組織擁有者、主管、員工
                </Label>
              </div>
            </RadioGroup>
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* System User Types */}
      <form.Subscribe
        selector={(state) => [state.values.userCategory]}
      >
        {([userCategory]) => (
          userCategory === 'system' && (
            <form.Field
              name="userType"
              validators={{
                onChange: ({ value }) => !value ? "請選擇用戶類型" : undefined,
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="userType">系統用戶類型 *</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇系統用戶類型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin - 系統管理員</SelectItem>
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    系統管理員具備全局權限，不需要歸屬特定組織
                  </p>
                </div>
              )}
            </form.Field>
          )
        )}
      </form.Subscribe>

      {/* Organization User Types */}
      <form.Subscribe
        selector={(state) => [state.values.userCategory]}
      >
        {([userCategory]) => (
          userCategory === 'organization' && (
            <form.Field
              name="userType"
              validators={{
                onChange: ({ value }) => !value ? "請選擇用戶類型" : undefined,
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="userType">組織用戶類型 *</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇組織用戶類型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner - 組織擁有者</SelectItem>
                      <SelectItem value="supervisor">Supervisor - 組織主管</SelectItem>
                      <SelectItem value="employee">Employee - 組織員工</SelectItem>
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    組織用戶僅在指定組織內擁有權限
                  </p>
                </div>
              )}
            </form.Field>
          )
        )}
      </form.Subscribe>

      <form.Field
        name="name"
        validators={{
          onBlur: ({ value }) => validateName(value),
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
          onBlur: ({ value }) => validateEmail(value),
          onChangeAsyncDebounceMs: 300,
          onChangeAsync: async ({ value }) => validateEmailDebounced(value),
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


      {/* Organization Owner Option - Radio Button */}
      <form.Subscribe
        selector={(state) => [state.values.userCategory, state.values.userType]}
      >
        {([userCategory, userType]) => (
          userCategory === 'organization' && userType === 'owner' && (
            <form.Field
              name="organizationOption"
              validators={{
                onChange: ({ value }) => !value ? "請選擇組織選項" : undefined,
              }}
            >
              {(field) => (
                <div className="space-y-3">
                  <Label>組織選項 *</Label>
                  <RadioGroup
                    value={field.state.value}
                    onValueChange={(value) => {
                      const newOption = value as 'existing' | 'new';
                      field.handleChange(newOption);
                      
                      // Clear opposite field when switching
                      if (newOption === 'existing') {
                        form.setFieldValue('organizationName', '');
                      } else {
                        form.setFieldValue('organizationId', '');
                      }
                    }}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="existing" id="existing" />
                      <Label htmlFor="existing" className="font-normal">
                        加入現有組織
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="new" id="new" />
                      <Label htmlFor="new" className="font-normal">
                        創建新組織
                      </Label>
                    </div>
                  </RadioGroup>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          )
        )}
      </form.Subscribe>

      {/* Create New Organization */}
      <form.Subscribe
        selector={(state) => [state.values.userCategory, state.values.userType, state.values.organizationOption]}
      >
        {([userCategory, userType, organizationOption]) => (
          userCategory === 'organization' && userType === 'owner' && organizationOption === 'new' && (
            <form.Field
              name="organizationName"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return "組織名稱為必填項目";
                  if (value.length < 2 || value.length > 50) {
                    return "組織名稱須為 2-50 個字元";
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="organizationName">新組織名稱 *</Label>
                  <Input
                    id="organizationName"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="輸入新組織名稱"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    將創建新組織，擁有者將成為該組織管理員
                  </p>
                </div>
              )}
            </form.Field>
          )
        )}
      </form.Subscribe>

      {/* Select Existing Organization */}
      <form.Subscribe
        selector={(state) => [state.values.userCategory, state.values.userType, state.values.organizationOption]}
      >
        {([userCategory, userType, organizationOption]) => (
          (userCategory === 'organization' && (
            (userType === 'owner' && organizationOption === 'existing') ||
            userType === 'supervisor' || 
            userType === 'employee'
          )) && (
            <form.Field
              name="organizationId"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return "請選擇組織";
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="organizationId">
                    {userType === 'owner' ? '選擇現有組織 *' : '組織 *'}
                  </Label>
                  {organizationsData?.organizations?.length === 0 && !isLoadingOrgs ? (
                    <div className="p-3 border rounded-md bg-muted text-muted-foreground text-center">
                      目前沒有可選擇的組織
                    </div>
                  ) : (
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                      disabled={isLoadingOrgs || organizationsData?.organizations?.length === 0}
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
                  )}
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                  {organizationsData?.organizations?.length === 0 && !isLoadingOrgs ? (
                    <p className="text-xs text-amber-600">
                      沒有可用組織時，建議先創建組織或選擇創建新組織選項
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {userType === 'owner' 
                        ? '擁有者將被邀請加入該組織' 
                        : '用戶將被邀請加入該組織'
                      }
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          )
        )}
      </form.Subscribe>

      <form.Subscribe
        selector={(state) => [state.canSubmit]}
      >
        {([canSubmit]) => (
          <Button 
            type="submit" 
            disabled={!canSubmit || createUserMutation.isPending}
            className="w-full"
          >
            {createUserMutation.isPending ? '建立用戶中...' : '建立用戶'}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}