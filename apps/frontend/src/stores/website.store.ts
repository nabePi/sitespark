import { create } from 'zustand'
import type { Website } from '@/types'
import { websiteApi } from '@/lib/api'

interface WebsiteState {
  websites: Website[]
  currentWebsite: Website | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchWebsites: () => Promise<void>
  fetchWebsite: (id: string) => Promise<void>
  createWebsite: (data: Partial<Website>) => Promise<Website>
  updateWebsite: (id: string, data: Partial<Website>) => Promise<void>
  deleteWebsite: (id: string) => Promise<void>
  setCurrentWebsite: (website: Website | null) => void
  deployWebsite: (id: string) => Promise<{ url: string }>
  updateWebsiteFromMessage: (websiteId: string, updates: Partial<Website>) => void
}

export const useWebsiteStore = create<WebsiteState>()((set, get) => ({
  websites: [],
  currentWebsite: null,
  isLoading: false,
  error: null,

  fetchWebsites: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await websiteApi.list()
      const data = response.data.data
      // API returns { websites: Website[] }
      const websites = Array.isArray(data) ? data : (data as any)?.websites || []
      set({ websites, isLoading: false })
    } catch (error) {
      set({ error: 'Failed to fetch websites', isLoading: false })
    }
  },

  fetchWebsite: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await websiteApi.get(id)
      set({ currentWebsite: response.data.data!, isLoading: false })
    } catch (error) {
      set({ error: 'Failed to fetch website', isLoading: false })
    }
  },

  createWebsite: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await websiteApi.create(data)
      const newWebsite = response.data.data!
      set((state) => ({
        websites: [newWebsite, ...state.websites],
        currentWebsite: newWebsite,
        isLoading: false,
      }))
      return newWebsite
    } catch (error) {
      set({ error: 'Failed to create website', isLoading: false })
      throw error
    }
  },

  updateWebsite: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await websiteApi.update(id, data)
      const updated = response.data.data!
      set((state) => ({
        websites: state.websites.map((w) => (w.id === id ? updated : w)),
        currentWebsite: state.currentWebsite?.id === id ? updated : state.currentWebsite,
        isLoading: false,
      }))
    } catch (error) {
      set({ error: 'Failed to update website', isLoading: false })
      throw error
    }
  },

  deleteWebsite: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await websiteApi.delete(id)
      set((state) => ({
        websites: state.websites.filter((w) => w.id !== id),
        currentWebsite: state.currentWebsite?.id === id ? null : state.currentWebsite,
        isLoading: false,
      }))
    } catch (error) {
      set({ error: 'Failed to delete website', isLoading: false })
      throw error
    }
  },

  setCurrentWebsite: (website) => {
    set({ currentWebsite: website })
  },

  deployWebsite: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await websiteApi.deploy(id)
      const { url } = response.data.data!
      set((state) => ({
        websites: state.websites.map((w) =>
          w.id === id ? { ...w, status: 'published' as const, url } : w
        ),
        currentWebsite:
          state.currentWebsite?.id === id
            ? { ...state.currentWebsite, status: 'published', url }
            : state.currentWebsite,
        isLoading: false,
      }))
      return { url }
    } catch (error) {
      set({ error: 'Failed to deploy website', isLoading: false })
      throw error
    }
  },

  updateWebsiteFromMessage: (websiteId, updates) => {
    set((state) => ({
      websites: state.websites.map((w) =>
        w.id === websiteId ? { ...w, ...updates } : w
      ),
      currentWebsite:
        state.currentWebsite?.id === websiteId
          ? { ...state.currentWebsite, ...updates }
          : state.currentWebsite,
    }))
  },
}))
