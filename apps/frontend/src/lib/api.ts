import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types'

const API_BASE_URL = 'http://localhost:3001/api'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse<unknown>>) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  get<T>(url: string, params?: Record<string, unknown>) {
    return this.client.get<ApiResponse<T>>(url, { params })
  }

  post<T>(url: string, data?: unknown) {
    return this.client.post<ApiResponse<T>>(url, data)
  }

  put<T>(url: string, data?: unknown) {
    return this.client.put<ApiResponse<T>>(url, data)
  }

  patch<T>(url: string, data?: unknown) {
    return this.client.patch<ApiResponse<T>>(url, data)
  }

  delete<T>(url: string) {
    return this.client.delete<ApiResponse<T>>(url)
  }
}

export const api = new ApiClient()

// API endpoints
export const authApi = {
  login: (email: string, password: string) => 
    api.post<{ user: import('@/types').User; accessToken: string }>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post<{ user: import('@/types').User; accessToken: string }>('/auth/register', { name, email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<import('@/types').User>('/auth/me'),
}

export const websiteApi = {
  list: () => api.get<import('@/types').Website[]>('/websites'),
  get: (id: string) => api.get<import('@/types').Website>(`/websites/${id}`),
  create: (data: Partial<import('@/types').Website>) => api.post<import('@/types').Website>('/websites', data),
  update: (id: string, data: Partial<import('@/types').Website>) => api.put<import('@/types').Website>(`/websites/${id}`, data),
  delete: (id: string) => api.delete(`/websites/${id}`),
  deploy: (id: string) => api.post<{ url: string }>(`/websites/${id}/deploy`),
}

export const tokenApi = {
  getBalance: () => api.get<{ balance: number }>('/tokens/balance'),
  getTransactions: () => api.get<import('@/types').TokenTransaction[]>('/tokens/transactions'),
  getPackages: () => api.get<import('@/types').TokenPackage[]>('/tokens/packages'),
  purchase: (packageId: string, paymentMethod: string) => 
    api.post('/tokens/purchase', { packageId, paymentMethod }),
}

export const blogApi = {
  list: () => api.get<import('@/types').BlogPost[]>('/blogs'),
  get: (id: string) => api.get<import('@/types').BlogPost>(`/blogs/${id}`),
  create: (data: Partial<import('@/types').BlogPost>) => api.post<import('@/types').BlogPost>('/blogs', data),
  update: (id: string, data: Partial<import('@/types').BlogPost>) => api.put<import('@/types').BlogPost>(`/blogs/${id}`, data),
  delete: (id: string) => api.delete(`/blogs/${id}`),
}

export const formApi = {
  list: (websiteId: string) => api.get<import('@/types').Form[]>(`/websites/${websiteId}/forms`),
  get: (id: string) => api.get<import('@/types').Form>(`/forms/${id}`),
  create: (websiteId: string, data: Partial<import('@/types').Form>) => 
    api.post<import('@/types').Form>(`/websites/${websiteId}/forms`, data),
  update: (id: string, data: Partial<import('@/types').Form>) => api.put<import('@/types').Form>(`/forms/${id}`, data),
  delete: (id: string) => api.delete(`/forms/${id}`),
  getSubmissions: (id: string) => api.get<import('@/types').FormSubmission[]>(`/forms/${id}/submissions`),
}
