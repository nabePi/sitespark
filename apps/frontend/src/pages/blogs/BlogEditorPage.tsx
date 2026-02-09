import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

export function BlogEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    tags: '',
    status: 'draft' as 'draft' | 'published',
  })

  const handleSave = () => {
    // Save logic here
    navigate('/blogs')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/blogs')}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditing ? 'Edit Post' : 'New Post'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="glass-card">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Post title"
                className="h-12 text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Slug</label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="post-url-slug"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Excerpt</label>
              <Textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief description of the post"
                className="h-20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your post content here..."
                className="min-h-[400px] font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tags</label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-slate-700">Status:</label>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'draft' })}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${formData.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                  `}
                >
                  Draft
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'published' })}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${formData.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                  `}
                >
                  Published
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
