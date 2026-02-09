import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useWebsite } from '@/hooks/useWebsite'
import { WebsitePreview } from '@/components/preview/WebsitePreview'
import { Button } from '@/components/ui/button'

export function PreviewPage() {
  const { id } = useParams<{ id: string }>()
  const { website, isLoading, fetchWebsite } = useWebsite(id)

  useEffect(() => {
    if (id) {
      fetchWebsite(id)
    }
  }, [id, fetchWebsite])

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Link to="/websites">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          
          <div>
            <h1 className="text-xl font-bold text-slate-900">{website?.name || 'Preview'}</h1>
            {website?.url && (
              <a
                href={website.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {website.url}
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`
            px-3 py-1 rounded-full text-xs font-medium
            ${website?.status === 'published' 
              ? 'bg-green-100 text-green-700' 
              : website?.status === 'building'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-slate-100 text-slate-700'}
          `}>
            {website?.status || 'draft'}
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 glass-card overflow-hidden"
      >
        <WebsitePreview website={website} />
      </motion.div>
    </div>
  )
}
