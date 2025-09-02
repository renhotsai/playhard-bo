"use client";

import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

// Validation functions following project patterns
const validateName = (value: string) => {
  if (!value || value.trim().length < 2) return "Name must be at least 2 characters";
  if (value.length > 100) return "Name cannot exceed 100 characters";
  return undefined;
};

const validateEmail = (value: string) => {
  if (!value) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return "Please enter a valid email address";
  return undefined;
};

const validatePassword = (value: string) => {
  if (!value) return "Password is required";
  if (value.length < 8) return "Password must be at least 8 characters";
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

type CreateFirstAdminInput = {
  email: string;
  password: string;
  name: string;
};

export function CreateFirstAdminForm() {
  // Create first admin mutation
  const createFirstAdminMutation = useMutation({
    mutationFn: async (adminData: CreateFirstAdminInput) => {
      const response = await fetch("/api/super-admin/create-first-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adminData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create admin user");
      }

      return data;
    },
    onSuccess: () => {
      // Reset the form after successful submission
      form.reset();
      toast.success("First admin user created successfully! You can now log in.");
    },
    onError: (error) => {
      console.error("Create admin error:", error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    },
  });

  // Initialize form with TanStack Form
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
    } as CreateFirstAdminInput,
    onSubmit: async ({ value }) => {
      // Use the mutation with proper async handling
      await createFirstAdminMutation.mutateAsync(value);
    },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create First Admin User</CardTitle>
        <CardDescription>
          This will create the first admin user for your system. This endpoint is only available when no admin users exist.
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
          {/* Email Field */}
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
                  placeholder="admin@example.com"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Name Field */}
          <form.Field
            name="name"
            validators={{
              onBlur: ({ value }) => validateName(value),
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Super Admin"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Password Field */}
          <form.Field
            name="password"
            validators={{
              onBlur: ({ value }) => validatePassword(value),
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter a strong password (min 8 characters)"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters long
                </p>
              </div>
            )}
          </form.Field>

          {/* Submit Button */}
          <form.Subscribe
            selector={(state) => [state.canSubmit]}
          >
            {([canSubmit]) => (
              <Button 
                type="submit" 
                disabled={!canSubmit || createFirstAdminMutation.isPending}
                className="w-full"
              >
                {createFirstAdminMutation.isPending ? "Creating Admin..." : "Create First Admin"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}