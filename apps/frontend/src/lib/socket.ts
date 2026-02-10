import type { ChatMessage } from '@/types'

// Socket.IO disabled - backend Go doesn't have Socket.IO implemented
// Using HTTP API for chat instead

class SocketClient {
  private messageCallbacks: ((message: ChatMessage) => void)[] = []
  private typingCallbacks: ((isTyping: boolean) => void)[] = []
  private connectCallbacks: (() => void)[] = []
  private disconnectCallbacks: (() => void)[] = []

  connect() {
    // Socket.IO disabled - backend not implemented
    console.log('Socket.IO disabled - using HTTP API')
    return this
  }

  disconnect() {
    // No-op
  }

  sendMessage(_content: string, _websiteId?: string) {
    // Use HTTP API instead
    console.log('Use sendMessage API instead')
  }

  sendTyping(_isTyping: boolean) {
    // Use HTTP API instead
  }

  joinWebsite(_websiteId: string) {
    // No-op
  }

  leaveWebsite(_websiteId: string) {
    // No-op
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
    // Call immediately since no actual connection
    callback()
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
    return true // Always return true to not block UI
  }
}

export const socket = new SocketClient()
