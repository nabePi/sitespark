import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Globe,
  Plus,
  MoreHorizontal,
  ExternalLink,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react'
import { useWebsites } from '@/hooks/useWebsite'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Website } from '@/types'

interface WebsiteCardProps {
  website: Website
  onDelete: (id: string) => void
}

function WebsiteCard({ website, onDelete }: WebsiteCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card group"
    >
      <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-t-2xl overflow-hidden relative">
        {website.thumbnail ? (
          <img
            src={website.thumbnail}
            alt={website.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Globe className="w-12 h-12 text-slate-300" />
          </div>
        )}

        <div className="absolute top-3 right-3">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg bg-white/80 backdrop-blur hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-40 glass-card py-2 z-10">
              <Link
                to={`/websites/${website.id}/preview`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100/50"
              >
                <ExternalLink className="w-4 h-4" />
                Preview
              </Link>
              
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100/50 w-full"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              
              <button
                onClick={() => onDelete(website.id)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>

        <span className={`
          absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium
          ${website.status === 'published' 
            ? 'bg-green-100 text-green-700' 
            : website.status === 'building'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-slate-100 text-slate-700'}
        `}>
          {website.status}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-slate-900 mb-1">{website.name}</h3>
        <p className="text-sm text-slate-500 line-clamp-1">
          {website.description || 'No description'}
        </p>
        
        <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
          <span>
            {new Date(website.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export function WebsitesListPage() {
  const { websites, isLoading, deleteWebsite } = useWebsites()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (deleteId) {
      await deleteWebsite(deleteId)
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Websites</h1>
          <p className="text-slate-600">Manage and edit your websites</p>
        </div>

        <Link to="/chat">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Website
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : websites.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Globe className="w-10 h-10 text-slate-400" />
            </div>
            
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No websites yet</h3>
            <p className="text-slate-500 mb-6">Create your first website with AI</p>
            
            <Link to="/chat">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Website
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map((website) => (
            <WebsiteCard
              key={website.id}
              website={website}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Website</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this website? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
