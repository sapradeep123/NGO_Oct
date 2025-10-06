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
} from '@mui/material'
import { AccountBalance, Email, Phone, Language, VolunteerActivism } from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'

const NgoPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  // Fetch NGO details
  const { data: ngo, isLoading: ngoLoading } = useQuery({
    queryKey: ['ngo', slug],
    queryFn: () => apiClient.getTenantBySlug(slug!),
    enabled: !!slug,
  })

  // Fetch NGO's causes
  const { data: causes = [], isLoading: causesLoading } = useQuery({
    queryKey: ['ngo-causes', slug, selectedCategory],
    queryFn: () => apiClient.getCauses({ 
      tenant: slug,
      status: 'LIVE',
      ...(selectedCategory && { category: selectedCategory.toString() })
    }),
    enabled: !!slug,
  })

  // Fetch categories for filtering
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories(),
  })

  const isLoading = ngoLoading || causesLoading

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* NGO Header */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    component="img"
                    src={ngo.logo_url || '/placeholder-ngo.jpg'}
                    alt={ngo.name}
                    sx={{
                      width: 150,
                      height: 150,
                      objectFit: 'contain',
                      borderRadius: 2,
                      border: '1px solid #e0e0e0',
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={9}>
                <Typography variant="h3" component="h1" gutterBottom>
                  {ngo.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {ngo.description}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  {ngo.contact_email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email fontSize="small" />
                      <Typography variant="body2">
                        {ngo.contact_email}
                      </Typography>
                    </Box>
                  )}
                  {ngo.contact_phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone fontSize="small" />
                      <Typography variant="body2">
                        {ngo.contact_phone}
                      </Typography>
                    </Box>
                  )}
                  {ngo.website_url && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Language fontSize="small" />
                      <Typography variant="body2" component="a" href={ngo.website_url} target="_blank" rel="noopener noreferrer">
                        Website
                      </Typography>
                    </Box>
                  )}
                </Box>

                {ngo.address && (
                  <Typography variant="body2" color="text.secondary">
                    <AccountBalance fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {ngo.address}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Causes Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">
              Our Causes
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label="All Causes"
                onClick={() => setSelectedCategory(null)}
                color={selectedCategory === null ? 'primary' : 'default'}
                variant={selectedCategory === null ? 'filled' : 'outlined'}
              />
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  onClick={() => setSelectedCategory(category.id)}
                  color={selectedCategory === category.id ? 'primary' : 'default'}
                  variant={selectedCategory === category.id ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>

          {causes.length === 0 ? (
            <Alert severity="info">
              No active causes found for this NGO.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {causes.map((cause) => (
                <Grid item xs={12} sm={6} md={4} key={cause.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {cause.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {cause.description.substring(0, 150)}...
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Raised: ₹{(cause.current_amount || 0).toLocaleString()} / ₹{(cause.target_amount || 0).toLocaleString()}
                        </Typography>
                        <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, mt: 1 }}>
                          <Box
                            sx={{
                              width: `${cause.target_amount > 0 ? ((cause.current_amount || 0) / cause.target_amount) * 100 : 0}%`,
                              bgcolor: 'primary.main',
                              height: 8,
                              borderRadius: 1,
                            }}
                          />
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <VolunteerActivism fontSize="small" />
                        <Chip 
                          label={cause.category?.name} 
                          size="small" 
                          color="secondary"
                        />
                      </Box>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        size="small"
                        variant="contained"
                        fullWidth
                        onClick={() => navigate(`/cause/${cause.id}`)}
                      >
                        View Details
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Contact Section */}
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Get in Touch
            </Typography>
            <Typography variant="body1" paragraph>
              Interested in supporting {ngo.name}? We'd love to hear from you.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {ngo.contact_email && (
                <Button
                  variant="outlined"
                  startIcon={<Email />}
                  href={`mailto:${ngo.contact_email}`}
                >
                  Send Email
                </Button>
              )}
              {ngo.website_url && (
                <Button
                  variant="outlined"
                  startIcon={<Language />}
                  href={ngo.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit Website
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

export default NgoPage
