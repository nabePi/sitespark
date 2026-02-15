import { useEffect, useCallback, useRef } from 'react'
import { useChatStore, type WorkflowStep } from '@/stores/chat.store'
import { useWebsiteStore } from '@/stores/website.store'
import { aiApi } from '@/lib/api'
import { socket } from '@/lib/socket'
import type { ChatMessage } from '@/types'

const workflowSteps: WorkflowStep[] = [
  'business_type',
  'business_name',
  'target_audience',
  'features',
  'style',
  'contact_info',
  'generating',
  'complete'
]

const getNextStep = (currentStep: WorkflowStep): WorkflowStep | null => {
  const currentIndex = workflowSteps.indexOf(currentStep)
  if (currentIndex === -1 || currentIndex >= workflowSteps.length - 2) return null
  return workflowSteps[currentIndex + 1]
}

const getStepQuestion = (step: WorkflowStep): string => {
  switch (step) {
    case 'business_type':
      return `**Langkah 1 dari 6: Jenis Bisnis**
Apa jenis bisnis atau kegiatan yang ingin Anda promosikan?

Contoh: Restoran, Coffee Shop, Portfolio Pribadi, Toko Online, Jasa Konsultasi, dll.`
    case 'business_name':
      return `**Langkah 2 dari 6: Nama Bisnis**
Apa nama bisnis atau brand Anda?

Ini akan digunakan sebagai judul utama website.`
    case 'target_audience':
      return `**Langkah 3 dari 6: Target Audiens**
Siapa target audiens atau pelanggan utama Anda?

Contoh: Anak muda 18-25 tahun, Profesional, Keluarga, dll.`
    case 'features':
      return `**Langkah 4 dari 6: Fitur Website**
Fitur apa saja yang ingin Anda tampilkan di website?

Contoh: Galeri foto, Menu, Testimoni, Form kontak, Blog, dll.
Anda bisa sebutkan beberapa fitur.`
    case 'style':
      return `**Langkah 5 dari 6: Gaya Desain**
Gaya desain seperti apa yang Anda inginkan?

Contoh: Modern minimalis, Elegan, Ceria, Profesional, dll.
Dan warna apa yang Anda sukai?`
    case 'contact_info':
      return `**Langkah 6 dari 6: Informasi Kontak**
Informasi kontak apa yang ingin ditampilkan?

Contoh: WhatsApp, Email, Alamat, Jam operasional, dll.`
    default:
      return ''
  }
}

const parseFeatures = (content: string): string[] => {
  // Simple parsing - split by common separators
  return content
    .split(/[,\n]+/)
    .map(f => f.trim())
    .filter(f => f.length > 0)
}

export function useChat(websiteId?: string) {
  const {
    messages,
    isTyping,
    isLoading,
    error,
    suggestions,
    workflow,
    isGenerating,
    addMessage,
    addUserMessage,
    setTyping,
    setLoading,
    setError,
    clearMessages,
    updateLastMessage,
    setSuggestions,
    loadChatHistory,
    setWorkflowStep,
    updateWorkflowData,
    setGenerating,
    getWorkflowPrompt,
  } = useChatStore()

  const { setCurrentWebsite } = useWebsiteStore()

  // Use refs to avoid stale closures in socket event handlers
  const callbacksRef = useRef({
    addMessage,
    updateLastMessage,
    setTyping,
    setLoading,
    setError,
  })

  // Keep refs up to date
  useEffect(() => {
    callbacksRef.current = {
      addMessage,
      updateLastMessage,
      setTyping,
      setLoading,
      setError,
    }
  }, [addMessage, updateLastMessage, setTyping, setLoading, setError])

  const streamingContent = useRef('')
  const messageIdRef = useRef<string | null>(null)
  const unsubscribeRef = useRef<{
    message?: () => void
    stream?: () => void
    typing?: () => void
    connect?: () => void
    disconnect?: () => void
  }>({})

  // Process workflow based on user message
  const processWorkflow = useCallback(async (userContent: string) => {
    const currentStep = workflow.step

    // Update workflow data based on current step
    switch (currentStep) {
      case 'initial':
        updateWorkflowData({ businessType: userContent })
        break
      case 'business_type':
        updateWorkflowData({ businessType: userContent })
        break
      case 'business_name':
        updateWorkflowData({ businessName: userContent })
        break
      case 'target_audience':
        updateWorkflowData({ targetAudience: userContent })
        break
      case 'features':
        updateWorkflowData({ features: parseFeatures(userContent) })
        break
      case 'style':
        updateWorkflowData({ style: userContent })
        break
      case 'contact_info':
        updateWorkflowData({ contactInfo: userContent })
        break
    }

    // Get next step
    const nextStep = getNextStep(currentStep === 'initial' ? 'business_type' : currentStep)

    if (nextStep && nextStep !== 'generating' && nextStep !== 'complete') {
      // Update to next step and ask the question
      setWorkflowStep(nextStep)

      // Wait a moment then ask the next question
      setTimeout(() => {
        const question = getStepQuestion(nextStep)
        addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: question,
          timestamp: new Date().toISOString(),
        })
      }, 500)
    } else if (nextStep === 'generating' || currentStep === 'contact_info') {
      // All questions answered - trigger automatic generation
      setWorkflowStep('generating')
      setGenerating(true)

      // Show generating message
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `✨ Semua informasi telah terkumpul! Saya akan membuat website Anda sekarang...\n\nMohon tunggu sebentar, proses ini membutuhkan waktu sekitar 1-2 menit.`,
        timestamp: new Date().toISOString(),
      })

      // Trigger website generation
      try {
        const prompt = getWorkflowPrompt()
        const subdomain = (workflow.data.businessName || 'my-website')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 20) || 'my-website'

        const result = await aiApi.generate(prompt, 'modern', subdomain)

        if (result.data.data?.website) {
          setCurrentWebsite(result.data.data.website)
          setWorkflowStep('complete')

          addMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `🎉 **Website Anda berhasil dibuat!**

Website "${result.data.data.website.name || workflow.data.businessName}" telah siap.

Anda dapat melihat preview di sebelah kanan. Klik tombol "Deploy Website" untuk mempublikasikannya!`,
            timestamp: new Date().toISOString(),
          })
        }
      } catch (error) {
        console.error('Failed to generate website:', error)
        addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Maaf, terjadi kesalahan saat membuat website. Pastikan Anda memiliki cukup token (50 token diperlukan) dan coba lagi.`,
          timestamp: new Date().toISOString(),
        })
      } finally {
        setGenerating(false)
      }
    }
  }, [workflow.step, workflow.data, updateWorkflowData, setWorkflowStep, addMessage, setGenerating, getWorkflowPrompt, setCurrentWebsite])

  useEffect(() => {
    console.log('[useChat] Initializing chat connection for website:', websiteId)

    // Connect socket
    socket.connect()

    // Load chat history
    loadChatHistory(websiteId)

    // Join website room if specified
    if (websiteId) {
      socket.joinWebsite(websiteId)
    }

    // Set up event listeners with stable refs
    unsubscribeRef.current.message = socket.onMessage((message: ChatMessage) => {
      console.log('[useChat] Received message:', message)
      const { addMessage: addMsg } = callbacksRef.current

      if (message.role === 'assistant') {
        // Final message received - reset stream tracking
        messageIdRef.current = null
        streamingContent.current = ''
      }
      addMsg(message)
    })

    // Handle streaming chunks
    unsubscribeRef.current.stream = socket.onStream((chunk: string, messageId: string) => {
      console.log('[useChat] Received stream chunk:', chunk)
      const { addMessage: addMsg, updateLastMessage: updateLast } = callbacksRef.current

      // If this is a new message stream, create an empty message
      if (messageIdRef.current !== messageId) {
        messageIdRef.current = messageId
        streamingContent.current = chunk

        // Add empty message first
        addMsg({
          id: messageId,
          role: 'assistant',
          content: chunk,
          timestamp: new Date().toISOString(),
        })
      } else {
        // Update existing message with new content
        streamingContent.current += chunk
        updateLast(streamingContent.current)
      }
    })

    unsubscribeRef.current.typing = socket.onTyping(({ isTyping }: { userId: string; isTyping: boolean }) => {
      callbacksRef.current.setTyping(isTyping)
    })

    unsubscribeRef.current.connect = socket.onConnect(() => {
      console.log('[useChat] Socket connected')
    })

    unsubscribeRef.current.disconnect = socket.onDisconnect(() => {
      console.log('[useChat] Socket disconnected')
    })

    // Cleanup function
    return () => {
      console.log('[useChat] Cleaning up chat connection')

      // Unsubscribe from events
      unsubscribeRef.current.message?.()
      unsubscribeRef.current.stream?.()
      unsubscribeRef.current.typing?.()
      unsubscribeRef.current.connect?.()
      unsubscribeRef.current.disconnect?.()

      // Leave website room
      if (websiteId) {
        socket.leaveWebsite(websiteId)
      }
    }
  }, [websiteId, loadChatHistory])

  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return

    addUserMessage(content)

    // Process workflow after adding message
    processWorkflow(content)

    // Also send to socket for AI response (optional, for more dynamic conversation)
    // socket.sendMessage(content, websiteId)
  }, [websiteId, addUserMessage, processWorkflow])

  const sendTyping = useCallback((typing: boolean) => {
    socket.sendTyping(typing)
  }, [])

  return {
    messages,
    isTyping,
    isLoading,
    error,
    suggestions,
    workflow,
    isGenerating,
    sendMessage,
    sendTyping,
    clearMessages,
    setSuggestions,
  }
}
