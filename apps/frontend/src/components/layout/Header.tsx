import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Coins,
  Bell,
  LogOut,
  User,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTokenStore } from '@/stores/token.store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function Header() {
  const { user, logout } = useAuth()
  const { balance } = useTokenStore()
  const [showDropdown, setShowDropdown] = useState(false)

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U'

  return (
    <header className="h-16 glass border-b border-white/20 flex items-center justify-end px-6">

      <div className="flex items-center gap-4">
        <Link to="/tokens">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cta/10 to-amber-500/10 border border-cta/20"
          >
            <Coins className="w-4 h-4 text-cta" />
            <span className="font-semibold text-cta">{balance.toLocaleString()}</span>
            <span className="text-xs text-cta/70">tokens</span>
          </motion.div>
        </Link>

        <button className="relative p-2 rounded-xl hover:bg-slate-100/50 transition-colors">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cta" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100/50 transition-colors"
          >
            <Avatar className="w-8 h-8 border-2 border-white shadow-sm">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 glass-card py-2 z-50"
                >
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="font-medium text-slate-900">{user?.name}</p>
                    <p className="text-sm text-slate-500 truncate">{user?.email}</p>
                  </div>

                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100/50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>

                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100/50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>

                  <div className="border-t border-slate-100 mt-2 pt-2">
                    <button
                      onClick={logout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </motion.div>

                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDropdown(false)}
                />
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
