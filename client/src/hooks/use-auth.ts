/**
 * @fileoverview Authentication hook for user session management (ie
 * authentication state and logout).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { authPaths } from '~/shared/constants'
import type { User } from '~/shared/models/auth'

async function fetchUser(): Promise<User | null> {
  const response = await fetch(authPaths.user, {
    credentials: 'include',
  })

  if (response.status === 401) {
    return null
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// biome-ignore lint/suspicious/useAwait: involved window.href logging out, allow it.
async function logout(): Promise<void> {
  window.location.href = authPaths.logout
}

export function useAuth() {
  const queryClient = useQueryClient()
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: [authPaths.user],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData([authPaths.user], null)
    },
  })

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  }
}
