import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'

export function useAuth() {
  const {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    fetchProfile,
  } = useAuthStore()

  useEffect(() => {
    if (token && !user) {
      fetchProfile()
    }
  }, [token, user, fetchProfile])

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
  }
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()

  return {
    isAuthenticated,
    isLoading,
  }
}
