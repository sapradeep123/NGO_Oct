import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { TenantByHostResponse, Tenant, apiClient } from '../api/client'

export type AppMode = 'MARKETPLACE' | 'MICROSITE'

interface ModeContextType {
  mode: AppMode
  tenant: Tenant | null
  theme: {
    primary_color?: string
    secondary_color?: string
    logo_url?: string
  } | null
  isLoading: boolean
  switchToMarketplace: () => void
}

const ModeContext = createContext<ModeContextType | undefined>(undefined)

interface ModeProviderProps {
  children: ReactNode
}

export const ModeProvider: React.FC<ModeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<AppMode>('MARKETPLACE')
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [theme, setTheme] = useState<ModeContextType['theme']>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const detectMode = async () => {
      try {
        // Get the current host
        const host = window.location.hostname
        
        // Call the API to determine mode
        const response: TenantByHostResponse = await apiClient.getTenantByHost(host)
        
        if (response.mode === 'MICROSITE' && response.tenant) {
          setMode('MICROSITE')
          setTenant(response.tenant)
          setTheme(response.theme || null)
        } else {
          setMode('MARKETPLACE')
          setTenant(null)
          setTheme(null)
        }
      } catch (error) {
        console.error('Failed to detect mode:', error)
        // Default to marketplace mode
        setMode('MARKETPLACE')
        setTenant(null)
        setTheme(null)
      } finally {
        setIsLoading(false)
      }
    }

    detectMode()
  }, [])

  const switchToMarketplace = () => {
    setMode('MARKETPLACE')
    setTenant(null)
    setTheme(null)
  }

  const value: ModeContextType = {
    mode,
    tenant,
    theme,
    isLoading,
    switchToMarketplace
  }

  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  )
}

export const useMode = (): ModeContextType => {
  const context = useContext(ModeContext)
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider')
  }
  return context
}
