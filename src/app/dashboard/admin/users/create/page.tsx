"use client";

import { CreateUserForm } from "@/components/forms/create-user-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isSystemAdmin } from "@/lib/permissions";
import { authClient } from "@/lib/auth-client";

export default function CreateUserPage(){
	const router = useRouter();
	const {
		data: session,
		isPending, //loading state
	} = authClient.useSession()

	// Redirect non-admin users
	useEffect(() => {
		if (!isPending && session && !isSystemAdmin(session.user?.role)) {
			router.push('/dashboard');
		}
	}, [session, isPending, router]);

	// Show loading while checking session
	if (isPending) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	// Don't render if not system admin
	if (!session || !isSystemAdmin(session.user?.role)) {
		return null;
	}

	return(
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="sm"
					onClick={() => router.back()}
					className="flex items-center gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					返回
				</Button>
				<div className="flex items-center gap-2">
					<UserPlus className="h-6 w-6" />
					<div>
						<h2 className="text-2xl font-bold tracking-tight">Create New User</h2>
						<p className="text-muted-foreground">Add a new user to the system</p>
					</div>
				</div>
			</div>

			<Card className="max-w-2xl">
				<CardHeader>
					<CardTitle>User Information</CardTitle>
					<CardDescription>
						Create users with any role. Users will receive a Magic Link email to complete their account setup with username and password.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<CreateUserForm onSuccess={() => router.push('/dashboard/admin/users')} />
				</CardContent>
			</Card>
		</div>
	);
}