"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserPlus, Building2, Mail, Calendar } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { Member, User } from "@/generated/prisma";

type MemberWithUser = Member & {
	user: User;
};

export default function UsersPage() {
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const isSystemAdmin = session?.user?.role === 'admin';
	const { data: activeOrganization } = authClient.useActiveOrganization();

	// Fetch organization members for active organization
	const { data: orgData, isLoading: isLoadingMembers } = useQuery({
		queryKey: queryKeys.organizations.members(activeOrganization?.id || ''),
		queryFn: async () => {
			if (!activeOrganization?.id) return null;

			if (isSystemAdmin) {
				// Admin needs custom API to see any organization's members
				const response = await fetch(`/api/admin/organizations/members/${activeOrganization.id}`);
				if (!response.ok) {
					throw new Error('Failed to fetch organization members');
				}
				const data = await response.json();
				return { members: data.members || [] };
			} else {
				// Regular users use Better Auth API
				const { data, error } = await authClient.organization.listMembers();
				if (error) {
					throw new Error(error.message || 'Failed to fetch organization members');
				}
				return data;
			}
		},
		enabled: !!activeOrganization?.id,
	});

	const getRoleBadgeVariant = (role: string) => {
		switch (role) {
			case 'owner': return 'default';
			case 'admin': return 'secondary';
			case 'member': return 'outline';
			case 'guest': return 'outline';
			default: return 'outline';
		}
	};

	const getInitials = (name: string) => {
		if (!name) return "U";
		return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
	};

	const formatDate = (date: string | Date) => {
		return new Date(date).toLocaleDateString();
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Users className="h-6 w-6"/>
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Organization Users</h1>
						<p className="text-muted-foreground">Manage users within organizations</p>
					</div>
				</div>
				
				<div className="flex items-center gap-2">
					<Button
						onClick={() => router.push(`/dashboard/users/create?organizationId=${activeOrganization?.id}`)}
						className="flex items-center gap-2"
						disabled={!activeOrganization?.id}
					>
						<UserPlus className="h-4 w-4"/>
						Invite User
					</Button>
				</div>
			</div>


			{/* Users List */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="h-5 w-5"/>
						{activeOrganization?.id ? "Organization Members" : "Organization Users"}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{activeOrganization?.id ? (
						<div>
							{isLoadingMembers ? (
								<div className="text-center py-8">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
									<p className="mt-2 text-muted-foreground">Loading members...</p>
								</div>
							) : orgData?.members?.length > 0 ? (
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Member</TableHead>
												<TableHead>Email</TableHead>
												<TableHead>Role</TableHead>
												<TableHead>Joined</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{orgData?.members?.map((member: MemberWithUser) => (
												<TableRow key={member.id}>
													<TableCell>
														<div className="flex items-center gap-3">
															<Avatar className="h-8 w-8">
																<AvatarFallback>
																	{getInitials(member.user?.name || member.user?.email || "")}
																</AvatarFallback>
															</Avatar>
															<div>
																<div className="font-medium">
																	{member.user?.name || "Unnamed User"}
																</div>
																<div className="text-sm text-muted-foreground">
																	{member.user?.username && `@${member.user.username}`}
																</div>
															</div>
														</div>
													</TableCell>
													<TableCell>
														<div className="flex items-center gap-2">
															<Mail className="h-4 w-4 text-muted-foreground"/>
															{member.user?.email}
														</div>
													</TableCell>
													<TableCell>
														<Badge variant={getRoleBadgeVariant(member.role)}>
															{member.role}
														</Badge>
													</TableCell>
													<TableCell>
														<div className="flex items-center gap-2">
															<Calendar className="h-4 w-4 text-muted-foreground"/>
															{member.createdAt ? formatDate(member.createdAt) : "N/A"}
														</div>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							) : (
								<div className="text-center py-8 text-muted-foreground">
									<Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
									<p>No members found in this organization.</p>
									<p className="text-sm">Start by inviting users to join.</p>
								</div>
							)}
						</div>
					) : (
						<div className="text-center py-8 text-muted-foreground">
							<Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
							<p>Please select an organization from the sidebar to view its members.</p>
							<p className="text-sm">Use the organization selector in the sidebar to choose an organization.</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}