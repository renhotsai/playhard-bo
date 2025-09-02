"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { AppSidebar } from "@/components/app-sidebar";

export default function DashboardLayout ({children}: { children: React.ReactNode }) {

	return (
			<SidebarProvider>
				<div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
					<AppSidebar/>
					<div className="flex-1 flex flex-col overflow-hidden">
						<header className="bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
							<div className="flex items-center gap-4">
								<SidebarTrigger>
									<Menu className="h-4 w-4"/>
								</SidebarTrigger>
								<h1 className="text-lg font-semibold">Dashboard</h1>
							</div>
							<div className="flex items-center gap-3">
								<ModeToggle/>
							</div>
						</header>

						<main className="flex-1 overflow-auto p-6">
							{children}
						</main>
					</div>
				</div>
			</SidebarProvider>
	);
}