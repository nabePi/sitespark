import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, ArrowLeft, Check } from 'lucide-react'
import { RegisterForm } from '@/components/auth/RegisterForm'

const features = [
  'Free 100 tokens to start',
  'Create unlimited websites',
  'AI-powered design assistant',
  'Free hosting included',
]

export function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex">
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
            
            <h2 className="text-4xl font-bold text-white mb-6">
              Start building your dream website today
            </h2>
            
            <ul className="space-y-4">
              {features.map((feature, i) => (
                <motion.li
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3 text-white/90"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  {feature}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-cta/30 blur-3xl" />
      </motion.div>

      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
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
              Create your account
            </h1>
            <p className="text-slate-600">
              Join thousands of users building with AI
            </p>
          </div>

          <RegisterForm />

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
