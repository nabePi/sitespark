import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'

export function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex">
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full mx-auto"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome back
            </h1>
            <p className="text-slate-600">
              Sign in to your account to continue building
            </p>
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary/90 to-cta relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        
        <div className="absolute inset-0 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative z-10"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-8">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            
            <blockquote className="text-3xl font-bold text-white leading-tight mb-6">
              "SiteSpark helped me launch my business website in just 5 minutes. Absolutely incredible!"
            </blockquote>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur" />
              <div>
                <p className="font-semibold text-white">Sarah Johnson</p>
                <p className="text-white/70">Founder, TechStart</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-cta/30 blur-3xl" />
      </motion.div>
    </div>
  )
}
