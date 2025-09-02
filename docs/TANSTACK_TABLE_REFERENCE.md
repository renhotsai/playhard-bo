# TanStack Table Reference (Project Standard)

TanStack Table is a headless UI library for building powerful tables and datagrids. This project uses it as the standard for all data table implementations.

## Key Features

- **Headless UI**: 100% control over markup and styles
- **Framework Agnostic**: Works with React, Vue, Angular, and others
- **Lightweight**: 10-15kb with tree-shaking
- **Type-Safe**: First-class TypeScript support
- **Feature-Rich**: Sorting, filtering, pagination, grouping, and more

## Installation & Setup

```bash
npm install @tanstack/react-table
```

## Basic Table Implementation

### 1. Define Table Columns

```typescript
import { createColumnHelper } from "@tanstack/react-table";

interface Organization {
  id: string;
  name: string;
  memberCount: number;
  createdAt: string;
  status: 'active' | 'inactive';
}

const columnHelper = createColumnHelper<Organization>();

export const columns = [
  columnHelper.accessor('name', {
    header: 'Organization Name',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('memberCount', {
    header: 'Members',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created',
    cell: info => new Date(info.getValue()).toLocaleDateString(),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => (
      <Badge variant={info.getValue() === 'active' ? 'default' : 'secondary'}>
        {info.getValue()}
      </Badge>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button size="sm" variant="outline">
          Edit
        </Button>
        <Button size="sm" variant="destructive">
          Delete
        </Button>
      </div>
    ),
  }),
];
```

### 2. Create Table Component

```typescript
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
}

export function DataTable<T>({ data, columns }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
  });

  return (
    <div className="space-y-4">
      {/* Global Filter */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search organizations..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of {data.length} row(s)
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              ⏮️
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              ⬅️
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              ➡️
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              ⏭️
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Advanced Features

### Row Selection

```typescript
const [rowSelection, setRowSelection] = useState({});

const table = useReactTable({
  data,
  columns,
  enableRowSelection: true,
  onRowSelectionChange: setRowSelection,
  state: {
    rowSelection,
  },
  // ... other options
});

// Add selection column
const selectColumn = columnHelper.display({
  id: 'select',
  header: ({ table }) => (
    <Checkbox
      checked={table.getIsAllPageRowsSelected()}
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
    />
  ),
});
```

### Column Filtering

```typescript
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

const table = useReactTable({
  data,
  columns,
  onColumnFiltersChange: setColumnFilters,
  getFilteredRowModel: getFilteredRowModel(),
  state: {
    columnFilters,
  },
  // ... other options
});

// Add column filter UI
export function DataTableColumnHeader({ column, title }) {
  return (
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8">
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDownIcon className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUpIcon className="ml-2 h-4 w-4" />
            ) : (
              <CaretSortIcon className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.clearSorting()}>
            <CaretSortIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Clear
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

### Server-Side Data with TanStack Query Integration

```typescript
export function ServerDataTable() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Use TanStack Query for server-side data
  const { data, isLoading, isError } = useQuery({
    queryKey: ['organizations', pagination, sorting, globalFilter],
    queryFn: () => organizationsAPI.fetchPaginated({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      sortBy: sorting[0]?.id,
      sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
      search: globalFilter,
    }),
    keepPreviousData: true,
  });

  const table = useReactTable({
    data: data?.organizations ?? [],
    columns,
    pageCount: Math.ceil((data?.totalCount ?? 0) / pagination.pageSize),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      pagination,
      sorting,
      globalFilter,
    },
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) return <TableSkeleton />;
  if (isError) return <TableError />;

  return <DataTable table={table} />;
}
```

## Best Practices

### 1. Column Definitions
- Use `createColumnHelper` for type safety
- Define columns outside component to avoid recreation
- Use accessor functions for complex data transformations
- Implement display columns for actions and custom content

### 2. Performance Optimization
- Memoize column definitions
- Use `keepPreviousData` for server-side tables
- Implement virtual scrolling for large datasets
- Debounce search inputs

### 3. Accessibility
- Include proper ARIA labels
- Implement keyboard navigation
- Use semantic HTML structure
- Provide screen reader support

### 4. Error Handling
- Show loading states during data fetching
- Display error messages for failed requests
- Implement retry mechanisms
- Handle empty states gracefully

### 5. Integration Patterns
- Combine with TanStack Query for server state
- Use with shadcn/ui components for consistent styling
- Implement with forms for inline editing
- Integrate with routing for deep linking

This reference should be used as the standard for all table implementations in the project.