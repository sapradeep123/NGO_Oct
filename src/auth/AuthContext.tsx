import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, LoginRequest, apiClient } from '../api/client'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<User>
  logout: () => void
  hasRole: (role: string, tenantId?: number) => boolean
  getUserMembership: (tenantId: number) => any
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userMemberships, setUserMemberships] = useState<any[]>([])

  const isAuthenticated = !!user

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const userData = await apiClient.getCurrentUser()
          setUser(userData)
          // TODO: Fetch user memberships when API endpoint is available
        } catch (error) {
          console.error('Failed to get current user:', error)
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials: LoginRequest): Promise<User> => {
    try {
      const response = await apiClient.login(credentials)
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('refresh_token', response.refresh_token)
      
      const userData = await apiClient.getCurrentUser()
      setUser(userData)
      return userData
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    setUserMemberships([])
  }

  const hasRole = (role: string, _tenantId?: number): boolean => {
    if (!user) return false
    
    // Debug logging
    console.log('Checking role:', role, 'User role:', user.role, 'Match:', user.role === role)
    
    // Use the role field from user data instead of email parsing
    return user.role === role
  }

  const getUserMembership = (tenantId: number) => {
    // TODO: Implement when API endpoint is available
    return userMemberships.find(m => m.tenant_id === tenantId)
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    hasRole,
    getUserMembership
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
