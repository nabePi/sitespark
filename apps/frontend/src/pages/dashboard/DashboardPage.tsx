import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Globe,
  Coins,
  Sparkles,
  ArrowRight,
  Plus,
  ExternalLink,
  MoreHorizontal,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useWebsites } from '@/hooks/useWebsite'
import { useTokenStore } from '@/stores/token.store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function DashboardPage() {
  const { user } = useAuth()
  const { websites, fetchWebsites } = useWebsites()
  const { balance, fetchBalance } = useTokenStore()

  useEffect(() => {
    fetchBalance()
    fetchWebsites()
  }, [fetchBalance, fetchWebsites])

  const recentWebsites = websites.slice(0, 5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-600 mt-1">
          Here's what's happening with your websites
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Total Websites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-slate-900">{websites.length}</span>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Token Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-slate-900">{balance.toLocaleString()}</span>
                <div className="w-10 h-10 rounded-xl bg-cta/10 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-cta" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Published
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-slate-900">
                  {websites.filter(w => w.status === 'published').length}
                </span>
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                AI Credits Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-slate-900">1.2k</span>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link to="/chat">
              <Button className="bg-primary">
                <Sparkles className="w-4 h-4 mr-2" />
                Build with AI
              </Button>
            </Link>
            
            <Link to="/websites">
              <Button variant="outline">
                <Globe className="w-4 h-4 mr-2" />
                View All Websites
              </Button>
            </Link>
            
            <Link to="/tokens">
              <Button variant="outline">
                <Coins className="w-4 h-4 mr-2" />
                Buy Tokens
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Websites */}
      <Card className="glass-card border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Websites</CardTitle>
          <Link
            to="/websites"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentWebsites.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Globe className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 mb-4">No websites yet</p>
              <Link to="/chat">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Website
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentWebsites.map((website) => (
                <div
                  key={website.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/50 hover:bg-white/80 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-cta/20 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{website.name}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(website.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-medium
                      ${website.status === 'published' 
                        ? 'bg-green-100 text-green-700' 
                        : website.status === 'building'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-slate-100 text-slate-700'}
                    `}>
                      {website.status}
                    </span>
                    
                    <button className="p-2 rounded-lg hover:bg-slate-100">
                      <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
