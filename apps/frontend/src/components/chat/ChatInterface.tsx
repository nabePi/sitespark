import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Sparkles } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { useWebsiteStore } from '@/stores/website.store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
}

function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex gap-4 max-w-[85%]',
        isUser ? 'ml-auto flex-row-reverse' : ''
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
          isUser
            ? 'bg-primary text-white'
            : 'bg-gradient-to-br from-primary/20 to-cta/20'
        )}
      >
        {isUser ? (
          <span className="text-xs font-bold">U</span>
        ) : (
          <Sparkles className="w-4 h-4 text-primary" />
        )}
      </div>

      <div
        className={cn(
          'rounded-2xl px-5 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-white rounded-br-md'
            : 'bg-white/80 backdrop-blur border border-white/50 rounded-bl-md'
        )}
      >
        {content}
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-4 max-w-[85%]"
    >
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-cta/20 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-primary" />
      </div>

      <div className="bg-white/80 backdrop-blur border border-white/50 rounded-2xl rounded-bl-md px-5 py-4">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -4, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
              }}
              className="w-2 h-2 rounded-full bg-primary/60"
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

interface ChatInterfaceProps {
  websiteId?: string
}

export function ChatInterface({ websiteId }: ChatInterfaceProps) {
  const { messages, isTyping, suggestions, sendMessage } = useChat(websiteId)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const { currentWebsite } = useWebsiteStore()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Website Info */}
      {currentWebsite && (
        <div className="glass-card mb-4 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-cta/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{currentWebsite.name}</p>
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-medium
                ${currentWebsite.status === 'published' 
                  ? 'bg-green-100 text-green-700' 
                  : currentWebsite.status === 'building'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-slate-100 text-slate-700'}
              `}>
                {currentWebsite.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 pr-4">
        <div className="space-y-6 pb-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              role={message.role}
              content={message.content}
            />
          ))}
          
          {isTyping && <TypingIndicator />}
        </div>
      </ScrollArea>

      {/* Suggestions */}
      {suggestions.length > 0 && !isTyping && messages.length < 3 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {suggestions.slice(0, 4).map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                sendMessage(suggestion)
              }}
              className="px-4 py-2 rounded-full text-sm bg-white/60 hover:bg-white/90 border border-white/40 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="glass-card p-2 flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the website you want to build..."
            className="flex-1 min-h-[60px] max-h-[120px] border-0 bg-transparent focus-visible:ring-0 resize-none"
          />
          
          <Button
            type="submit"
            disabled={!input.trim()}
            size="icon"
            className="h-10 w-10 rounded-xl shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Press Enter to send, Shift + Enter for new line
        </p>
      </form>
    </div>
  )
}
