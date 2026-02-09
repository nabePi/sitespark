import { create } from 'zustand'
import type { ChatMessage } from '@/types'

interface ChatState {
  messages: ChatMessage[]
  isTyping: boolean
  isLoading: boolean
  error: string | null
  suggestions: string[]
  
  // Actions
  addMessage: (message: ChatMessage) => void
  addUserMessage: (content: string) => void
  addAssistantMessage: (content: string, metadata?: ChatMessage['metadata']) => void
  setTyping: (isTyping: boolean) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearMessages: () => void
  updateLastMessage: (content: string) => void
  setSuggestions: (suggestions: string[]) => void
  loadChatHistory: (websiteId?: string) => Promise<void>
}

const defaultSuggestions = [
  'Buatkan website untuk coffee shop',
  'Buatkan landing page produk digital',
  'Buatkan portfolio designer',
  'Buatkan website restoran',
  'Tambahkan section testimonial',
  'Ganti warna tema jadi biru',
]

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  isTyping: false,
  isLoading: false,
  error: null,
  suggestions: defaultSuggestions,

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }))
  },

  addUserMessage: (content) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }
    get().addMessage(message)
  },

  addAssistantMessage: (content, metadata) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
      metadata,
    }
    get().addMessage(message)
  },

  setTyping: (isTyping) => {
    set({ isTyping })
  },

  setLoading: (isLoading) => {
    set({ isLoading })
  },

  setError: (error) => {
    set({ error })
  },

  clearMessages: () => {
    set({ messages: [], error: null })
  },

  updateLastMessage: (content) => {
    set((state) => {
      const messages = [...state.messages]
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.content = content
      }
      return { messages }
    })
  },

  setSuggestions: (suggestions) => {
    set({ suggestions })
  },

  loadChatHistory: async (websiteId) => {
    set({ isLoading: true })
    try {
      // In a real app, fetch from API
      // For now, start with a welcome message
      const welcomeMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Halo! Saya AI Builder SiteSpark. Ceritakan website impian Anda, saya akan bantu buatkan dalam 1 menit! 🚀',
        timestamp: new Date().toISOString(),
      }
      set({ messages: [welcomeMessage], isLoading: false })
    } catch (error) {
      set({ error: 'Failed to load chat history', isLoading: false })
    }
  },
}))
