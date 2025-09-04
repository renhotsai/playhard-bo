"use client";

import { CreateOrgUserForm } from "@/components/forms/create-org-user-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CreateUserContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const organizationId = searchParams.get('organizationId');

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
					<Building2 className="h-6 w-6" />
					<div>
						<h2 className="text-2xl font-bold tracking-tight">Invite Organization User</h2>
						<p className="text-muted-foreground">Add a new user to an organization</p>
					</div>
				</div>
			</div>

			<Card className="max-w-2xl">
				<CardHeader>
					<CardTitle>Organization User Information</CardTitle>
					<CardDescription>
						Invite users to join an organization. Users will receive a Magic Link email to complete their account setup and join the selected organization.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<CreateOrgUserForm 
						onSuccess={() => router.push('/dashboard/users')} 
						defaultOrganizationId={organizationId || undefined}
					/>
				</CardContent>
			</Card>
		</div>
	);
}

export default function CreateUserPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<CreateUserContent />
		</Suspense>
	);
}