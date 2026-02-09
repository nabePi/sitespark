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
    socket.connect()
    loadChatHistory(websiteId)

    if (websiteId) {
      socket.joinWebsite(websiteId)
    }

    const unsubscribeMessage = socket.onMessage((message: ChatMessage) => {
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

    const unsubscribeTyping = socket.onTyping((typing: boolean) => {
      setTyping(typing)
    })

    return () => {
      unsubscribeMessage()
      unsubscribeTyping()
      if (websiteId) {
        socket.leaveWebsite(websiteId)
      }
      if (messageInterval.current) {
        clearInterval(messageInterval.current)
      }
    }
  }, [websiteId, addMessage, setTyping, loadChatHistory, updateLastMessage])

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
