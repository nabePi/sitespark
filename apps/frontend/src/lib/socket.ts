import type { ChatMessage } from '@/types'

type MessageCallback = (message: ChatMessage) => void
 type TypingCallback = (data: { userId: string; isTyping: boolean }) => void
 type ConnectCallback = () => void
 type DisconnectCallback = () => void
 type StreamCallback = (chunk: string, messageId: string) => void

 interface WebSocketMessage {
  type: string
  id?: string
  userId?: string
  content?: string
  role?: 'user' | 'assistant'
  chunk?: string
  isTyping?: boolean
  websiteId?: string
  timestamp?: string
  error?: string
  metadata?: Record<string, unknown>
}

 class SocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private pingInterval: ReturnType<typeof setInterval> | null = null

  private messageCallbacks: MessageCallback[] = []
  private typingCallbacks: TypingCallback[] = []
  private connectCallbacks: ConnectCallback[] = []
  private disconnectCallbacks: DisconnectCallback[] = []
  private streamCallbacks: StreamCallback[] = []

  private pendingMessages: WebSocketMessage[] = []

  connect(): this {
    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('[Socket] No token found, WebSocket connection requires authentication')
      return this
    }

    // Prevent multiple connections
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('[Socket] Already connected or connecting, skipping')
      return this
    }

    const wsUrl = `${import.meta.env.VITE_SOCKET_URL || 'ws://localhost:3001'}/ws?token=${token}`
    console.log('[Socket] Connecting to:', wsUrl)

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('[Socket] WebSocket connected successfully')
        this.reconnectAttempts = 0
        this.startPingInterval()
        this.connectCallbacks.forEach(cb => cb())

        // Send any pending messages
        while (this.pendingMessages.length > 0) {
          const msg = this.pendingMessages.shift()
          if (msg) this.send(msg)
        }
      }

      this.ws.onmessage = (event) => {
        console.log('[Socket] Received message:', event.data)
        try {
          const data: WebSocketMessage = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (err) {
          console.error('[Socket] Failed to parse WebSocket message:', err)
        }
      }

      this.ws.onclose = (event) => {
        console.log('[Socket] WebSocket disconnected. Code:', event.code, 'Reason:', event.reason)
        this.stopPingInterval()
        this.disconnectCallbacks.forEach(cb => cb())
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        console.error('[Socket] WebSocket error:', error)
      }
    } catch (err) {
      console.error('[Socket] Failed to create WebSocket connection:', err)
    }

    return this
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.stopPingInterval()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Send ping to keep connection alive
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000) // Ping every 30 seconds
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private handleMessage(data: WebSocketMessage): void {
    switch (data.type) {
      case 'chat:message':
        if (data.id && data.role && data.content) {
          const message: ChatMessage = {
            id: data.id,
            role: data.role,
            content: data.content,
            timestamp: data.timestamp || new Date().toISOString(),
            metadata: data.metadata,
          }
          this.messageCallbacks.forEach(cb => cb(message))
        }
        break

      case 'chat:stream':
        if (data.chunk && data.id) {
          this.streamCallbacks.forEach(cb => cb(data.chunk!, data.id!))
        }
        break

      case 'chat:typing':
        if (data.userId !== undefined && data.isTyping !== undefined) {
          this.typingCallbacks.forEach(cb => cb({ userId: data.userId!, isTyping: data.isTyping! }))
        }
        break

      case 'connected':
        console.log('WebSocket connection confirmed by server')
        break

      case 'error':
        console.error('WebSocket error from server:', data.error)
        break

      default:
        // Ignore unknown message types
        break
    }
  }

  private send(data: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      // Queue message for when connection is established
      this.pendingMessages.push(data)
    }
  }

  sendMessage(content: string, websiteId?: string): void {
    this.send({
      type: 'chat:message',
      content,
      websiteId,
    })
  }

  sendTyping(isTyping: boolean): void {
    this.send({
      type: 'chat:typing',
      isTyping,
    })
  }

  joinWebsite(websiteId: string): void {
    this.send({
      type: 'website:join',
      websiteId,
    })
  }

  leaveWebsite(websiteId: string): void {
    this.send({
      type: 'website:leave',
      websiteId,
    })
  }

  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.push(callback)
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback)
    }
  }

  onTyping(callback: TypingCallback): () => void {
    this.typingCallbacks.push(callback)
    return () => {
      this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback)
    }
  }

  onConnect(callback: ConnectCallback): () => void {
    this.connectCallbacks.push(callback)
    // If already connected, call immediately
    if (this.isConnected()) {
      callback()
    }
    return () => {
      this.connectCallbacks = this.connectCallbacks.filter(cb => cb !== callback)
    }
  }

  onDisconnect(callback: DisconnectCallback): () => void {
    this.disconnectCallbacks.push(callback)
    return () => {
      this.disconnectCallbacks = this.disconnectCallbacks.filter(cb => cb !== callback)
    }
  }

  onStream(callback: StreamCallback): () => void {
    this.streamCallbacks.push(callback)
    return () => {
      this.streamCallbacks = this.streamCallbacks.filter(cb => cb !== callback)
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const socket = new SocketClient()
