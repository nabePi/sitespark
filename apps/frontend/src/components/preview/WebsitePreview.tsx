import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Smartphone, 
  Monitor, 
  RefreshCw, 
  ExternalLink,
  Loader2,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Website } from '@/types'

interface WebsitePreviewProps {
  website?: Website | null
}

export function WebsitePreview({ website }: WebsitePreviewProps) {
  const [device, setDevice] = useState<'mobile' | 'desktop'>('desktop')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [key, setKey] = useState(0)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setKey(prev => prev + 1)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const previewUrl = website?.url || website?.id 
    ? `http://localhost:3001/preview/${website?.id || 'demo'}`
    : null

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-white/20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDevice('mobile')}
            className={`
              p-2 rounded-lg transition-colors
              ${device === 'mobile' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-slate-600'}
            `}
          >
            <Smartphone className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setDevice('desktop')}
            className={`
              p-2 rounded-lg transition-colors
              ${device === 'desktop' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-slate-600'}
            `}
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          
          {website?.url && (
            <a
              href={website.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 bg-slate-100/50 p-4 overflow-auto">
        <div className="h-full flex items-center justify-center">
          {previewUrl ? (
            <motion.div
              key={device + key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`
                bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300
                ${device === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full h-full max-w-[1200px]'}
              `}
            >
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="Website Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </motion.div>
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-200 flex items-center justify-center">
                {website?.status === 'building' ? (
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                ) : (
                  <Globe className="w-10 h-10 text-slate-400" />
                )}
              </div>
              
              <p className="text-slate-500">
                {website?.status === 'building'
                  ? 'Building your website...'
                  : 'No preview available'}
              </p>
              
              {website?.status === 'building' && (
                <p className="text-sm text-slate-400 mt-2">
                  This may take a minute
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Deploy Button */}
      {website && website.status !== 'published' && (
        <div className="p-3 border-t border-white/20">
          <Button className="w-full">
            <ExternalLink className="w-4 h-4 mr-2" />
            Deploy Website
          </Button>
        </div>
      )}
    </div>
  )
}
