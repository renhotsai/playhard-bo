# TanStack Query Reference (Project Standard)

This project uses TanStack Query v5 as the standard for server state management. All data fetching should follow these patterns.

## Setup & Configuration

### QueryClient Configuration
```typescript
// src/components/query-provider.tsx
const [queryClient] = useState(() => 
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,     // 5 minutes
        gcTime: 10 * 60 * 1000,       // 10 minutes
        retry: 3,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    },
  })
);
```

### Provider Setup
```typescript
// src/app/layout.tsx
<QueryProvider>
  <AuthProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </AuthProvider>
</QueryProvider>
```

## Query Key Conventions

### Standard Naming Pattern
```typescript
export const organizationKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...organizationKeys.lists(), { filters }] as const,
  details: () => [...organizationKeys.all, 'detail'] as const,
  detail: (id: string) => [...organizationKeys.details(), id] as const,
};
```

### Usage Example
```typescript
// List query
queryKey: organizationKeys.lists()

// Detail query
queryKey: organizationKeys.detail(organizationId)

// Filtered list
queryKey: organizationKeys.list({ status: 'active' })
```

## Custom Hook Patterns

### Basic Data Fetching Hook
```typescript
export function useOrganizations() {
  return useQuery({
    queryKey: organizationKeys.lists(),
    queryFn: organizationsAPI.fetchAll,
  });
}
```

### Detail Hook with Conditional Fetching
```typescript
export function useOrganization(id: string) {
  return useQuery({
    queryKey: organizationKeys.detail(id),
    queryFn: () => organizationsAPI.fetchById(id),
    enabled: !!id,
  });
}
```

### Mutation Hook with Cache Updates
```typescript
export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationsAPI.create,
    onSuccess: (newOrganization) => {
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
      
      // Set new data in cache
      queryClient.setQueryData(
        organizationKeys.detail(newOrganization.id),
        newOrganization
      );
      
      toast.success('組織建立成功！');
    },
    onError: (error: Error) => {
      toast.error(error.message || '建立組織失敗');
    },
  });
}
```

## Component Usage Patterns

### Basic Usage with Loading and Error States
```typescript
export default function OrganizationsPage() {
  const { 
    data: organizations = [], 
    isLoading, 
    isError, 
    error, 
    refetch,
    isRefetching 
  } = useOrganizations();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <ErrorComponent error={error} onRetry={refetch} />;
  }

  return (
    <div>
      {organizations.map(org => (
        <OrganizationCard key={org.id} organization={org} />
      ))}
    </div>
  );
}
```

### Mutation Usage
```typescript
export function CreateOrganizationForm() {
  const createOrganization = useCreateOrganization();

  const handleSubmit = async (data: CreateOrganizationData) => {
    try {
      await createOrganization.mutateAsync(data);
      // Handle success (toast is already shown by the hook)
      router.push('/dashboard/organizations');
    } catch (error) {
      // Error handling is done by the hook
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button 
        type="submit" 
        disabled={createOrganization.isPending}
      >
        {createOrganization.isPending ? 'Creating...' : 'Create'}
      </Button>
    </form>
  );
}
```

## Advanced Patterns

### Optimistic Updates
```typescript
export function useOptimisticOrganizationUpdate() {
  const queryClient = useQueryClient();

  const updateOrganization = (id: string, updates: Partial<Organization>) => {
    queryClient.setQueryData(
      organizationKeys.detail(id), 
      (old: Organization | undefined) => {
        if (!old) return old;
        return { ...old, ...updates };
      }
    );
  };

  return { updateOrganization };
}
```

### Dependent Queries
```typescript
export function useOrganizationMembers(organizationId: string) {
  const { data: organization } = useOrganization(organizationId);

  return useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: () => membersAPI.fetchByOrganization(organizationId),
    enabled: !!organization, // Only fetch if organization exists
  });
}
```

### Infinite Queries
```typescript
export function useInfiniteOrganizations() {
  return useInfiniteQuery({
    queryKey: organizationKeys.lists(),
    queryFn: ({ pageParam = 1 }) => 
      organizationsAPI.fetchPaginated({ page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    initialPageParam: 1,
  });
}
```

## Error Handling Best Practices

### Global Error Handling
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        // Log error
        console.error('Query error:', error);
        
        // Show global error toast for network errors
        if (error instanceof Error && error.message.includes('fetch')) {
          toast.error('Network error. Please check your connection.');
        }
      },
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});
```

### Component-Level Error Handling
```typescript
const { data, error, isError } = useOrganizations();

if (isError) {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {error instanceof Error ? error.message : 'Something went wrong'}
      </AlertDescription>
    </Alert>
  );
}
```

## Cache Management

### Manual Cache Updates
```typescript
// Update specific item
queryClient.setQueryData(
  organizationKeys.detail(id),
  updatedOrganization
);

// Invalidate queries
queryClient.invalidateQueries({ 
  queryKey: organizationKeys.lists() 
});

// Remove from cache
queryClient.removeQueries({ 
  queryKey: organizationKeys.detail(id) 
});
```

### Background Refetching
```typescript
// Refetch in background
queryClient.refetchQueries({ 
  queryKey: organizationKeys.lists() 
});

// Prefetch data
queryClient.prefetchQuery({
  queryKey: organizationKeys.detail(id),
  queryFn: () => organizationsAPI.fetchById(id),
});
```

## DevTools Usage

### Development Setup
```typescript
// Automatically includes DevTools in development
{process.env.NODE_ENV === 'development' && (
  <ReactQueryDevtools
    initialIsOpen={false}
    buttonPosition="bottom-right"
  />
)}
```

### Debugging Tips
- Use DevTools to inspect query states
- Check cache contents and stale times
- Monitor network requests and refetches
- Examine error states and retry attempts

## Performance Best Practices

### Stale Time Configuration
```typescript
useQuery({
  queryKey: organizationKeys.lists(),
  queryFn: organizationsAPI.fetchAll,
  staleTime: 10 * 60 * 1000, // 10 minutes for relatively static data
});
```

### Selective Refetching
```typescript
// Only refetch specific queries
queryClient.refetchQueries({ 
  queryKey: organizationKeys.detail(id),
  exact: true 
});
```

### Memory Management
```typescript
// Configure garbage collection time
useQuery({
  queryKey: organizationKeys.lists(),
  queryFn: organizationsAPI.fetchAll,
  gcTime: 5 * 60 * 1000, // Clean up after 5 minutes of inactivity
});
```

This reference guide should be followed for all data fetching in the application to maintain consistency and best practices.