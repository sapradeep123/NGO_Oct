import React, { useState, useEffect } from 'react'
import {
  Container,
  Paper,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
} from '@mui/material'
import { Person, AdminPanelSettings, Store, VolunteerActivism } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { apiClient, DemoUser } from '../api/client'

const DemoLogin: React.FC = () => {
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loggingIn, setLoggingIn] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDemoUsers = async () => {
      try {
        const response = await apiClient.getDemoUsers()
        setDemoUsers(response.users)
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Demo endpoint not available in production, show static credentials
          setDemoUsers([
            {
              email: 'admin@example.com',
              password: 'Admin@123',
              role: 'PLATFORM_ADMIN',
              tenant: undefined
            },
            {
              email: 'ngo.hope.admin@example.com',
              password: 'Ngo@123',
              role: 'NGO_ADMIN',
              tenant: 'hope-trust'
            },
            {
              email: 'ngo.hope.staff@example.com',
              password: 'Staff@123',
              role: 'NGO_STAFF',
              tenant: 'hope-trust'
            },
            {
              email: 'vendor.alpha@example.com',
              password: 'Vendor@123',
              role: 'VENDOR',
              tenant: 'hope-trust'
            },
            {
              email: 'donor.arya@example.com',
              password: 'Donor@123',
              role: 'DONOR',
              tenant: undefined
            }
          ])
        } else {
          setError('Failed to load demo users')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDemoUsers()
  }, [])

  const handleDemoLogin = async (user: DemoUser) => {
    setLoggingIn(user.email)
    setError('')

    try {
      const loggedInUser = await login({ username: user.email, password: user.password })
      // Redirect based on user role
      if (loggedInUser?.role === 'PLATFORM_ADMIN') {
        navigate('/admin-console')
      } else if (loggedInUser?.role === 'NGO_ADMIN' || loggedInUser?.role === 'NGO_STAFF') {
        navigate('/ngo-dashboard')
      } else if (loggedInUser?.role === 'VENDOR') {
        navigate('/vendor-portal')
      } else if (loggedInUser?.role === 'DONOR') {
        navigate('/donor-dashboard')
      } else {
        navigate('/')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoggingIn(null)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'PLATFORM_ADMIN':
        return <AdminPanelSettings />
      case 'NGO_ADMIN':
      case 'NGO_STAFF':
        return <VolunteerActivism />
      case 'VENDOR':
        return <Store />
      case 'DONOR':
        return <Person />
      default:
        return <Person />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'PLATFORM_ADMIN':
        return 'error'
      case 'NGO_ADMIN':
        return 'primary'
      case 'NGO_STAFF':
        return 'info'
      case 'VENDOR':
        return 'warning'
      case 'DONOR':
        return 'success'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ marginTop: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Demo Login
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" paragraph>
          Choose a demo account to login with different roles and permissions
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {demoUsers.map((user) => (
            <Grid item xs={12} sm={6} md={4} key={user.email}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    {getRoleIcon(user.role)}
                    <Typography variant="h6" component="div">
                      {user.role.replace('_', ' ')}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {user.email}
                  </Typography>
                  
                  {user.tenant && (
                    <Chip 
                      label={`Tenant: ${user.tenant}`} 
                      size="small" 
                      color="secondary"
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
                
                <CardActions>
                  <Button
                    size="small"
                    variant="contained"
                    fullWidth
                    onClick={() => handleDemoLogin(user)}
                    disabled={loggingIn === user.email}
                  >
                    {loggingIn === user.email ? (
                      <CircularProgress size={20} />
                    ) : (
                      'Login as ' + user.role.split('_')[0]
                    )}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box textAlign="center" mt={4}>
          <Button variant="outlined" onClick={() => navigate('/login')}>
            Back to Regular Login
          </Button>
        </Box>
      </Box>
    </Container>
  )
}

export default DemoLogin
