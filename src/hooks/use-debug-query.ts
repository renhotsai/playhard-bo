/**
 * Debug hook for TanStack Query
 * 
 * Provides detailed logging and debugging information for query operations
 * following TanStack Query v5 best practices.
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useEffect } from 'react';

interface DebugQueryOptions<TData, TError = Error> extends UseQueryOptions<TData, TError> {
  debugName?: string;
  enableDetailedLogs?: boolean;
}

export function useDebugQuery<TData, TError = Error>(
  options: DebugQueryOptions<TData, TError>
) {
  const { debugName = 'Query', enableDetailedLogs = true, ...queryOptions } = options;
  
  const query = useQuery(queryOptions);
  
  useEffect(() => {
    if (!enableDetailedLogs) return;
    
    console.log(`[${debugName}] Query state changed:`, {
      status: query.status,
      fetchStatus: query.fetchStatus,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isError: query.isError,
      isSuccess: query.isSuccess,
      error: query.error,
      data: query.data ? 'present' : 'missing',
      queryKey: queryOptions.queryKey,
      enabled: queryOptions.enabled
    });
    
    if (query.error) {
      console.error(`[${debugName}] Query error details:`, {
        error: query.error,
        message: query.error instanceof Error ? query.error.message : 'Unknown error',
        stack: query.error instanceof Error ? query.error.stack : undefined
      });
    }
    
    if (query.isSuccess && query.data) {
      console.log(`[${debugName}] Query success:`, query.data);
    }
  }, [
    query.status,
    query.fetchStatus,
    query.isLoading,
    query.isFetching,
    query.isError,
    query.isSuccess,
    query.error,
    query.data,
    debugName,
    enableDetailedLogs,
    queryOptions.queryKey,
    queryOptions.enabled
  ]);
  
  // Log initial query setup
  useEffect(() => {
    if (!enableDetailedLogs) return;
    
    console.log(`[${debugName}] Query initialized:`, {
      queryKey: queryOptions.queryKey,
      enabled: queryOptions.enabled,
      staleTime: queryOptions.staleTime,
      gcTime: queryOptions.gcTime,
      retry: queryOptions.retry
    });
  }, [debugName, enableDetailedLogs, queryOptions.queryKey, queryOptions.enabled, queryOptions.staleTime, queryOptions.gcTime, queryOptions.retry]);
  
  return query;
}

/**
 * Hook to debug query cache state
 */
export function useQueryCacheDebug(queryKey: unknown[], debugName?: string) {
  const name = debugName || 'Cache Debug';
  
  useEffect(() => {
    console.log(`[${name}] Query key structure:`, {
      key: queryKey,
      keyString: JSON.stringify(queryKey),
      keyLength: queryKey.length
    });
  }, [queryKey, name]);
}

/**
 * Hook to debug session-dependent queries
 */
export function useSessionQueryDebug(
  session: unknown, 
  isLoading: boolean, 
  queryEnabled: boolean,
  debugName?: string
) {
  const name = debugName || 'Session Query Debug';
  
  useEffect(() => {
    console.log(`[${name}] Session state:`, {
      hasSession: !!session,
      isSessionLoading: isLoading,
      sessionUser: (session as { user?: { id?: string, role?: string, email?: string } })?.user ? {
        id: (session as { user: { id?: string } }).user.id,
        role: (session as { user: { role?: string } }).user.role,
        email: (session as { user: { email?: string } }).user.email
      } : 'no user',
      queryEnabled
    });
  }, [session, isLoading, queryEnabled, name]);
}