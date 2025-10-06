import React, { useState, ReactNode } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment,
  Badge,
  Container,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Home,
  Dashboard,
  Store,
  AdminPanelSettings,
  Person,
  ExitToApp,
  AccountBalance,
  VolunteerActivism,
  Search,
  Favorite,
  Verified,
  Security,
  TrendingUp,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useMode } from '../contexts/ModeContext'

interface AppShellProps {
  children: ReactNode
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, hasRole } = useAuth()
  const { mode, tenant, switchToMarketplace } = useMode()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen)
  }

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    handleProfileMenuClose()
  }

  const getNavigationItems = () => {
    const items = []

    if (mode === 'MICROSITE' && tenant) {
      // Microsite navigation
      items.push(
        { label: 'Home', icon: <Home />, path: '/' },
        { label: 'Our Causes', icon: <VolunteerActivism />, path: '/ngo/' + tenant.slug },
        { label: 'Contact Us', icon: <Person />, path: '/contact' }
      )
    } else {
      // Marketplace navigation
      items.push(
        { label: 'Home', icon: <Home />, path: '/' },
        { label: 'NGOs', icon: <AccountBalance />, path: '/ngos' }
      )

      if (user) {
        if (hasRole('DONOR')) {
          items.push({ label: 'My Dashboard', icon: <Dashboard />, path: '/donor-dashboard' })
        }
        if (hasRole('NGO_ADMIN') || hasRole('NGO_STAFF')) {
          items.push({ label: 'NGO Dashboard', icon: <Dashboard />, path: '/ngo-dashboard' })
        }
        if (hasRole('VENDOR')) {
          items.push({ label: 'Vendor Portal', icon: <Store />, path: '/vendor-portal' })
        }
        if (hasRole('PLATFORM_ADMIN')) {
          items.push({ label: 'Admin Console', icon: <AdminPanelSettings />, path: '/admin-console' })
        }
      }
    }

    return items
  }

  const navigationItems = getNavigationItems()

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          {mode === 'MICROSITE' && tenant ? tenant.name : 'NGO Platform'}
        </Typography>
      </Toolbar>
      <List>
        {navigationItems.map((item) => (
          <ListItem
            button
            key={item.path}
            onClick={() => {
              navigate(item.path)
              if (isMobile) setDrawerOpen(false)
            }}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
        {mode === 'MICROSITE' && (
          <ListItem button onClick={switchToMarketplace}>
            <ListItemIcon><Home /></ListItemIcon>
            <ListItemText primary="Back to Marketplace" />
          </ListItem>
        )}
      </List>
    </Box>
  )

  // Professional NGO platform header for marketplace mode
  if (mode === 'MARKETPLACE') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Trust Bar */}
        <Box sx={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E5E7EB', py: 1 }}>
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Verified sx={{ fontSize: 16, color: '#059669' }} />
                  <Typography variant="body2" color="text.secondary">Verified NGOs</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Security sx={{ fontSize: 16, color: '#059669' }} />
                  <Typography variant="body2" color="text.secondary">Secure Donations</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp sx={{ fontSize: 16, color: '#059669' }} />
                  <Typography variant="body2" color="text.secondary">Real Impact</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Typography variant="body2" color="text.secondary">About Us</Typography>
                <Typography variant="body2" color="text.secondary">Contact</Typography>
                <Typography variant="body2" color="text.secondary">Help Center</Typography>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Main Header */}
        <AppBar position="static" sx={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Container maxWidth="xl">
            <Toolbar sx={{ py: 2 }}>
              {/* Logo */}
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
                <Box sx={{ 
                  width: 40, 
                  height: 40, 
                  backgroundColor: '#2563EB', 
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2
                }}>
                  <VolunteerActivism sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h5" 
                    component="div" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: '#1F2937',
                      cursor: 'pointer',
                      lineHeight: 1
                    }}
                    onClick={() => navigate('/')}
                  >
                    NGO Platform
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Making a Difference Together
                  </Typography>
                </Box>
              </Box>

              {/* Navigation */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mr: 4 }}>
                <Button 
                  color="inherit" 
                  sx={{ color: '#374151', fontWeight: 500 }}
                  onClick={() => navigate('/causes')}
                >
                  Causes
                </Button>
                <Button 
                  color="inherit" 
                  sx={{ color: '#374151', fontWeight: 500 }}
                  onClick={() => navigate('/ngos')}
                >
                  NGOs
                </Button>
                <Button 
                  color="inherit" 
                  sx={{ color: '#374151', fontWeight: 500 }}
                  onClick={() => navigate('/categories')}
                >
                  Categories
                </Button>
              </Box>

              {/* Search Bar */}
              <Box sx={{ flexGrow: 1, maxWidth: 500 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search causes, NGOs, or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#F9FAFB',
                      '& fieldset': { 
                        borderColor: '#E5E7EB',
                      },
                      '&:hover fieldset': { 
                        borderColor: '#D1D5DB',
                      },
                      '&.Mui-focused fieldset': { 
                        borderColor: '#2563EB',
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: '#6B7280' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Right Side Actions */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 3 }}>
                {user ? (
                  <>
                    <IconButton sx={{ color: '#6B7280' }}>
                      <Badge badgeContent={0} color="error">
                        <Favorite />
                      </Badge>
                    </IconButton>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="large"
                        edge="end"
                        aria-label="account of current user"
                        aria-controls="profile-menu"
                        aria-haspopup="true"
                        onClick={handleProfileMenuOpen}
                        sx={{ p: 0 }}
                      >
                        <Avatar sx={{ width: 36, height: 36, backgroundColor: '#2563EB' }}>
                          {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                        </Avatar>
                      </IconButton>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#1F2937' }}>
                          {user.first_name} {user.last_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.role?.replace('_', ' ')}
                        </Typography>
                      </Box>
                    </Box>
                    <Menu
                      id="profile-menu"
                      anchorEl={anchorEl}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                      keepMounted
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      open={Boolean(anchorEl)}
                      onClose={handleProfileMenuClose}
                    >
                      <MenuItem onClick={handleLogout}>
                        <ListItemIcon>
                          <ExitToApp fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Logout</ListItemText>
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      onClick={() => navigate('/login')}
                      sx={{ 
                        color: '#374151',
                        borderColor: '#D1D5DB',
                        '&:hover': { 
                          borderColor: '#2563EB',
                          backgroundColor: '#F8FAFC'
                        }
                      }}
                    >
                      Sign In
                    </Button>
                    <Button 
                      variant="contained" 
                      onClick={() => navigate('/register')}
                      sx={{ 
                        backgroundColor: '#2563EB',
                        '&:hover': { backgroundColor: '#1D4ED8' }
                      }}
                    >
                      Get Started
                    </Button>
                  </Box>
                )}
              </Box>
            </Toolbar>
          </Container>
        </AppBar>

        {/* Main Content */}
        <Box component="main" sx={{ flexGrow: 1, backgroundColor: '#F9FAFB' }}>
          {children}
        </Box>

        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          sx={{
            '& .MuiDrawer-paper': {
              width: 280,
              backgroundColor: '#FFFFFF',
            },
          }}
        >
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#1F2937' }}>
              Navigation
            </Typography>
            <List>
              {navigationItems.map((item) => (
                <ListItem
                  key={item.path}
                  onClick={() => {
                    navigate(item.path)
                    setDrawerOpen(false)
                  }}
                  sx={{ 
                    borderRadius: 2,
                    mb: 0.5,
                    '&:hover': { backgroundColor: '#F3F4F6' }
                  }}
                >
                  <ListItemIcon sx={{ color: '#6B7280' }}>{item.icon}</ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ color: '#374151', fontWeight: 500 }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
      </Box>
    )
  }

  // Simple header for microsite mode
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {tenant?.name || 'NGO Platform'}
          </Typography>
          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">
                {user.first_name} {user.last_name}
              </Typography>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="profile-menu"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                </Avatar>
              </IconButton>
              <Menu
                id="profile-menu"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
              >
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <ExitToApp fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: 250,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 250,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerOpen ? 250 : 0}px)` },
          ml: { sm: drawerOpen ? '250px' : 0 },
          mt: '64px',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export default AppShell
