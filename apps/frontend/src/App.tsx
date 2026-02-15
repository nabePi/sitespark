import { Routes, Route } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute, PublicRoute } from '@/components/auth/ProtectedRoute'

// Pages
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { ChatPage } from '@/pages/chat/ChatPage'
import { WebsitesListPage } from '@/pages/websites/WebsitesListPage'
import { PreviewPage } from '@/pages/websites/PreviewPage'
import { TokenWalletPage } from '@/pages/tokens/TokenWalletPage'
import { FormBuilderPage } from '@/pages/forms/FormBuilderPage'

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Landing Page */}
      <Route element={<RootLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/websites" element={<WebsitesListPage />} />
          <Route path="/websites/:id/preview" element={<PreviewPage />} />
          <Route path="/tokens" element={<TokenWalletPage />} />
          <Route path="/forms" element={<FormBuilderPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
