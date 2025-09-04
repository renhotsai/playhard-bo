import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarRail
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Shield } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { isSystemAdmin } from "@/lib/permissions";
import { OrganizationSelector } from "@/components/organization-selector";

const getMenuData = (isSystemAdmin: boolean, activeOrganizationId?: string) => {
	const baseMenu = [
		{
			label: "User Management",
			items: [
				{id: 1, title: "Users", link: "/dashboard/users"},
				{id: 2, title: "Invite User", link: "/dashboard/users/create"},
				{id: 3, title: "Teams", link: "/dashboard/users/teams"},
			],
		},
		{
			label: "Permission Management",
			items: [
				{id: 1, title: "User Permission", link: "/dashboard/permissions/users"},
				{id: 2, title: "Team Permission", link: "/dashboard/permissions/teams"},
				{id: 3, title: "Role Permission", link: "/dashboard/permissions/roles"},
				{id: 4, title: "Organization Permission", link: "/dashboard/permissions/organization"}
			],
		},
	];

	// Organization Management sections
	const organizationSections = [];
	
	// Add "All Organizations" section for system admins
	if (isSystemAdmin) {
		organizationSections.push({
			label: "All Organizations",
			items: [
				{ id: 1, title: "Organizations List", link: "/dashboard/organizations" }
			]
		});
	}
	
	// Add current organization section for non-admin users
	if (!isSystemAdmin && activeOrganizationId) {
		organizationSections.push({
			label: "Organization",
			items: [
				{ id: 1, title: "Overview", link: `/dashboard/organizations/${activeOrganizationId}` },
				{ id: 2, title: "Members", link: `/dashboard/organizations/${activeOrganizationId}/members` },
				{ id: 3, title: "Settings", link: `/dashboard/organizations/${activeOrganizationId}/edit` },
			]
		});
	}

	// Build final menu structure
	const finalMenu = [...baseMenu, ...organizationSections];
	
	// Add Admin Management section only for system admins
	if (isSystemAdmin) {
		return [
			{
				label: "Admin Management",
				items: [
					{id: 1, title: "All Users", link: "/dashboard/admin/users"}
				]
			},
			...finalMenu
		];
	}

	return finalMenu;
};


export function AppSidebar () {
	const {
		data: session,
	} = authClient.useSession()
	const { data: activeOrganization } = authClient.useActiveOrganization();
	const [avatarFallback, setAvatarFallback] = useState("AF")
	const hasSystemAdminAccess = isSystemAdmin(session?.user?.role);
	const menuData = getMenuData(hasSystemAdminAccess, activeOrganization?.id);

	useEffect(() => {
		if (session?.user.name) {
			setAvatarFallback(getInitials(session.user.name));
		}
	}, [session]);

	const getInitials = (name: string) => {
		if (!name) return "";

		const parts = name.trim().split(/\s+/);

		if (parts.length >= 3) {
			return (
				parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
			);
		}

		return parts.map(word => word[0].toUpperCase()).join("");
	}


	return (
		<Sidebar collapsible="icon" className="border-r">
			<SidebarHeader className="border-b px-2 py-4 group-data-[collapsible=icon]:px-2">
				<div className="flex items-center gap-2 min-w-0 overflow-hidden">
					<div className="rounded-lg bg-primary/10 p-2 flex-shrink-0 group-data-[collapsible=icon]:mx-auto">
						<Shield className="h-4 w-4 text-primary flex-shrink-0"/>
					</div>
					<div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
						<span className="text-sm font-semibold truncate">PlayHard Admin</span>
						<span className="text-xs text-muted-foreground truncate">Backoffice</span>
					</div>
				</div>
			</SidebarHeader>
			<SidebarContent className="px-2 py-4">
				{/* Organization Selector - Only show for non-admin users */}
				{!hasSystemAdminAccess && (
					<div className="mb-4 border-b pb-4">
						<OrganizationSelector />
					</div>
				)}
				<SidebarMenu>
					{menuData.map((section) => (
						<Collapsible key={section.label} defaultOpen className="group/collapsible">
							<SidebarMenuItem>
								<CollapsibleTrigger asChild>
									<SidebarMenuButton>
										{section.label}
									</SidebarMenuButton>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<SidebarMenuSub>
										{section.items.map((item) => (
											<SidebarMenuSubItem key={item.id}>
												<SidebarMenuSubButton asChild>
													<Link href={item.link}>
														{item.title}
													</Link>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										))}
									</SidebarMenuSub>
								</CollapsibleContent>
							</SidebarMenuItem>
						</Collapsible>
					))}
				</SidebarMenu>
			</SidebarContent>

			<SidebarFooter className="border-t p-4">
				<div className="flex items-center justify-between space-x-2">
					{/* 左側：Avatar + 使用者名稱 */}
					<div className="flex items-center space-x-2">
						<Avatar className="h-8 w-8">
							<AvatarFallback>{avatarFallback}</AvatarFallback>
						</Avatar>
						<span className="text-sm font-medium">{session?.user.name}</span>
					</div>

					{/* 右側：登出按鈕 */}
					<Button
						variant="ghost"
						size="sm"
						onClick={async () => {
							try {
								await authClient.signOut();
								window.location.href = '/login';
							} catch (error) {
								console.error('Logout error:', error);
							}
						}}
						className="flex items-center text-xs text-muted-foreground hover:text-foreground p-1 h-auto"
					>
						<LogOut className="h-3 w-3 mr-1" />
						Sign out
					</Button>
				</div>

			</SidebarFooter>
			<SidebarRail/>
		</Sidebar>
	)
}