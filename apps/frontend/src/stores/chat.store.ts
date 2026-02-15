import { create } from 'zustand'
import type { ChatMessage } from '@/types'

export type WorkflowStep =
  | 'initial'
  | 'business_type'
  | 'business_name'
  | 'target_audience'
  | 'features'
  | 'style'
  | 'contact_info'
  | 'generating'
  | 'complete'

export interface WorkflowState {
  step: WorkflowStep
  data: {
    businessType?: string
    businessName?: string
    targetAudience?: string
    features?: string[]
    style?: string
    contactInfo?: string
    colorPreference?: string
  }
}

interface ChatState {
  messages: ChatMessage[]
  isTyping: boolean
  isLoading: boolean
  error: string | null
  suggestions: string[]
  workflow: WorkflowState
  isGenerating: boolean

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

  // Workflow actions
  setWorkflowStep: (step: WorkflowStep) => void
  updateWorkflowData: (data: Partial<WorkflowState['data']>) => void
  resetWorkflow: () => void
  setGenerating: (isGenerating: boolean) => void
  getWorkflowPrompt: () => string
}

const defaultSuggestions = [
  'Saya ingin membuat website restoran',
  'Saya ingin membuat portfolio designer',
  'Saya ingin membuat website untuk coffee shop',
  'Saya ingin membuat landing page produk',
]

const getWelcomeMessage = () => `Halo! Saya AI Builder SiteSpark. 🚀

Saya akan membantu Anda membuat website impian. Mari kita mulai dengan beberapa pertanyaan sederhana.

**Langkah 1 dari 6: Jenis Bisnis**
Apa jenis bisnis atau kegiatan yang ingin Anda promosikan?

Contoh: Restoran, Coffee Shop, Portfolio Pribadi, Toko Online, Jasa Konsultasi, dll.`

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  isTyping: false,
  isLoading: false,
  error: null,
  suggestions: defaultSuggestions,
  workflow: {
    step: 'initial',
    data: {}
  },
  isGenerating: false,

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
    set({ messages: [], error: null, workflow: { step: 'initial', data: {} } })
  },

  updateLastMessage: (content) => {
    set((state) => {
      const messages = [...state.messages]
      const lastIndex = messages.length - 1
      const lastMessage = messages[lastIndex]
      if (lastMessage && lastMessage.role === 'assistant') {
        messages[lastIndex] = { ...lastMessage, content }
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
      const welcomeMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: getWelcomeMessage(),
        timestamp: new Date().toISOString(),
      }
      set({ messages: [welcomeMessage], isLoading: false })
    } catch (error) {
      set({ error: 'Failed to load chat history', isLoading: false })
    }
  },

  // Workflow actions
  setWorkflowStep: (step) => {
    set((state) => ({
      workflow: { ...state.workflow, step }
    }))
  },

  updateWorkflowData: (data) => {
    set((state) => ({
      workflow: {
        ...state.workflow,
        data: { ...state.workflow.data, ...data }
      }
    }))
  },

  resetWorkflow: () => {
    set({ workflow: { step: 'initial', data: {} } })
  },

  setGenerating: (isGenerating) => {
    set({ isGenerating })
  },

  getWorkflowPrompt: () => {
    const { data } = get().workflow
    const features = data.features?.join(', ') || ''

    return `Buatkan website ${data.businessType || ''} dengan nama "${data.businessName || ''}".

Target audiens: ${data.targetAudience || ''}

Fitur yang diinginkan: ${features}

Gaya desain: ${data.style || 'modern dan profesional'}

Preferensi warna: ${data.colorPreference || 'sesuai brand'}

Informasi kontak: ${data.contactInfo || 'akan ditambahkan nanti'}

Buatkan website lengkap dengan:
- Hero section yang menarik
- About section
- Services/Products section
- Contact section
- Footer dengan informasi lengkap`
  }
}))
