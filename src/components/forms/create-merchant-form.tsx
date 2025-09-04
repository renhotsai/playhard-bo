"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Building2, User } from "lucide-react";
import { toast } from "sonner";
import { authClient, useSession } from "@/lib/auth-client";
import { useState, useEffect } from "react";

// Validation schema
const createMerchantSchema = z.object({
  merchantName: z
    .string()
    .min(2, "商戶名稱至少需要 2 個字元")
    .max(50, "商戶名稱不能超過 50 個字元")
    .regex(/^[\u4e00-\u9fff\w\s-]+$/, "商戶名稱只能包含中文、英文、數字、空格和破折號"),
  ownerId: z.string().min(1, "請選擇商戶擁有者"),
});


interface CreateMerchantFormProps {
  onSuccess?: () => void;
}

export function CreateMerchantForm({ onSuccess }: CreateMerchantFormProps) {
  const { data: session } = useSession();
  // Fetch users with owner role using Better Auth
  const [ownerUsers, setOwnerUsers] = useState<Array<{ id: string; name: string; email: string; role?: string }>>([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(true);

  useEffect(() => {
    const fetchOwnerUsers = async () => {
      try {
        setIsLoadingOwners(true);
        const result = await authClient.admin.listUsers({ 
          query: { limit: 100 } 
        });
        if (result.data) {
          const owners = result.data.users.filter((user: { role?: string }) => user.role === 'owner');
          setOwnerUsers(owners);
        }
      } catch (error) {
        console.error('Failed to fetch owner users:', error);
        toast.error('載入擁有者用戶失敗');
      } finally {
        setIsLoadingOwners(false);
      }
    };

    fetchOwnerUsers();
  }, []);
  
  // Determine if current user is admin or owner
  const isAdmin = session?.user?.role === 'admin';
  const isOwner = session?.user?.role === 'owner';
  
  // If user is owner, they can only create merchants for themselves
  const defaultOwnerId = isOwner ? session?.user?.id || "" : "";
  
  // Get selected owner details
  const getOwnerDetails = (ownerId: string) => {
    if (isOwner && session?.user) {
      return {
        name: session.user.name || '',
        email: session.user.email || '',
      };
    }
    const owner = ownerUsers.find(user => user.id === ownerId);
    return {
      name: owner?.name || '',
      email: owner?.email || '',
    };
  };

	const form = useForm({
		defaultValues: {
			merchantName: "",
			ownerId: defaultOwnerId,
		},
		onSubmit: async ({ value }) => {
			try {
				console.log(`[CREATE-MERCHANT] Starting merchant creation for owner ID: ${value.ownerId}`);
				
				const ownerDetails = getOwnerDetails(value.ownerId);
				
				if (!ownerDetails.name || !ownerDetails.email) {
					throw new Error("無法獲取商戶擁有者資訊");
				}

				// Generate unique slug for organization
				const baseSlug = value.merchantName.toLowerCase()
					.replace(/[^a-z0-9\\s-]/g, '') // Remove special characters
					.replace(/\\s+/g, "-") // Replace spaces with dashes
					.replace(/-+/g, "-") // Merge multiple dashes
					.replace(/^-|-$/g, ""); // Remove leading/trailing dashes
				
				const uniqueSlug = `${baseSlug}-${Date.now()}`;

				console.log(`[CREATE-MERCHANT] Creating organization: ${value.merchantName}`);
				
				const { data: orgData, error: orgError } = await authClient.organization.create({
					name: value.merchantName,
					slug: uniqueSlug,
					metadata: {
						ownerName: ownerDetails.name,
						ownerEmail: ownerDetails.email,
						ownerId: value.ownerId,
					},
				});

				if (orgError) {
					if (orgError.message?.includes("already exists")) {
						throw new Error(`商戶名稱 "${value.merchantName}" 已存在，請使用不同的名稱`);
					}
					throw new Error(orgError.message || "建立組織失敗");
				}

				if (!orgData || !orgData.id) {
					throw new Error("組織建立成功但未返回組織 ID");
				}

				console.log(`[CREATE-MERCHANT] Organization created with ID: ${orgData.id}`);

				// Add owner to organization as admin
				console.log(`[CREATE-MERCHANT] Adding owner ${ownerDetails.email} to organization`);
				
				const { error: memberError } = await authClient.organization.inviteMember({
					email: ownerDetails.email,
					role: "admin", 
					organizationId: orgData.id,
				});

				// Handle the case where user is already a member (not an error)
				if (memberError && !memberError.message?.includes("already a member")) {
					console.warn(`[CREATE-MERCHANT] Could not add member: ${memberError.message}`);
					// Don't throw error - organization is still created successfully
				}

				console.log(`[CREATE-MERCHANT] Merchant creation completed`);

				toast.success(
					`商戶 "${value.merchantName}" 建立成功！\\n` +
					`擁有者: ${ownerDetails.name} (${ownerDetails.email})\\n` +
					`商戶已可開始使用`
				);

				// No need to invalidate queries - Better Auth handles this automatically

				// Reset form
				form.reset();
				onSuccess?.();
			} catch (err) {
				console.error("Create merchant error:", err);
				toast.error(err instanceof Error ? err.message : "建立商戶失敗");
			}
		},
	});

	// Check if user has permission to create merchants
	if (!isAdmin && !isOwner) {
		return (
			<Card className="w-full max-w-2xl">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<User className="h-5 w-5" />
						權限不足
					</CardTitle>
					<CardDescription>
						只有管理員和商戶擁有者可以建立商戶
					</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          建立新商戶
        </CardTitle>
        <CardDescription>
          {isAdmin 
            ? "管理員可以建立商戶並指定擁有者。請先在用戶管理中創建擁有者帳戶。" 
            : "建立屬於您的商戶組織。"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="merchantName"
            validators={{
              onChange: ({ value }) => {
                const result = createMerchantSchema.shape.merchantName.safeParse(value);
                if (!result.success) {
                  return result.error.issues[0].message;
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="merchantName">商戶名稱 *</Label>
                <Input
                  id="merchantName"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="請輸入商戶名稱"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {isAdmin && (
            <form.Field
              name="ownerId"
              validators={{
                onChange: ({ value }) => {
                  const result = createMerchantSchema.shape.ownerId.safeParse(value);
                  if (!result.success) {
                    return result.error.issues[0].message;
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="ownerId">商戶擁有者 *</Label>
                  {isLoadingOwners ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      載入擁有者清單中...
                    </div>
                  ) : (
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選擇商戶擁有者" />
                      </SelectTrigger>
                      <SelectContent>
                        {ownerUsers.map((owner) => (
                          <SelectItem key={owner.id} value={owner.id}>
                            {owner.name} ({owner.email})
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
                  {ownerUsers.length === 0 && !isLoadingOwners && (
                    <Alert>
                      <User className="h-4 w-4" />
                      <AlertDescription>
                        尚未找到 Owner 角色的用戶。請先在用戶管理中建立 Owner 用戶。
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </form.Field>
          )}

          {isOwner && (
            <div className="space-y-2">
              <Label>商戶擁有者</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">{session?.user?.name}</p>
                <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                商戶擁有者將設為您的帳戶
              </p>
            </div>
          )}

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isFormSubmitting]) => (
              <Button 
                type="submit" 
                disabled={!canSubmit || isFormSubmitting || (isAdmin && ownerUsers.length === 0)}
                className="w-full"
              >
                {isFormSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    建立中...
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 mr-2" />
                    建立商戶
                  </>
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}