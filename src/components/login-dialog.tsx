"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { signIn, signUp } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { Eye, EyeOff, Shield } from "lucide-react";

interface LoginDialogProps {
  children: React.ReactNode;
}

export function LoginDialog({ children }: LoginDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("signin");

  const loginForm = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setLoading(true);
      setError("");
      try {
        const result = await signIn.username({
          username: value.username,
          password: value.password,
        });
        
        if (result.error) {
          setError(result.error.message || "Login failed");
        } else {
          setOpen(false);
        }
      } catch (err) {
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    },
  });

  const registerForm = useForm({
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      setLoading(true);
      setError("");
      
      if (value.password !== value.confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }
      
      try {
        // Mock implementation for username signup
        // This needs to be implemented with correct Better Auth API
        toast.success("Sign up - API implementation needed");
        setActiveTab("signin");
        setError("");
      } catch (err) {
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    },
  });

  const resetForm = () => {
    setError("");
    setShowPassword(false);
    setActiveTab("signin");
    loginForm.reset();
    registerForm.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Access
          </DialogTitle>
          <DialogDescription>
            Sign in to the PlayHard backoffice system.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Register</TabsTrigger>
          </TabsList>

          {error && (
            <Alert variant="destructive" className="mt-4">
              {error}
            </Alert>
          )}
          
          <TabsContent value="signin" className="space-y-4 mt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                loginForm.handleSubmit();
              }}
              className="space-y-4"
            >
              <loginForm.Field
                name="username"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "Username is required" : 
                    value.length < 3 ? "Username must be at least 3 characters" : 
                    undefined,
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor="signin-username" className="mb-2 block">Username *</Label>
                    <Input
                      id="signin-username"
                      placeholder="Enter your username"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </loginForm.Field>

              <loginForm.Field
                name="password"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "Password is required" : 
                    value.length < 6 ? "Password must be at least 6 characters" : 
                    undefined,
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor="signin-password" className="mb-2 block">Password *</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </loginForm.Field>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4 mt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                registerForm.handleSubmit();
              }}
              className="space-y-4"
            >
              <registerForm.Field
                name="name"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "Name is required" : 
                    value.length < 2 ? "Name must be at least 2 characters" : 
                    undefined,
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor="signup-name" className="mb-2 block">Full Name *</Label>
                    <Input
                      id="signup-name"
                      placeholder="Enter your full name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </registerForm.Field>

              <registerForm.Field
                name="username"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "Username is required" : 
                    value.length < 3 ? "Username must be at least 3 characters" : 
                    !/^[a-zA-Z0-9_]+$/.test(value) ? "Username can only contain letters, numbers, and underscores" :
                    undefined,
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor="signup-username" className="mb-2 block">Username *</Label>
                    <Input
                      id="signup-username"
                      placeholder="Choose a username"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </registerForm.Field>

              <registerForm.Field
                name="email"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "Email is required" : 
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Invalid email format" : 
                    undefined,
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor="signup-email" className="mb-2 block">Email *</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </registerForm.Field>

              <registerForm.Field
                name="password"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "Password is required" : 
                    value.length < 6 ? "Password must be at least 6 characters" : 
                    undefined,
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor="signup-password" className="mb-2 block">Password *</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password (min 6 chars)"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </registerForm.Field>

              <registerForm.Field
                name="confirmPassword"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "Please confirm your password" : 
                    undefined,
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor="signup-confirmPassword" className="mb-2 block">Confirm Password *</Label>
                    <Input
                      id="signup-confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </registerForm.Field>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create Admin Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}