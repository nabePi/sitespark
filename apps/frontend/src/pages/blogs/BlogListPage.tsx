import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Tag,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { BlogPost } from '@/types'

// Mock data - would come from API
const mockPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Getting Started with SiteSpark',
    slug: 'getting-started',
    excerpt: 'Learn how to create your first website with AI',
    content: '...',
    status: 'published',
    tags: ['tutorial', 'beginner'],
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: '10 Tips for Better Website Design',
    slug: 'design-tips',
    excerpt: 'Improve your website design with these tips',
    content: '...',
    status: 'draft',
    tags: ['design', 'tips'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

interface BlogCardProps {
  post: BlogPost
  onDelete: (id: string) => void
}

function BlogCard({ post, onDelete }: BlogCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card group relative"
    >
      <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-t-2xl overflow-hidden">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-12 h-12 text-slate-300" />
          </div>
        )}
        
        <span className={`
          absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium
          ${post.status === 'published' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-yellow-100 text-yellow-700'}
        `}>
          {post.status}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-slate-900 mb-2 line-clamp-1">{post.title}</h3>
        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{post.excerpt}</p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 flex items-center gap-1"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {new Date(post.updatedAt).toLocaleDateString()}
          </p>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 bottom-full mb-2 w-40 glass-card py-2 z-10">
                <Link
                  to={`/blogs/${post.id}/edit`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100/50 w-full"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>
                
                <button
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100/50 w-full"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                
                <button
                  onClick={() => onDelete(post.id)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function BlogListPage() {
  const [posts] = useState<BlogPost[]>(mockPosts)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleDelete = () => {
    setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blog Posts</h1>
          <p className="text-slate-600">Manage your blog content</p>
        </div>

        <Link to="/blogs/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          type="text"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12"
        />
      </div>

      {filteredPosts.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-16 text-center">
            <p className="text-slate-500">No posts found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <BlogCard
              key={post.id}
              post={post}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this blog post? This action cannot be undone.
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
