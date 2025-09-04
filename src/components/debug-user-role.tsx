"use client";

import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DebugUserRole() {
  const { data: session, isPending } = useSession();

  if (isPending) {
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
          <p><strong>Email Verified:</strong> {session.user.emailVerified ? 'Yes' : 'No'}</p>
          <p><strong>Created At:</strong> {new Date(session.user.createdAt).toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}