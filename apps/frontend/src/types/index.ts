export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  tokenBalance: number
  createdAt: string
  updatedAt: string
}

export interface Website {
  id: string
  userId: string
  name: string
  description?: string
  status: 'draft' | 'building' | 'published' | 'failed'
  url?: string
  thumbnail?: string
  config: WebsiteConfig
  createdAt: string
  updatedAt: string
}

export interface WebsiteConfig {
  theme?: string
  colors?: {
    primary: string
    secondary: string
    background: string
    text: string
  }
  fonts?: string[]
  sections?: WebsiteSection[]
}

export interface WebsiteSection {
  id: string
  type: string
  content: Record<string, unknown>
  order: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  metadata?: {
    websiteId?: string
    action?: string
    data?: unknown
  }
}

export interface TokenTransaction {
  id: string
  userId: string
  type: 'credit' | 'debit'
  amount: number
  balance: number
  description: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface TokenPackage {
  id: string
  name: string
  tokens: number
  price: number
  currency: string
  bonus?: number
}

export interface Form {
  id: string
  websiteId: string
  name: string
  fields: FormField[]
  submissions: FormSubmission[]
  createdAt: string
  updatedAt: string
}

export interface FormField {
  id: string
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'radio'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

export interface FormSubmission {
  id: string
  formId: string
  data: Record<string, string>
  createdAt: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}
