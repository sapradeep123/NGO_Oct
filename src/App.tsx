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

// Default Route Component - redirects authenticated users to their dashboard
const DefaultRoute: React.FC = () => {
  const { isAuthenticated, user } = useAuth()
  
  // Debug logging
  console.log('DefaultRoute - isAuthenticated:', isAuthenticated, 'user:', user)
  
  if (!isAuthenticated) {
    return <MarketplaceHome />
  }
  
  // Redirect authenticated users to their appropriate dashboard
  // Donors can access the marketplace and use Dashboard button to go to their dashboard
  if (user?.role === 'PLATFORM_ADMIN') {
    console.log('Redirecting to admin-console')
    return <Navigate to="/admin-console" replace />
  } else if (user?.role === 'NGO_ADMIN' || user?.role === 'NGO_STAFF') {
    console.log('Redirecting to ngo-dashboard')
    return <Navigate to="/ngo-dashboard" replace />
  } else if (user?.role === 'VENDOR') {
    console.log('Redirecting to vendor-portal')
    return <Navigate to="/vendor-portal" replace />
  } else {
    // For donors and other users, show the marketplace
    console.log('Showing marketplace for user role:', user?.role)
    return <MarketplaceHome />
  }
}

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRoles?: string[] }> = ({ 
  children, 
  requiredRoles = [] 
}) => {
  const { isAuthenticated, hasRole, user } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role))
    if (!hasRequiredRole) {
      // Redirect to appropriate dashboard based on user role
      if (user?.role === 'PLATFORM_ADMIN') {
        return <Navigate to="/admin-console" replace />
      } else if (user?.role === 'NGO_ADMIN' || user?.role === 'NGO_STAFF') {
        return <Navigate to="/ngo-dashboard" replace />
      } else if (user?.role === 'VENDOR') {
        return <Navigate to="/vendor-portal" replace />
      } else if (user?.role === 'DONOR') {
        return <Navigate to="/donor-dashboard" replace />
      } else {
        return <Navigate to="/" replace />
      }
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
                
                {/* Default route - redirect authenticated users to their dashboard */}
                <Route path="/" element={<DefaultRoute />} />
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
