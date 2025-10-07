import React, { useState } from 'react'
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Box,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  Rating,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material'
import { 
  VolunteerActivism, 
  AccountBalance, 
  Favorite,
  Share,
  TrendingUp,
  People,
  Security,
  Verified,
  Search,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'

const MarketplaceHome: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const [imageLoading, setImageLoading] = useState<Set<number>>(new Set())
  const navigate = useNavigate()

  const handleImageError = (causeId: number) => {
    console.log(`Image failed to load for cause ${causeId}`)
    setImageErrors(prev => new Set(prev).add(causeId))
    setImageLoading(prev => {
      const newSet = new Set(prev)
      newSet.delete(causeId)
      return newSet
    })
  }

  const handleImageLoad = (causeId: number) => {
    setImageLoading(prev => {
      const newSet = new Set(prev)
      newSet.delete(causeId)
      return newSet
    })
  }

  const handleImageStart = (causeId: number) => {
    setImageLoading(prev => new Set(prev).add(causeId))
  }

  const getImageUrl = (cause: any) => {
    if (imageErrors.has(cause.id)) {
      return `https://via.placeholder.com/400x300/f3f4f6/6b7280?text=${encodeURIComponent(cause.title)}`
    }
    
    // Try multiple fallback sources
    const fallbackUrls = [
      cause.image_url,
      `https://picsum.photos/400/300?random=${cause.id}`,
      `https://via.placeholder.com/400x300/f3f4f6/6b7280?text=${encodeURIComponent(cause.title)}`
    ]
    
    return fallbackUrls.find(url => url) || `https://via.placeholder.com/400x300/f3f4f6/6b7280?text=${encodeURIComponent(cause.title)}`
  }

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories(),
  })

  // Fetch NGOs
  const { data: ngos = [], isLoading: ngosLoading } = useQuery({
    queryKey: ['ngos'],
    queryFn: () => apiClient.getNGOs(),
  })

  // Fetch causes
  const { data: causes = [], isLoading: causesLoading } = useQuery({
    queryKey: ['causes', selectedCategory],
    queryFn: () => apiClient.getCauses({ 
      status: 'LIVE',
      ...(selectedCategory && { category: selectedCategory.toString() })
    }),
  })

  const filteredCauses = (Array.isArray(causes) ? causes : []).filter(cause => {
    if (!searchTerm) return true
    return cause.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           cause.description.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const isLoading = categoriesLoading || ngosLoading || causesLoading

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box sx={{ backgroundColor: '#FFFFFF', py: 8 }}>
        <Container maxWidth="xl">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h1" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1F2937' }}>
                Creating Positive Change Together
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, color: '#6B7280', lineHeight: 1.6 }}>
                Connect with verified NGOs and support causes that make a real difference in communities worldwide. Every donation creates lasting impact.
              </Typography>
              
              {/* Search Field */}
              <Box sx={{ mb: 4 }}>
                <TextField
                  fullWidth
                  placeholder="Search for causes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#E5E7EB',
                      },
                      '&:hover fieldset': {
                        borderColor: '#2563EB',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#2563EB',
                      },
                    },
                    '& .MuiInputBase-input': {
                      py: 2,
                      fontSize: '1rem',
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
              
              <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                <Button 
                  variant="contained" 
                  size="large"
                  sx={{ 
                    backgroundColor: '#2563EB',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    '&:hover': { backgroundColor: '#1D4ED8' }
                  }}
                  onClick={() => navigate('/causes')}
                >
                  Explore Causes
                </Button>
                <Button 
                  variant="outlined" 
                  size="large"
                  sx={{ 
                    borderColor: '#2563EB',
                    color: '#2563EB',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    '&:hover': { 
                      backgroundColor: '#F8FAFC',
                      borderColor: '#1D4ED8'
                    }
                  }}
                  onClick={() => navigate('/ngos')}
                >
                  Learn More
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Verified sx={{ color: '#059669', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">Verified NGOs</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Security sx={{ color: '#059669', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">Secure Platform</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp sx={{ color: '#059669', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">Real Impact</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                borderRadius: 3,
                p: 5,
                textAlign: 'center',
                color: 'white',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2, color: 'white' }}>
                  ₹2,50,000+
                </Typography>
                <Typography variant="h6" sx={{ mb: 4, color: 'white' }}>
                  Raised This Month
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={4}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'white' }}>150+</Typography>
                    <Typography variant="body2" sx={{ color: 'white' }}>Active Causes</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'white' }}>25+</Typography>
                    <Typography variant="body2" sx={{ color: 'white' }}>Verified NGOs</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'white' }}>500+</Typography>
                    <Typography variant="body2" sx={{ color: 'white' }}>Supporters</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Categories Section */}
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2, color: '#1F2937' }}>
            Support Causes You Care About
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Choose from various categories to find causes that align with your values and make a meaningful impact
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {(categories || []).map((category) => (
            <Grid item xs={6} sm={4} md={3} key={category.id}>
              <Card 
                sx={{ 
                  p: 3, 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  border: selectedCategory === category.id ? '2px solid #2563EB' : '1px solid #E5E7EB',
                  '&:hover': { 
                    transform: 'translateY(-4px)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    borderColor: '#2563EB'
                  }
                }}
                onClick={() => setSelectedCategory(category.id)}
              >
                <Box sx={{ 
                  width: 60, 
                  height: 60, 
                  backgroundColor: selectedCategory === category.id ? '#2563EB' : '#F3F4F6',
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  transition: 'all 0.3s'
                }}>
                  <VolunteerActivism sx={{ 
                    fontSize: 30, 
                    color: selectedCategory === category.id ? 'white' : '#6B7280'
                  }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1F2937' }}>
                  {category.name}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Featured Causes Section */}
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2, color: '#1F2937' }}>
            Featured Causes
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Discover impactful causes that are making a real difference in communities around the world
          </Typography>
        </Box>
        
        <Grid container spacing={4}>
          {filteredCauses.slice(0, 6).map((cause) => (
            <Grid item xs={12} sm={6} md={4} key={cause.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                },
                transition: 'all 0.3s'
              }}>
                <Box sx={{ position: 'relative' }}>
                  {imageLoading.has(cause.id) && (
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f3f4f6',
                      zIndex: 1
                    }}>
                      <CircularProgress size={40} />
                    </Box>
                  )}
                  <CardMedia
                    component="img"
                    height="200"
                    image={getImageUrl(cause)}
                    alt={cause.title}
                    sx={{ objectFit: 'cover' }}
                    onLoadStart={() => handleImageStart(cause.id)}
                    onLoad={() => handleImageLoad(cause.id)}
                    onError={() => handleImageError(cause.id)}
                  />
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 12, 
                    right: 12,
                    display: 'flex',
                    gap: 1
                  }}>
                    <IconButton size="small" sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                    }}>
                      <Favorite fontSize="small" />
                    </IconButton>
                    <IconButton size="small" sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                    }}>
                      <Share fontSize="small" />
                    </IconButton>
                  </Box>
                  <Chip 
                    label={cause.category_name || 'Uncategorized'}
                    size="small"
                    sx={{ 
                      position: 'absolute', 
                      bottom: 12, 
                      left: 12,
                      backgroundColor: '#2563EB',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
                
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h6" component="h2" gutterBottom sx={{ 
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    lineHeight: 1.3,
                    color: '#1F2937',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {cause.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {cause.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <AccountBalance sx={{ fontSize: 16, color: '#2563EB' }} />
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1F2937' }}>
                      {cause.ngo_name || 'Unknown NGO'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1F2937' }}>
                        ₹{(cause.current_amount || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        of ₹{(cause.target_amount || 0).toLocaleString()}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={cause.target_amount > 0 ? ((cause.current_amount || 0) / cause.target_amount) * 100 : 0}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: '#E5E7EB',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#059669'
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {cause.target_amount > 0 ? Math.round(((cause.current_amount || 0) / cause.target_amount) * 100) : 0}% funded
                    </Typography>
                  </Box>
                </CardContent>
                
                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ 
                      backgroundColor: '#059669',
                      fontWeight: 'bold',
                      py: 1.5,
                      '&:hover': { backgroundColor: '#047857' }
                    }}
                    onClick={() => navigate(`/cause/${cause.id}`)}
                  >
                    Support This Cause
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {filteredCauses.length === 0 && (
          <Alert severity="info" sx={{ mt: 4 }}>
            No causes found matching your search criteria.
          </Alert>
        )}
      </Container>

      {/* Featured NGOs Section */}
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2, color: '#1F2937' }}>
            Trusted NGO Partners
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Work with verified NGOs that have a proven track record of creating meaningful impact
          </Typography>
        </Box>
        
        <Grid container spacing={4}>
          {(ngos || []).slice(0, 6).map((ngo) => (
            <Grid item xs={12} sm={6} md={4} key={ngo.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                },
                transition: 'all 0.3s'
              }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={ngo.logo_url || '/placeholder-ngo.jpg'}
                  alt={ngo.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Verified sx={{ color: '#059669', fontSize: 20 }} />
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', color: '#1F2937' }}>
                      {ngo.name}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph sx={{ 
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {ngo.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <People sx={{ fontSize: 16, color: '#2563EB' }} />
                    <Typography variant="body2" color="text.secondary">
                      {ngo.contact_email}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Rating value={4.5} precision={0.5} size="small" readOnly />
                    <Typography variant="body2" color="text.secondary">
                      (4.5) • 120 reviews
                    </Typography>
                  </Box>
                </CardContent>
                
                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ 
                      borderColor: '#2563EB',
                      color: '#2563EB',
                      fontWeight: 'bold',
                      py: 1.5,
                      '&:hover': { 
                        backgroundColor: '#2563EB',
                        color: 'white'
                      }
                    }}
                    onClick={() => navigate(`/ngo/${ngo.slug}`)}
                  >
                    Learn More
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Trust & Impact Section */}
      <Box sx={{ backgroundColor: '#F8FAFC', py: 8 }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2, color: '#1F2937' }}>
              Why Choose Our Platform?
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              We're committed to transparency, security, and creating real impact in communities worldwide
            </Typography>
          </Box>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  backgroundColor: '#2563EB', 
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}>
                  <Security sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1F2937' }}>
                  Secure & Transparent
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  All donations are processed securely with full transparency in fund usage and impact reporting
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  backgroundColor: '#059669', 
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}>
                  <Verified sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1F2937' }}>
                  Verified NGOs
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Every NGO is thoroughly verified and regularly audited for compliance and impact effectiveness
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  backgroundColor: '#7C3AED', 
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}>
                  <TrendingUp sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1F2937' }}>
                  Real Impact
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  Track the real impact of your donations with detailed progress reports and success stories
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  )
}

export default MarketplaceHome
