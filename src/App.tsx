import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AuthProvider } from './auth/AuthContext'
import { ModeProvider } from './contexts/ModeContext'
import { useMode } from './contexts/ModeContext'
import { useAuth } from './auth/AuthContext'
import { createNGOTheme, defaultTheme } from './theme'

// Pages
import MarketplaceHome from './pages/MarketplaceHome'
import NgoPage from './pages/NgoPage'
import NgoMicrosite from './pages/NgoMicrosite'
import CauseDetail from './pages/CauseDetail'
import DonorDashboard from './pages/DonorDashboard'
import NgoDashboard from './pages/NgoDashboard'
import VendorPortal from './pages/VendorPortal'
import AdminConsole from './pages/AdminConsole'
import DemoLogin from './pages/DemoLogin'
import Login from './pages/Login'

// Components
import AppShell from './components/AppShell'
import LoadingSpinner from './components/LoadingSpinner'

// Create a client
const queryClient = new QueryClient()

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRoles?: string[] }> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { isAuthenticated, hasRole } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role))
    if (!hasRequiredRole) {
      return <Navigate to="/" replace />
    }
  }
  
  return <>{children}</>
}

// Main App Content
const AppContent: React.FC = () => {
  const { mode, theme, isLoading } = useMode()
  const { isLoading: authLoading } = useAuth()

  if (isLoading || authLoading) {
    return <LoadingSpinner />
  }

  // Choose theme based on mode
  const currentTheme = mode === 'MICROSITE' && theme 
    ? createNGOTheme(theme as any) 
    : defaultTheme

  return (
    <ThemeProvider theme={currentTheme as any}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Independent microsite route - no AppShell */}
          <Route path="/microsite/:slug" element={<NgoMicrosite />} />
          
          {/* All other routes with AppShell */}
          <Route path="/*" element={
            <AppShell>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/demo-login" element={<DemoLogin />} />
                
                {/* Marketplace routes */}
                <Route path="/" element={<MarketplaceHome />} />
                <Route path="/ngo/:slug" element={<NgoPage />} />
                <Route path="/cause/:id" element={<CauseDetail />} />
            
            {/* Protected routes */}
            <Route 
              path="/donor-dashboard" 
              element={
                <ProtectedRoute requiredRoles={['DONOR']}>
                  <DonorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ngo-dashboard" 
              element={
                <ProtectedRoute requiredRoles={['NGO_ADMIN', 'NGO_STAFF']}>
                  <NgoDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/vendor-portal" 
              element={
                <ProtectedRoute requiredRoles={['VENDOR']}>
                  <VendorPortal />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-console" 
              element={
                <ProtectedRoute requiredRoles={['PLATFORM_ADMIN']}>
                  <AdminConsole />
                </ProtectedRoute>
              } 
            />
            
                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

// Main App Component
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ModeProvider>
          <AppContent />
        </ModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
