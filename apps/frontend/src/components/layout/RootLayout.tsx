import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'

export function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen"
      >
        <Outlet />
      </motion.main>
    </div>
  )
}
