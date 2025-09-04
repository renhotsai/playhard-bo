"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
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
import { useState, useMemo, useCallback } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Loader2, 
  User, 
  Crown, 
  Shield, 
  Eye, 
  Users, 
  UserCheck, 
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Edit
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  role?: string;
  createdAt: string;
  emailVerified: boolean;
}


const fetchUsers = async (): Promise<User[]> => {
  const response = await fetch('/api/admin/users');
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch users');
  }
  
  return await response.json(); // API already returns properly formatted user data
};

const columnHelper = createColumnHelper<User>();

interface UsersListProps {
  showEditButton?: boolean;
  editButtonText?: string;
  onEdit?: (userId: string) => void;
}

export function UsersList({ 
  showEditButton = false, 
  editButtonText = "編輯", 
  onEdit 
}: UsersListProps = {}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.admin.allUsers(),
    queryFn: fetchUsers,
  });

  const getRoleIcon = useCallback((role?: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
      case 'owner':
        return <Shield className="h-4 w-4" />;
      case 'supervisor':
        return <Eye className="h-4 w-4" />;
      case 'employee':
        return <Users className="h-4 w-4" />;
      case 'user':
        return <UserCheck className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  }, []);

  const getRoleBadge = useCallback((role?: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>;
      case 'owner':
        return <Badge variant="secondary">Owner</Badge>;
      case 'supervisor':
        return <Badge variant="default">Supervisor</Badge>;
      case 'employee':
        return <Badge variant="outline">Employee</Badge>;
      case 'user':
        return <Badge variant="outline">User</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  }, []);

  // Memoize columns for better performance
  const columns = useMemo(() => {
    const baseColumns = [
    columnHelper.display({
      id: 'avatar',
      header: '',
      cell: ({ row }) => (
        <Avatar className="h-8 w-8">
          <AvatarImage src={`https://avatar.vercel.sh/${row.original.email}`} />
          <AvatarFallback>
            {row.original.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.username && (
            <div className="text-sm text-muted-foreground">@{row.original.username}</div>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('email', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    }),
    columnHelper.accessor('role', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Role
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getRoleIcon(row.original.role)}
          {getRoleBadge(row.original.role)}
        </div>
      ),
    }),
    columnHelper.accessor('emailVerified', {
      header: 'Status',
      cell: ({ row }) => (
        row.original.emailVerified ? (
          <Badge variant="outline" className="text-xs">已驗證</Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">待驗證</Badge>
        )
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('zh-TW'),
    }),
  ];

    // Add actions column if edit button is enabled
    if (showEditButton && onEdit) {
      baseColumns.push(
      columnHelper.display({
        id: 'actions',
        header: '操作',
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(row.original.id)}
            className="flex items-center gap-1"
          >
            <Edit className="h-3 w-3" />
            {editButtonText}
          </Button>
        ),
        enableSorting: false,
      })
    );
    }

    return baseColumns;
  }, [showEditButton, onEdit, editButtonText, getRoleIcon, getRoleBadge]);

  const table = useReactTable({
    data: users,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">載入用戶資料...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">載入用戶失敗</p>
        <Button 
          onClick={() => refetch()} 
          variant="outline"
          size="sm"
          className="mt-2"
        >
          重試
        </Button>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        尚無用戶資料
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜尋用戶..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(String(e.target.value))}
          className="max-w-sm"
        />
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
                  沒有找到用戶。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex-1 text-sm text-muted-foreground">
          共 {table.getFilteredRowModel().rows.length} 個用戶
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
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
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}