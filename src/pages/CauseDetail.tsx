import React, { useState, useEffect } from 'react'
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material'
import { VolunteerActivism, AccountBalance, AttachMoney, CheckCircle } from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { apiClient } from '../api/client'

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

const CauseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [donationAmount, setDonationAmount] = useState('500')
  const [isDonating, setIsDonating] = useState(false)
  const [error, setError] = useState('')
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [donationSuccess, setDonationSuccess] = useState<any>(null)

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

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
      // Initialize donation
      const donationData = await apiClient.initDonation({
        cause_id: cause.id,
        amount: parseInt(donationAmount),
        donor_name: `${user?.first_name} ${user?.last_name}`,
        donor_email: user?.email || '',
        donor_phone: user?.phone || ''
      })

      // Configure Razorpay options
      const options = {
        key: donationData.key,
        amount: donationData.amount * 100, // Convert to paise
        currency: donationData.currency,
        name: donationData.name,
        description: donationData.description,
        order_id: donationData.order_id,
        prefill: donationData.prefill,
        notes: donationData.notes,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verification = await apiClient.verifyDonation({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })

            if (verification.success) {
              setDonationSuccess(verification)
              setSuccessDialogOpen(true)
              setDonationAmount('500') // Reset to default
            }
          } catch (err: any) {
            setError('Payment verification failed. Please contact support.')
          }
        },
        modal: {
          ondismiss: function() {
            setIsDonating(false)
          }
        }
      }

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options)
      razorpay.open()

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Donation failed')
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
              label={cause.ngo_name || 'Unknown NGO'} 
              color="primary" 
            />
            <Chip 
              icon={<VolunteerActivism />} 
              label={cause.category_name || 'Uncategorized'} 
              color="secondary" 
            />
            <Chip 
              label="LIVE" 
              color="success" 
            />
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {cause.description}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Left Column - Cause Information */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
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
                      Raised: ₹{cause.current_amount?.toLocaleString() || 0}
                    </Typography>
                    <Typography variant="body2">
                      Goal: ₹{cause.target_amount?.toLocaleString()}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progressPercentage} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                    {progressPercentage.toFixed(1)}% funded
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>
                  NGO Information
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalance color="primary" />
                  <Typography variant="body1">
                    {cause.ngo_name || 'Unknown NGO'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Donation Form */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
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
                    startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                  }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleDonate}
                  disabled={isDonating || !donationAmount}
                  sx={{ mb: 2 }}
                >
                  {isDonating ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <AttachMoney sx={{ mr: 1 }} />
                      Donate Now
                    </>
                  )}
                </Button>

                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Your donation will be processed securely and you'll receive a receipt via email.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Success Dialog */}
        <Dialog open={successDialogOpen} onClose={() => setSuccessDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" />
              <Typography variant="h6">Donation Successful!</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" paragraph>
              Thank you for your generous donation of ₹{donationAmount} to {cause.title}!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Payment ID: {donationSuccess?.payment_id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You will receive a receipt via email shortly.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSuccessDialogOpen(false)} variant="contained">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  )
}

export default CauseDetail