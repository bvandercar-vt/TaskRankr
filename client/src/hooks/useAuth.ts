/**
 * @fileoverview Authentication hook for user session management (ie
 * authentication state and logout).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { AuthPaths } from '~/shared/constants'
import type { User } from '~/shared/models/auth'

const CACHED_USER_KEY = 'taskrankr-cached-user'

function getCachedUser(): User | null {
  try {
    const cached = localStorage.getItem(CACHED_USER_KEY)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

function setCachedUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(CACHED_USER_KEY)
    }
  } catch {
    // localStorage may be unavailable
  }
}

async function fetchUser(): Promise<User | null> {
  try {
    const response = await fetch(AuthPaths.USER, {
      credentials: 'include',
    })

    if (response.status === 401) {
      setCachedUser(null)
      return null
    }

    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`)
    }

    const user = await response.json()
    setCachedUser(user)
    return user
  } catch (error) {
    if (error instanceof TypeError || !navigator.onLine) {
      const cached = getCachedUser()
      if (cached) {
        return cached
      }
    }
    throw error
  }
}

// biome-ignore lint/suspicious/useAwait: involved window.href logging out, allow it.
async function logout(): Promise<void> {
  setCachedUser(null)
  window.location.href = AuthPaths.LOGOUT
}

export function useAuth() {
  const queryClient = useQueryClient()
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: [AuthPaths.USER],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData([AuthPaths.USER], null)
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
