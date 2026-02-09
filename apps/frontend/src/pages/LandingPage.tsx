import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Zap,
  Palette,
  Smartphone,
  ArrowRight,
  Star,
  Check,
  Globe,
  MessageSquare,
  Rocket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: Zap,
    title: 'AI Powered',
    description: 'Describe your vision and watch AI build your website in seconds',
  },
  {
    icon: Palette,
    title: 'Custom Design',
    description: 'Unique designs tailored to your brand with endless customization',
  },
  {
    icon: Smartphone,
    title: 'Mobile First',
    description: 'Every website looks stunning on every device, automatically',
  },
  {
    icon: Globe,
    title: 'Free Hosting',
    description: 'Deploy instantly with our global CDN, no extra cost',
  },
  {
    icon: MessageSquare,
    title: '24/7 Support',
    description: 'Get help anytime with our AI assistant and expert team',
  },
  {
    icon: Rocket,
    title: 'SEO Ready',
    description: 'Built-in SEO optimization for better search rankings',
  },
]

const steps = [
  {
    number: '01',
    title: 'Describe Your Vision',
    description: 'Tell our AI what kind of website you want in plain language',
  },
  {
    number: '02',
    title: 'AI Builds It',
    description: 'Our AI generates a complete, professional website in minutes',
  },
  {
    number: '03',
    title: 'Launch & Grow',
    description: 'Publish instantly and scale as your business grows',
  },
]

const testimonials = [
  {
    name: 'Dian Sastro',
    role: 'CEO, Startup Indonesia',
    content: 'SiteSpark helped us launch our company website in under an hour. The AI understood exactly what we needed.',
    avatar: 'DS',
  },
  {
    name: 'Budi Santoso',
    role: 'Freelance Designer',
    content: 'I use SiteSpark for all my client projects now. It saves me weeks of development time.',
    avatar: 'BS',
  },
  {
    name: 'Anisa Rahma',
    role: 'Restaurant Owner',
    content: 'My restaurant website looks amazing and I got my first online reservation within hours!',
    avatar: 'AR',
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-cta flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">SiteSpark</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900">How It Works</a>
            <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-slate-900">Testimonials</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-slate-900">
              Sign In
            </Link>
            <Link to="/register">
              <Button className="bg-primary hover:bg-primary/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Website Builder
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 leading-tight">
              Website Jadi
              <br />
              <span className="gradient-text">1 Menit</span>
            </h1>

            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
              Buat website profesional dengan AI. Cukup ceritakan apa yang Anda butuhkan, 
              biarkan AI kami yang bekerja.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-cta hover:bg-cta/90 text-lg px-8 h-14">
                  Mulai Gratis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 h-14">
                Lihat Demo
              </Button>
            </div>

            <div className="mt-12 flex items-center justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Free 100 tokens
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                No credit card
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Cancel anytime
              </span>
            </div>
          </motion.div>

          {/* Hero Image / Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-cta/20 rounded-3xl blur-2xl" />
              <div className="relative glass-card p-2">
                <div className="bg-slate-900 rounded-xl overflow-hidden aspect-[16/10]">
                  <div className="h-8 bg-slate-800 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="p-8 flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-cta flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-white/80 text-lg">AI is building your website...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Powerful features to help you build, launch, and grow your online presence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-6 hover:shadow-2xl transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Three simple steps to your dream website
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-cta/20 flex items-center justify-center">
                  <span className="text-3xl font-bold gradient-text">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Loved by Thousands
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              See what our users are saying about SiteSpark
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-cta text-cta" />
                  ))}
                </div>
                
                <p className="text-slate-700 mb-6">"{testimonial.content}"</p>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-cta flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="glass-card p-12 text-center relative overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cta/20 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Ready to Build Your Website?
              </h2>
              
              <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto">
                Join 10,000+ users who are already building with AI. 
                Start free today.
              </p>
              
              <Link to="/register">
                <Button size="lg" className="bg-cta hover:bg-cta/90 text-lg px-10 h-14">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cta flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">SiteSpark</span>
            </div>

            <p className="text-sm text-slate-500">
              © 2024 SiteSpark. All rights reserved.
            </p>

            <div className="flex items-center gap-6">
              <Link to="/terms" className="text-sm text-slate-500 hover:text-slate-700">Terms</Link>
              <Link to="/privacy" className="text-sm text-slate-500 hover:text-slate-700">Privacy</Link>
              <Link to="/contact" className="text-sm text-slate-500 hover:text-slate-700">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
