import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { authApi } from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  updateUser: (updates: Partial<User>) => void
  fetchProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const response = await authApi.login(email, password)
          const { user, accessToken } = response.data.data!
          localStorage.setItem('token', accessToken)
          set({ user, token: accessToken, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true })
        try {
          const response = await authApi.register(name, email, password)
          const { user, accessToken } = response.data.data!
          localStorage.setItem('token', accessToken)
          set({ user, token: accessToken, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        localStorage.removeItem('token')
        authApi.logout().catch(console.error)
        set({ user: null, token: null, isAuthenticated: false })
      },

      setUser: (user) => {
        set({ user, isAuthenticated: true })
      },

      updateUser: (updates) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...updates } })
        }
      },

      fetchProfile: async () => {
        try {
          const response = await authApi.me()
          set({ user: response.data.data!, isAuthenticated: true })
        } catch {
          set({ user: null, token: null, isAuthenticated: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
)
