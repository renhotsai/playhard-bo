"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserPlus, Shield, Mail, Calendar, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";
import { useEffect } from "react";
import { isSystemAdmin } from "@/lib/permissions";

interface User {
	id: string;
	name: string | null;
	email: string;
	username: string | null;
	role: string | null;
	emailVerified: boolean;
	createdAt: string;
	updatedAt: string;
	organizationCount: number;
	organizations: {
		id: string;
		name: string;
		role: string;
		joinedAt: string;
	}[];
}

export default function AdminUsersPage() {
	const router = useRouter();
	const {
		data: session,
		isPending:isSessionLoading, //loading state
	} = authClient.useSession()

	// Always call hooks first - Fetch all users (admin only)
	const { data: usersData, isLoading, error } = useQuery({
		queryKey: queryKeys.admin.allUsers(),
		queryFn: async () => {
			const response = await fetch('/api/admin/users');
			if (!response.ok) {
				throw new Error('Failed to fetch users');
			}
			return response.json();
		},
		enabled: !isSessionLoading && !!session && isSystemAdmin(session.user?.role), // Only fetch if admin
	});

	// Redirect non-admin users
	useEffect(() => {
		if (!isSessionLoading && session && !isSystemAdmin(session.user?.role)) {
			router.push('/dashboard');
		}
	}, [session, isSessionLoading, router]);

	// Show loading while checking session
	if (isSessionLoading) {
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

	const getRoleBadgeVariant = (role: string | null) => {
		switch (role) {
			case 'admin': return 'default';
			case 'user': return 'secondary';
			default: return 'outline';
		}
	};

	const getInitials = (name: string | null, email: string) => {
		if (name) {
			return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
		}
		return email.slice(0, 2).toUpperCase();
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString();
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Shield className="h-6 w-6 text-primary"/>
					<div>
						<h1 className="text-2xl font-bold tracking-tight">System Administration</h1>
						<p className="text-muted-foreground">Manage all users across the system</p>
					</div>
				</div>
				
				<div className="flex items-center gap-2">
					<Button
						onClick={() => router.push('/dashboard/admin/users/create')}
						className="flex items-center gap-2"
					>
						<UserPlus className="h-4 w-4"/>
						Create User
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="h-5 w-5"/>
						All Users {usersData && `(${usersData.total})`}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="text-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
							<p className="mt-2 text-muted-foreground">Loading users...</p>
						</div>
					) : error ? (
						<div className="text-center py-8 text-red-500">
							<Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
							<p>Failed to load users</p>
							<p className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
						</div>
					) : usersData?.users?.length > 0 ? (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>User</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>System Role</TableHead>
										<TableHead>Organizations</TableHead>
										<TableHead>Created</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{usersData.users.map((user: User) => (
										<TableRow key={user.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<Avatar className="h-8 w-8">
														<AvatarFallback>
															{getInitials(user.name, user.email)}
														</AvatarFallback>
													</Avatar>
													<div>
														<div className="font-medium">
															{user.name || "Unnamed User"}
														</div>
														{user.username && (
															<div className="text-sm text-muted-foreground">
																@{user.username}
															</div>
														)}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Mail className="h-4 w-4 text-muted-foreground"/>
													{user.email}
												</div>
											</TableCell>
											<TableCell>
												<Badge variant={getRoleBadgeVariant(user.role)}>
													{user.role || 'user'}
												</Badge>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Building2 className="h-4 w-4 text-muted-foreground"/>
													<span className="text-sm">
														{user.organizationCount > 0 
															? `${user.organizationCount} organization${user.organizationCount > 1 ? 's' : ''}`
															: 'No organizations'
														}
													</span>
													{user.organizations.length > 0 && (
														<div className="flex gap-1 ml-2">
															{user.organizations.slice(0, 2).map((org) => (
																<Badge key={org.id} variant="outline" className="text-xs">
																	{org.role}
																</Badge>
															))}
															{user.organizations.length > 2 && (
																<Badge variant="outline" className="text-xs">
																	+{user.organizations.length - 2}
																</Badge>
															)}
														</div>
													)}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Calendar className="h-4 w-4 text-muted-foreground"/>
													{formatDate(user.createdAt)}
												</div>
											</TableCell>
											<TableCell>
												<Badge variant={user.emailVerified ? "default" : "outline"}>
													{user.emailVerified ? "Verified" : "Pending"}
												</Badge>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					) : (
						<div className="text-center py-8 text-muted-foreground">
							<Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
							<p>No users found in the system.</p>
							<p className="text-sm">Create the first user to get started.</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}