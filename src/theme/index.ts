import { createTheme, ThemeOptions } from '@mui/material/styles'

// Professional NGO platform theme
const marketplaceTheme: ThemeOptions = {
  palette: {
    primary: {
      main: '#2563EB', // Trust blue
      light: '#3B82F6',
      dark: '#1D4ED8',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#059669', // Success green
      light: '#10B981',
      dark: '#047857',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
    grey: {
      50: '#F7F7F7',
      100: '#E8E8E8',
      200: '#D5D5D5',
      300: '#B8B8B8',
      400: '#9A9A9A',
      500: '#7A7A7A',
      600: '#5A5A5A',
      700: '#3A3A3A',
      800: '#1A1A1A',
      900: '#0A0A0A',
    },
    text: {
      primary: '#131921',
      secondary: '#37475A',
    },
    success: {
      main: '#00A651',
      light: '#4CAF50',
      dark: '#2E7D32',
    },
    warning: {
      main: '#FF9900',
      light: '#FFB84D',
      dark: '#E68900',
    },
    error: {
      main: '#D73527',
      light: '#F44336',
      dark: '#B71C1C',
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#1F2937',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#1F2937',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#1F2937',
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#1F2937',
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#1F2937',
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#1F2937',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#374151',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#6B7280',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          padding: '10px 20px',
          fontSize: '0.875rem',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
          },
        },
        contained: {
          backgroundColor: '#2563EB',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#1D4ED8',
          },
        },
        outlined: {
          borderColor: '#D1D5DB',
          color: '#374151',
          '&:hover': {
            borderColor: '#2563EB',
            backgroundColor: '#F8FAFC',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #F3F4F6',
          '&:hover': {
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
            transform: 'translateY(-2px)',
            transition: 'all 0.3s ease-in-out',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderBottom: '1px solid #E5E7EB',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: '#D1D5DB',
            },
            '&:hover fieldset': {
              borderColor: '#9CA3AF',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2563EB',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backgroundColor: '#F3F4F6',
          color: '#374151',
          border: '1px solid #E5E7EB',
        },
      },
    },
  },
}

// Create NGO theme based on custom colors
export const createNGOTheme = (customTheme?: {
  primary_color?: string
  secondary_color?: string
  logo_url?: string
}): ThemeOptions => {
  const primaryColor = customTheme?.primary_color || '#2e7d32' // Green for NGOs
  const secondaryColor = customTheme?.secondary_color || '#ff6f00' // Orange accent

  return {
    ...marketplaceTheme,
    palette: {
      ...marketplaceTheme.palette,
      primary: {
        main: primaryColor,
        light: lightenColor(primaryColor, 0.3),
        dark: darkenColor(primaryColor, 0.2),
      },
      secondary: {
        main: secondaryColor,
        light: lightenColor(secondaryColor, 0.3),
        dark: darkenColor(secondaryColor, 0.2),
      },
    },
  }
}

// Helper functions for color manipulation
const lightenColor = (color: string, amount: number): string => {
  // Simple color lightening - in production, use a proper color library
  const hex = color.replace('#', '')
  const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.round(255 * amount))
  const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.round(255 * amount))
  const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.round(255 * amount))
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

const darkenColor = (color: string, amount: number): string => {
  // Simple color darkening - in production, use a proper color library
  const hex = color.replace('#', '')
  const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.round(255 * amount))
  const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.round(255 * amount))
  const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.round(255 * amount))
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// Export default marketplace theme
export const defaultTheme = createTheme(marketplaceTheme)
export default defaultTheme
