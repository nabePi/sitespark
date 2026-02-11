import { useEffect, useCallback, useRef } from 'react'
import { useChatStore } from '@/stores/chat.store'
import { socket } from '@/lib/socket'
import type { ChatMessage } from '@/types'

export function useChat(websiteId?: string) {
  const {
    messages,
    isTyping,
    isLoading,
    error,
    suggestions,
    addMessage,
    addUserMessage,
    setTyping,
    setLoading,
    setError,
    clearMessages,
    updateLastMessage,
    setSuggestions,
    loadChatHistory,
  } = useChatStore()

  const streamingContent = useRef('')
  const messageInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    console.log('[useChat] Initializing chat connection for website:', websiteId)
    socket.connect()
    loadChatHistory(websiteId)

    if (websiteId) {
      socket.joinWebsite(websiteId)
    }

    const unsubscribeMessage = socket.onMessage((message: ChatMessage) => {
      console.log('[useChat] Received message:', message)
      if (message.role === 'assistant') {
        // Handle streaming effect for assistant messages
        streamingContent.current = message.content
        let currentIndex = 0
        const words = message.content.split(' ')

        // Add empty message first
        addMessage({
          ...message,
          content: '',
        })

        // Stream words
        messageInterval.current = setInterval(() => {
          if (currentIndex < words.length) {
            const partialContent = words.slice(0, currentIndex + 1).join(' ')
            updateLastMessage(partialContent)
            currentIndex++
          } else {
            if (messageInterval.current) {
              clearInterval(messageInterval.current)
            }
          }
        }, 50)
      } else {
        addMessage(message)
      }
    })

    const unsubscribeTyping = socket.onTyping(({ isTyping }: { userId: string; isTyping: boolean }) => {
      setTyping(isTyping)
    })

    const unsubscribeConnect = socket.onConnect(() => {
      console.log('[useChat] Socket connected')
    })

    const unsubscribeDisconnect = socket.onDisconnect(() => {
      console.log('[useChat] Socket disconnected')
    })

    return () => {
      console.log('[useChat] Cleaning up chat connection')
      unsubscribeMessage()
      unsubscribeTyping()
      unsubscribeConnect()
      unsubscribeDisconnect()
      if (websiteId) {
        socket.leaveWebsite(websiteId)
      }
      if (messageInterval.current) {
        clearInterval(messageInterval.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [websiteId])

  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return
    
    addUserMessage(content)
    socket.sendMessage(content, websiteId)
  }, [websiteId, addUserMessage])

  const sendTyping = useCallback((typing: boolean) => {
    socket.sendTyping(typing)
  }, [])

  return {
    messages,
    isTyping,
    isLoading,
    error,
    suggestions,
    sendMessage,
    sendTyping,
    clearMessages,
    setSuggestions,
  }
}
