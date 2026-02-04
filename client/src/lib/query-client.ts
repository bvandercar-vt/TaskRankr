/**
 * @fileoverview TanStack Query client configuration
 * 
 * Configures and exports the global QueryClient instance with default options
 * for queries and mutations, including disabled refetching, infinite stale time,
 * and no automatic retries for consistent caching behavior.
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Number.POSITIVE_INFINITY,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
})
