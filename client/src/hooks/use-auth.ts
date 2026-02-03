import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { User } from '~/shared/models/auth'
import { api } from '~/shared/routes'

async function fetchUser(): Promise<User | null> {
  const response = await fetch(api.auth.user.path, {
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
  window.location.href = api.auth.logout.path
}

export function useAuth() {
  const queryClient = useQueryClient()
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: [api.auth.user.path],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData([api.auth.user.path], null)
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
