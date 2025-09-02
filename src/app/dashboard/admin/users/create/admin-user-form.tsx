"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface CreateUserFormData {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  username?: string;
}

export default function AdminUserForm() {
  const [formData, setFormData] = useState<CreateUserFormData>({
    name: "",
    email: "",
    password: "",
    role: "user",
    username: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use Better Auth admin API client-side
      // This will automatically include the current session cookies
      const newUser = await authClient.admin.createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        username: formData.username || undefined,
        emailVerified: true // Admin-created users are auto-verified
      });

      toast({
        title: "Success",
        description: "User created successfully"
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "user",
        username: ""
      });

      console.log("New user created:", newUser);

    } catch (error) {
      console.error("Create user error:", error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="username">Username (Optional)</Label>
        <Input
          id="username"
          type="text"
          value={formData.username}
          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          required
          minLength={6}
        />
      </div>

      <div>
        <Label htmlFor="role">Role</Label>
        <Select
          value={formData.role}
          onValueChange={(value: "admin" | "user") => 
            setFormData(prev => ({ ...prev, role: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Regular User</SelectItem>
            <SelectItem value="admin">System Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Creating User..." : "Create User"}
      </Button>
    </form>
  );
}