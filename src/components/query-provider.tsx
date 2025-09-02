"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  // Create QueryClient instance using useState to avoid re-initialization
  const [queryClient] = useState(() => 
    new QueryClient({
      defaultOptions: {
        queries: {
          // Consider data stale after 5 minutes
          staleTime: 5 * 60 * 1000,
          // Keep data in cache for 10 minutes
          gcTime: 10 * 60 * 1000,
          // Retry failed requests 3 times
          retry: 3,
          // Refetch on window focus
          refetchOnWindowFocus: true,
          // Refetch on network reconnection
          refetchOnReconnect: true,
        },
        mutations: {
          // Retry failed mutations once
          retry: 1,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}