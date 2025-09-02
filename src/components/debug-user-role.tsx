"use client";

import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DebugUserRole() {
  const { data: session, isLoading } = useSession();

  if (isLoading) {
    return <div>Loading session...</div>;
  }

  if (!session?.user) {
    return <div>No session found</div>;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Debug: Current User Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Email:</strong> {session.user.email}</p>
          <p><strong>Name:</strong> {session.user.name || 'N/A'}</p>
          <p><strong>Role:</strong> {session.user.role || 'N/A'}</p>
          <p><strong>User ID:</strong> {session.user.id}</p>
          {session.user.data && (
            <p><strong>Custom Data:</strong> {JSON.stringify(session.user.data, null, 2)}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}