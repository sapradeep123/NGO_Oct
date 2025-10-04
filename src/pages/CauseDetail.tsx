import React, { useState } from 'react'
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Divider,
} from '@mui/material'
import { VolunteerActivism, AccountBalance, AttachMoney } from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { apiClient } from '../api/client'

const CauseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [donationAmount, setDonationAmount] = useState('')
  const [isDonating, setIsDonating] = useState(false)
  const [error, setError] = useState('')

  // Fetch cause details
  const { data: cause, isLoading } = useQuery({
    queryKey: ['cause', id],
    queryFn: () => apiClient.getCauses().then(causes => 
      causes.find(c => c.id === parseInt(id!))
    ),
    enabled: !!id,
  })

  const handleDonate = async () => {
    if (!cause || !donationAmount) return

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    setIsDonating(true)
    setError('')

    try {
      const response = await apiClient.initDonation({
        cause_id: cause.id,
        amount: parseFloat(donationAmount),
        currency: 'INR'
      })

      // In a real implementation, you would integrate with Razorpay here
      // For now, we'll show a success message
      alert(`Donation initiated! Order ID: ${response.order_id}`)
      
      // Reset form
      setDonationAmount('')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Donation failed')
    } finally {
      setIsDonating(false)
    }
  }

  const progressPercentage = cause ? (cause.target_amount > 0 ? ((cause.current_amount || 0) / cause.target_amount) * 100 : 0) : 0

  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (!cause) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">
          Cause not found
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* Cause Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            {cause.title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Chip 
              icon={<AccountBalance />}
              label={cause.tenant?.name} 
              color="primary" 
              variant="outlined"
            />
            <Chip 
              icon={<VolunteerActivism />}
              label={cause.category?.name} 
              color="secondary" 
              variant="outlined"
            />
            <Chip 
              label={cause.status} 
              color={cause.status === 'LIVE' ? 'success' : 'default'}
            />
          </Box>

          <Typography variant="body1" color="text.secondary" paragraph>
            {cause.description}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Cause Details */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  About This Cause
                </Typography>
                <Typography variant="body1" paragraph>
                  {cause.description}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>
                  Progress
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      Raised: ₹{(cause.current_amount || 0).toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      Goal: ₹{(cause.target_amount || 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1 }}>
                    <Box
                      sx={{
                        width: `${Math.min(progressPercentage, 100)}%`,
                        bgcolor: 'primary.main',
                        height: 12,
                        borderRadius: 1,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {progressPercentage.toFixed(1)}% funded
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>
                  NGO Information
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AccountBalance color="primary" />
                  <Box>
                    <Typography variant="subtitle1">
                      {cause.tenant?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {cause.tenant?.contact_email}
                    </Typography>
                    {cause.tenant?.website_url && (
                      <Typography variant="body2" color="primary">
                        <a href={cause.tenant.website_url} target="_blank" rel="noopener noreferrer">
                          Visit Website
                        </a>
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Donation Panel */}
          <Grid item xs={12} md={4}>
            <Card sx={{ position: 'sticky', top: 100 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Make a Donation
                </Typography>
                
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <TextField
                  fullWidth
                  label="Amount (₹)"
                  type="number"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <AttachMoney />,
                  }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleDonate}
                  disabled={!donationAmount || isDonating || cause.status !== 'LIVE'}
                  sx={{ mb: 2 }}
                >
                  {isDonating ? (
                    <CircularProgress size={24} />
                  ) : (
                    'Donate Now'
                  )}
                </Button>

                {cause.status !== 'LIVE' && (
                  <Alert severity="warning">
                    This cause is not currently accepting donations.
                  </Alert>
                )}

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Your donation will be processed securely and you'll receive a receipt via email.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}

export default CauseDetail
