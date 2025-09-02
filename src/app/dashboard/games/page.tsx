"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2 } from "lucide-react";

export default function GamesPage() {
  return (
    <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-6 w-6" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Games Management</h2>
              <p className="text-muted-foreground">Manage script games and content</p>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Script Games Library</CardTitle>
              <CardDescription>Add, edit, and manage game scripts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Games management interface coming soon...
              </div>
            </CardContent>
          </Card>
    </div>
  );
}