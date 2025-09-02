"use client";

import {
	useReactTable,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	flexRender,
	createColumnHelper,
	type SortingState,
	type ColumnFiltersState,
} from "@tanstack/react-table";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Loader2,
	Building2,
	Users,
	Search,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	ArrowUpDown,
	ExternalLink
} from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Organization } from "better-auth/plugins";

const columnHelper = createColumnHelper<Organization>();

export function OrganizationsList () {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState("");

	const {data: organizations} = authClient.useListOrganizations();

	const columns = [
		columnHelper.display({
			id: 'icon',
			header: '',
			cell: () => (
				<Building2 className="h-5 w-5 text-primary"/>
			),
			enableSorting: false,
		}),
		columnHelper.accessor('name', {
			header: ({column}) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="h-auto p-0 font-medium"
				>
					組織名稱
					<ArrowUpDown className="ml-2 h-4 w-4"/>
				</Button>
			),
			cell: ({row}) => (
				<div className="font-medium">{row.original.name}</div>
			),
		}),
		columnHelper.display({
			id: 'actions',
			header: '操作',
			cell: ({row}) => (
				<Button asChild variant="outline" size="sm">
					<Link href={`/dashboard/organizations/${row.original.id}`}>
						<ExternalLink className="h-4 w-4 mr-2"/>
						查看詳細
					</Link>
				</Button>
			),
		}),
	];

	const table = useReactTable({
		data: organizations ?? [],
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		state: {
			sorting,
			columnFilters,
			globalFilter,
		},
	});

// 再用 JSX 控制 render
	if (!organizations || organizations.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				<Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
				<h3 className="text-lg font-semibold mb-2">尚無組織</h3>
				<p className="mb-4">開始建立第一個組織</p>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			{/* Search and Refresh */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Search className="h-4 w-4 text-muted-foreground"/>
					<Input
						placeholder="搜尋組織..."
						value={globalFilter ?? ""}
						onChange={(e) => setGlobalFilter(String(e.target.value))}
						className="max-w-sm"
					/>
				</div>
			</div>

			{/* Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id} className="font-medium">
										{header.isPlaceholder
											? null
											: flexRender(
												header.column.columnDef.header,
												header.getContext()
											)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
									className="hover:bg-muted/50"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									沒有找到組織。
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			<div className="flex items-center justify-between">
				<div className="flex-1 text-sm text-muted-foreground">
					共 {table.getFilteredRowModel().rows.length} 個組織
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.setPageIndex(0)}
						disabled={!table.getCanPreviousPage()}
					>
						<ChevronsLeft className="h-4 w-4"/>
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						<ChevronLeft className="h-4 w-4"/>
					</Button>
					<div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">
              頁面 {table.getState().pagination.pageIndex + 1} of{" "}
	            {table.getPageCount()}
            </span>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						<ChevronRight className="h-4 w-4"/>
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.setPageIndex(table.getPageCount() - 1)}
						disabled={!table.getCanNextPage()}
					>
						<ChevronsRight className="h-4 w-4"/>
					</Button>
				</div>
			</div>
		</div>
	);
}