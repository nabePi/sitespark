import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { WebsitePreview } from '@/components/preview/WebsitePreview'
import { useWebsiteStore } from '@/stores/website.store'

export function ChatPage() {
  const { currentWebsite, setCurrentWebsite } = useWebsiteStore()

  useEffect(() => {
    // Reset current website when entering chat page for new website
    return () => {
      setCurrentWebsite(null)
    }
  }, [setCurrentWebsite])

  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          AI Website Builder
        </h1>
        <p className="text-slate-600">
          Describe your dream website and watch it come to life
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 h-[calc(100%-6rem)]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card h-full"
        >
          <ChatInterface websiteId={currentWebsite?.id} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card h-full hidden lg:block"
        >
          <WebsitePreview website={currentWebsite} />
        </motion.div>
      </div>
    </div>
  )
}
