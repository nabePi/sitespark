import { io, Socket } from 'socket.io-client'
import type { ChatMessage } from '@/types'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'

class SocketClient {
  private socket: Socket | null = null
  private messageCallbacks: ((message: ChatMessage) => void)[] = []
  private typingCallbacks: ((isTyping: boolean) => void)[] = []
  private connectCallbacks: (() => void)[] = []
  private disconnectCallbacks: (() => void)[] = []

  connect() {
    const token = localStorage.getItem('token')
    
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    })

    this.socket.on('connect', () => {
      console.log('Socket connected')
      this.connectCallbacks.forEach(cb => cb())
    })

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
      this.disconnectCallbacks.forEach(cb => cb())
    })

    this.socket.on('message', (message: ChatMessage) => {
      this.messageCallbacks.forEach(cb => cb(message))
    })

    this.socket.on('typing', (isTyping: boolean) => {
      this.typingCallbacks.forEach(cb => cb(isTyping))
    })

    this.socket.on('error', (error: Error) => {
      console.error('Socket error:', error)
    })

    return this
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }

  sendMessage(content: string, websiteId?: string) {
    this.socket?.emit('message', { content, websiteId })
  }

  sendTyping(isTyping: boolean) {
    this.socket?.emit('typing', isTyping)
  }

  joinWebsite(websiteId: string) {
    this.socket?.emit('join-website', websiteId)
  }

  leaveWebsite(websiteId: string) {
    this.socket?.emit('leave-website', websiteId)
  }

  onMessage(callback: (message: ChatMessage) => void) {
    this.messageCallbacks.push(callback)
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback)
    }
  }

  onTyping(callback: (isTyping: boolean) => void) {
    this.typingCallbacks.push(callback)
    return () => {
      this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback)
    }
  }

  onConnect(callback: () => void) {
    this.connectCallbacks.push(callback)
    return () => {
      this.connectCallbacks = this.connectCallbacks.filter(cb => cb !== callback)
    }
  }

  onDisconnect(callback: () => void) {
    this.disconnectCallbacks.push(callback)
    return () => {
      this.disconnectCallbacks = this.disconnectCallbacks.filter(cb => cb !== callback)
    }
  }

  isConnected() {
    return this.socket?.connected ?? false
  }
}

export const socket = new SocketClient()
