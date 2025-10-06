import React, { useState } from 'react'
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  AppBar,
  Toolbar,
  Avatar,
  CssBaseline,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { 
  Search, 
  AccountBalance, 
  Email, 
  Phone, 
  Language, 
  VolunteerActivism,
  AttachMoney,
  TrendingUp,
  People
} from '@mui/icons-material'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'

const NgoMicrosite: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [donationOpen, setDonationOpen] = useState(false)
  const [selectedCause, setSelectedCause] = useState<any>(null)
  const [donationData, setDonationData] = useState({
    donor_name: '',
    donor_email: '',
    amount: '',
    payment_method: 'card'
  })

  // Fetch NGO details
  const { data: ngo, isLoading: ngoLoading, error: ngoError } = useQuery({
    queryKey: ['ngo-microsite', slug],
    queryFn: () => apiClient.getTenantBySlug(slug!),
    enabled: !!slug,
  })

  // Fetch NGO's causes only
  const { data: causes = [], isLoading: causesLoading, error: causesError } = useQuery({
    queryKey: ['ngo-microsite-causes', slug, selectedCategory, searchQuery],
    queryFn: () => apiClient.getCauses({ 
      tenant: slug,
      status: 'LIVE',
      ...(selectedCategory && { category: selectedCategory.toString() }),
      ...(searchQuery && { search: searchQuery })
    }),
    enabled: !!slug,
  })

  // Fetch categories for filtering
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories(),
  })

  const isLoading = ngoLoading || causesLoading

  // Debug logging
  console.log('Microsite Debug:', {
    slug,
    ngo,
    ngoLoading,
    ngoError,
    causes,
    causesLoading,
    causesError,
    categories
  })

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (ngoError) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">
          Error loading NGO: {ngoError.message}
        </Alert>
      </Container>
    )
  }

  if (!ngo) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">
          NGO not found
        </Alert>
      </Container>
    )
  }

  // Calculate progress for causes
  const getProgressPercentage = (cause: any) => {
    if (!cause.target_amount || cause.target_amount === 0) return 0
    return Math.min((cause.current_amount || 0) / cause.target_amount * 100, 100)
  }

  const handleDonateClick = (cause: any) => {
    setSelectedCause(cause)
    setDonationData({
      donor_name: '',
      donor_email: '',
      amount: '',
      payment_method: 'card'
    })
    setDonationOpen(true)
  }

  const handleDonationSubmit = async () => {
    if (!donationData.donor_name || !donationData.donor_email || !donationData.amount) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const donationPayload = {
        cause_id: selectedCause.id,
        donor_name: donationData.donor_name,
        donor_email: donationData.donor_email,
        amount: parseFloat(donationData.amount),
        payment_method: donationData.payment_method
      }

      const response = await apiClient.createDonation(donationPayload)
      
      if (response.success) {
        alert(`Donation successful! Transaction ID: ${response.transaction_id}`)
        setDonationOpen(false)
        // Refresh causes data
        window.location.reload()
      }
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Donation failed. Please try again.')
    }
  }

  return (
    <>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        {/* Clean Header - No Platform Navigation */}
      <AppBar position="static" sx={{ backgroundColor: '#ffffff', boxShadow: 'none', borderBottom: '1px solid #e5e7eb' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Avatar
              src={ngo.logo_url}
              sx={{ width: 40, height: 40, mr: 2 }}
            />
            <Box>
              <Typography variant="h6" sx={{ color: '#2d3748', fontWeight: 'bold' }}>
                {ngo.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#718096' }}>
                Making a Difference Together
              </Typography>
            </Box>
          </Box>
          
          {/* Clean Search Bar */}
          <Box sx={{ maxWidth: 400, flexGrow: 1, mx: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search our causes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#f9fafb',
                  '& fieldset': { borderColor: '#e5e7eb' },
                  '&:hover fieldset': { borderColor: '#d1d5db' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#6b7280' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Contact Links */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              color="inherit" 
              sx={{ color: '#4a5568', fontWeight: '500' }}
              onClick={() => {
                const aboutSection = document.getElementById('about-section')
                aboutSection?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              About Us
            </Button>
            <Button 
              color="inherit" 
              sx={{ color: '#4a5568', fontWeight: '500' }}
              onClick={() => {
                const contactSection = document.getElementById('contact-section')
                contactSection?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Contact
            </Button>
            <Button 
              color="inherit" 
              sx={{ color: '#4a5568', fontWeight: '500' }}
              onClick={() => {
                const gallerySection = document.getElementById('gallery-section')
                gallerySection?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Gallery
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box sx={{ backgroundColor: '#ffffff', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h2" component="h1" gutterBottom sx={{ 
                fontWeight: 'bold', 
                color: '#2d3748',
                fontSize: { xs: '2rem', md: '3rem' }
              }}>
                Creating Positive Change Together
              </Typography>
              <Typography variant="h6" paragraph sx={{ mb: 4, color: '#4a5568', fontSize: '1.1rem' }}>
                Connect with {ngo.name} and support causes that make a real difference in communities worldwide. Every donation creates lasting impact.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{ 
                    backgroundColor: '#3b82f6',
                    '&:hover': { backgroundColor: '#2563eb' },
                    px: 4,
                    py: 1.5
                  }}
                  onClick={() => {
                    const causesSection = document.getElementById('causes-section')
                    causesSection?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Explore Our Causes
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{ 
                    borderColor: '#3b82f6',
                    color: '#3b82f6',
                    px: 4,
                    py: 1.5
                  }}
                  onClick={() => {
                    const aboutSection = document.getElementById('about-section')
                    aboutSection?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Learn More
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ backgroundColor: '#3b82f6', color: 'white' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Our Impact This Month
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AttachMoney sx={{ mr: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        ₹{((ngo as any).total_donations || 0).toLocaleString()}+
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 3 }}>
                      Raised This Month
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <VolunteerActivism sx={{ mr: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {causes.length}+
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 3 }}>
                      Active Causes
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <People sx={{ mr: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {((ngo as any).total_donations || 0) / 1000}+
                    </Typography>
                    </Box>
                    <Typography variant="body2">
                      Supporters
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 6, backgroundColor: '#f8fafc' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#2d3748' }}>
              Why Choose {ngo.name}?
            </Typography>
            <Typography variant="body1" sx={{ color: '#4a5568', fontSize: '1.1rem' }}>
              We ensure every donation makes a real difference
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 3 }}>
                <CardContent>
                  <Box sx={{ color: '#10b981', mb: 2 }}>
                    <AccountBalance sx={{ fontSize: 48 }} />
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Verified NGO
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {ngo.name} is a verified, registered NGO with transparent operations and proven impact.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 3 }}>
                <CardContent>
                  <Box sx={{ color: '#3b82f6', mb: 2 }}>
                    <TrendingUp sx={{ fontSize: 48 }} />
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Real Impact
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Track the real impact of your donations with detailed reports and success stories.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 3 }}>
                <CardContent>
                  <Box sx={{ color: '#f59e0b', mb: 2 }}>
                    <VolunteerActivism sx={{ fontSize: 48 }} />
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Secure Donations
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your donations are processed securely with full transparency and accountability.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Causes Section */}
      <Box id="causes-section" sx={{ py: 6, backgroundColor: '#ffffff' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#2d3748' }}>
              Our Featured Causes
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Support causes that matter to {ngo.name}
            </Typography>
          </Box>

          {/* Category Filter */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Chip
              label="All Causes"
              onClick={() => setSelectedCategory(null)}
              color={selectedCategory === null ? 'primary' : 'default'}
              sx={{ mr: 1 }}
            />
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                onClick={() => setSelectedCategory(category.id)}
                color={selectedCategory === category.id ? 'primary' : 'default'}
                sx={{ mr: 1 }}
              />
            ))}
          </Box>

          {/* Causes Grid */}
          <Grid container spacing={3}>
            {causes.map((cause) => (
              <Grid item xs={12} md={6} lg={4} key={cause.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box
                    component="img"
                    src={cause.image_url || '/placeholder-cause.jpg'}
                    alt={cause.title}
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {cause.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph sx={{ flexGrow: 1 }}>
                      {cause.description}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        label={cause.category?.name || 'General'} 
                        size="small" 
                        sx={{ mb: 1 }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          Raised: ₹{(cause.current_amount || 0).toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                          Target: ₹{(cause.target_amount || 0).toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: 1, height: 8 }}>
                        <Box
                          sx={{
                            width: `${getProgressPercentage(cause)}%`,
                            backgroundColor: '#3b82f6',
                            height: '100%',
                            borderRadius: 1,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {getProgressPercentage(cause).toFixed(1)}% funded
                      </Typography>
                    </Box>
                    
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ 
                        backgroundColor: '#3b82f6',
                        '&:hover': { backgroundColor: '#2563eb' }
                      }}
                      onClick={() => handleDonateClick(cause)}
                    >
                      Donate Now
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {causes.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No causes found matching your criteria
              </Typography>
            </Box>
          )}
        </Container>
      </Box>

      {/* About Section */}
      <Box id="about-section" sx={{ py: 6, backgroundColor: '#f8fafc' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#2d3748' }}>
                About {ngo.name}
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: '#4a5568', fontSize: '1.1rem', lineHeight: 1.6 }}>
                {ngo.description}
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Email sx={{ mr: 2, color: '#6b7280' }} />
                  <Typography variant="body1" sx={{ color: '#4a5568' }}>{ngo.contact_email}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Phone sx={{ mr: 2, color: '#6b7280' }} />
                  <Typography variant="body1" sx={{ color: '#4a5568' }}>{(ngo as any).phone}</Typography>
                </Box>
                {ngo.website_url && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Language sx={{ mr: 2, color: '#6b7280' }} />
                    <Typography variant="body1">{ngo.website_url}</Typography>
                  </Box>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src={ngo.logo_url || '/placeholder-ngo.jpg'}
                alt={ngo.name}
                sx={{
                  width: '100%',
                  height: 300,
                  objectFit: 'cover',
                  borderRadius: 2,
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Gallery Section */}
      <Box id="gallery-section" sx={{ py: 6, backgroundColor: '#ffffff' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#2d3748', textAlign: 'center', mb: 4 }}>
            Photo Gallery
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
            See the impact of our work through these photos
          </Typography>
          
          <Grid container spacing={3}>
            {((ngo as any)?.photo_gallery || [
              "https://picsum.photos/400/300?random=11",
              "https://picsum.photos/400/300?random=12", 
              "https://picsum.photos/400/300?random=13",
              "https://picsum.photos/400/300?random=14",
              "https://picsum.photos/400/300?random=15",
              "https://picsum.photos/400/300?random=16"
            ]).map((photo: string, index: number) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: '100%' }}>
                  <Box
                    component="img"
                    src={photo}
                    alt={`Gallery ${index + 1}`}
                    sx={{
                      width: '100%',
                      height: 250,
                      objectFit: 'cover',
                    }}
                  />
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Impact Photo {index + 1}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Making a difference in communities worldwide
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Contact Section */}
      <Box id="contact-section" sx={{ py: 6, backgroundColor: '#f8fafc' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#2d3748', textAlign: 'center', mb: 4 }}>
            Get In Touch
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
            Ready to make a difference? Contact us to learn more about our causes and how you can help.
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#2d3748' }}>
                  Contact Information
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Email sx={{ mr: 2, color: '#3b82f6' }} />
                    <Typography variant="body1">{ngo.contact_email}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Phone sx={{ mr: 2, color: '#3b82f6' }} />
                    <Typography variant="body1">{(ngo as any).phone || '+91-9876543210'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AccountBalance sx={{ mr: 2, color: '#3b82f6' }} />
                    <Typography variant="body1">{ngo.address}</Typography>
                  </Box>
                  {ngo.website_url && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Language sx={{ mr: 2, color: '#3b82f6' }} />
                      <Typography variant="body1">{ngo.website_url}</Typography>
                    </Box>
                  )}
                </Box>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#2d3748' }}>
                  Office Hours
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {(ngo as any).office_hours || 'Monday - Friday: 9:00 AM - 6:00 PM'}
                </Typography>
                
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#2d3748', mt: 3 }}>
                  Departments
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {((ngo as any)?.departments || [
                    {name: 'General Inquiries', email: ngo.contact_email, phone: (ngo as any).phone || '+91-9876543210'},
                    {name: 'Donations', email: `donations@${ngo.slug}.org`, phone: (ngo as any).phone || '+91-9876543210'},
                    {name: 'Volunteer', email: `volunteer@${ngo.slug}.org`, phone: (ngo as any).phone || '+91-9876543210'}
                  ]).map((dept: {name: string, email: string, phone: string}, index: number) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {dept.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {dept.email} | {dept.phone}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ backgroundColor: '#2d3748', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  src={ngo.logo_url}
                  sx={{ width: 40, height: 40, mr: 2 }}
                />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
                  {ngo.name}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                Making a difference in communities worldwide through verified, transparent operations.
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'white' }}>
                Contact Information
              </Typography>
              <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                {ngo.address}
              </Typography>
              <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                {ngo.contact_email}
              </Typography>
              <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                {(ngo as any).phone || '+91-9876543210'}
              </Typography>
            </Grid>
          </Grid>
          
          <Box sx={{ borderTop: '1px solid #374151', mt: 4, pt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#d1d5db' }}>
              © 2024 {ngo.name}. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
      </Box>

      {/* Donation Dialog */}
      <Dialog open={donationOpen} onClose={() => setDonationOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Make a Donation</DialogTitle>
        <DialogContent>
          {selectedCause && (
            <>
              <Typography variant="h6" gutterBottom>
                {selectedCause.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {selectedCause.description}
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Target: ₹{selectedCause.target_amount?.toLocaleString()}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Raised: ₹{(selectedCause.current_amount || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Progress: {getProgressPercentage(selectedCause).toFixed(1)}%
                </Typography>
              </Box>
            </>
          )}
          
          <TextField
            label="Your Name"
            fullWidth
            margin="normal"
            value={donationData.donor_name}
            onChange={(e) => setDonationData({ ...donationData, donor_name: e.target.value })}
            required
          />
          <TextField
            label="Email Address"
            fullWidth
            margin="normal"
            type="email"
            value={donationData.donor_email}
            onChange={(e) => setDonationData({ ...donationData, donor_email: e.target.value })}
            required
          />
          <TextField
            label="Donation Amount (₹)"
            fullWidth
            margin="normal"
            type="number"
            value={donationData.amount}
            onChange={(e) => setDonationData({ ...donationData, amount: e.target.value })}
            required
            inputProps={{ min: 1 }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={donationData.payment_method}
              onChange={(e: any) => setDonationData({ ...donationData, payment_method: e.target.value })}
              label="Payment Method"
            >
              <MenuItem value="card">Credit/Debit Card</MenuItem>
              <MenuItem value="upi">UPI</MenuItem>
              <MenuItem value="netbanking">Net Banking</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDonationOpen(false)}>Cancel</Button>
          <Button onClick={handleDonationSubmit} variant="contained" color="primary">
            Donate Now
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default NgoMicrosite
