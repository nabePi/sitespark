import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  MessageSquare,
  Globe,
  Wallet,
  FileText,
  FormInput,
  Settings,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/chat', label: 'AI Builder', icon: MessageSquare },
  { path: '/websites', label: 'Websites', icon: Globe },
  { path: '/tokens', label: 'Tokens', icon: Wallet },
  { path: '/blogs', label: 'Blog', icon: FileText },
  { path: '/forms', label: 'Forms', icon: FormInput },
]

const bottomItems = [
  { path: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-72 glass border-r border-white/20 flex flex-col h-full">
      <div className="p-6">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cta flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">SiteSpark</span>
        </NavLink>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || 
                          location.pathname.startsWith(`${item.path}/`)
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className={cn(
                'w-5 h-5 relative z-10',
                isActive && 'text-primary'
              )} />
              <span className="relative z-10">{item.label}</span>
              
              {isActive && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/20">
        {bottomItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-all duration-200"
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </aside>
  )
}
