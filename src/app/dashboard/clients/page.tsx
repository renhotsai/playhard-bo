"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";

export default function ClientsPage() {
  return (
    <div className="space-y-6">
          <div className="flex items-center gap-2">
            <UserCheck className="h-6 w-6" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Clients Management</h2>
              <p className="text-muted-foreground">Manage customer accounts and registrations</p>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Customer Database</CardTitle>
              <CardDescription>View and manage registered customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Clients management interface coming soon...
              </div>
            </CardContent>
          </Card>
    </div>
  );
}