import { create } from 'zustand'
import type { TokenTransaction, TokenPackage } from '@/types'
import { tokenApi } from '@/lib/api'

interface TokenState {
  balance: number
  transactions: TokenTransaction[]
  packages: TokenPackage[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchBalance: () => Promise<void>
  fetchTransactions: () => Promise<void>
  fetchPackages: () => Promise<void>
  purchaseTokens: (packageId: string, paymentMethod: string) => Promise<void>
  deductTokens: (amount: number) => void
  addTokens: (amount: number, description: string) => void
  setBalance: (balance: number) => void
}

export const useTokenStore = create<TokenState>()((set, get) => ({
  balance: 0,
  transactions: [],
  packages: [],
  isLoading: false,
  error: null,

  fetchBalance: async () => {
    try {
      const response = await tokenApi.getBalance()
      set({ balance: response.data.data!.balance })
    } catch (error) {
      console.error('Failed to fetch balance:', error)
    }
  },

  fetchTransactions: async () => {
    set({ isLoading: true })
    try {
      const response = await tokenApi.getTransactions()
      set({ transactions: response.data.data!, isLoading: false })
    } catch (error) {
      set({ error: 'Failed to fetch transactions', isLoading: false })
    }
  },

  fetchPackages: async () => {
    try {
      const response = await tokenApi.getPackages()
      set({ packages: response.data.data! })
    } catch (error) {
      console.error('Failed to fetch packages:', error)
      // Fallback packages
      set({
        packages: [
          { id: 'basic', name: 'Basic', tokens: 100, price: 50000, currency: 'IDR' },
          { id: 'pro', name: 'Pro', tokens: 500, price: 200000, currency: 'IDR', bonus: 50 },
          { id: 'enterprise', name: 'Enterprise', tokens: 2000, price: 750000, currency: 'IDR', bonus: 300 },
        ],
      })
    }
  },

  purchaseTokens: async (packageId, paymentMethod) => {
    set({ isLoading: true, error: null })
    try {
      await tokenApi.purchase(packageId, paymentMethod)
      await get().fetchBalance()
      await get().fetchTransactions()
      set({ isLoading: false })
    } catch (error) {
      set({ error: 'Failed to purchase tokens', isLoading: false })
      throw error
    }
  },

  deductTokens: (amount) => {
    set((state) => ({
      balance: Math.max(0, state.balance - amount),
    }))
  },

  addTokens: (amount, description) => {
    set((state) => ({
      balance: state.balance + amount,
      transactions: [
        {
          id: crypto.randomUUID(),
          userId: '',
          type: 'credit',
          amount,
          balance: state.balance + amount,
          description,
          createdAt: new Date().toISOString(),
        },
        ...state.transactions,
      ],
    }))
  },

  setBalance: (balance) => {
    set({ balance })
  },
}))
