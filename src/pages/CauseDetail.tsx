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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import { 
  VolunteerActivism, 
  AccountBalance, 
  CheckCircle,
  History,
  ExpandMore,
  Receipt,
  CurrencyRupee
} from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
  const queryClient = useQueryClient()
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

  // Fetch donor's donation history for this cause (only if user is a donor)
  const { data: donationHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['donation-history', id, user?.email],
    queryFn: () => apiClient.getDonorDonationsByCause(parseInt(id!)),
    enabled: !!id && !!user && user.role === 'DONOR',
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
      console.log('Initializing donation...', {
        cause_id: cause.id,
        amount: parseInt(donationAmount),
        donor_name: `${user?.first_name} ${user?.last_name}`,
        donor_email: user?.email || '',
        donor_phone: user?.phone || ''
      })

      // Initialize donation
      const donationData = await apiClient.initDonation({
        cause_id: cause.id,
        amount: parseInt(donationAmount),
        donor_name: `${user?.first_name} ${user?.last_name}`,
        donor_email: user?.email || '',
        donor_phone: user?.phone || ''
      })

      console.log('Donation data received:', donationData)

      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please refresh the page and try again.')
      }

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
          console.log('Payment successful:', response)
          try {
            // Verify payment
            const verification = await apiClient.verifyDonation({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })

            console.log('Payment verification:', verification)

            if (verification.success) {
              setDonationSuccess({
                ...verification,
                amount: donationData.amount,
                cause_title: cause.title,
                donor_name: `${user?.first_name} ${user?.last_name}`,
                transaction_id: response.razorpay_payment_id,
                date: new Date().toISOString()
              })
              setSuccessDialogOpen(true)
              setDonationAmount('500') // Reset to default
              setIsDonating(false)
              
              // Invalidate queries to refresh data
              queryClient.invalidateQueries({ queryKey: ['cause', id] })
              queryClient.invalidateQueries({ queryKey: ['donation-history', id, user?.email] })
            }
          } catch (err: any) {
            console.error('Payment verification error:', err)
            let errorMessage = 'Payment verification failed. Please contact support.'
            
            if (err.response?.data?.detail) {
              errorMessage = typeof err.response.data.detail === 'string' 
                ? err.response.data.detail 
                : JSON.stringify(err.response.data.detail)
            } else if (err.message) {
              errorMessage = typeof err.message === 'string' 
                ? err.message 
                : JSON.stringify(err.message)
            }
            
            setError(errorMessage)
            setIsDonating(false)
          }
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed')
            setIsDonating(false)
          }
        }
      }

      console.log('Opening Razorpay with options:', options)

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options)
      razorpay.open()

    } catch (err: any) {
      console.error('Donation error:', err)
      let errorMessage = 'Donation failed'
      
      if (err.response?.data?.detail) {
        errorMessage = typeof err.response.data.detail === 'string' 
          ? err.response.data.detail 
          : JSON.stringify(err.response.data.detail)
      } else if (err.message) {
        errorMessage = typeof err.message === 'string' 
          ? err.message 
          : JSON.stringify(err.message)
      }
      
      setError(errorMessage)
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
            {cause?.title || 'Loading...'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Chip 
              icon={<AccountBalance />} 
              label={cause?.ngo_name || 'Unknown NGO'} 
              color="primary" 
            />
            <Chip 
              icon={<VolunteerActivism />} 
              label={cause?.category_name || 'Uncategorized'} 
              color="secondary" 
            />
            <Chip 
              label="LIVE" 
              color="success" 
            />
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {cause?.description || 'Loading...'}
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
                  {cause?.description || 'Loading...'}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>
                  Progress
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      Raised: ₹{cause?.current_amount?.toLocaleString() || 0}
                    </Typography>
                    <Typography variant="body2">
                      Goal: ₹{cause?.target_amount?.toLocaleString() || 0}
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
                    {cause?.ngo_name || 'Unknown NGO'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Donation History Section - Only for Donors */}
            {user?.role === 'DONOR' && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <History color="primary" />
                    <Typography variant="h6">
                      Your Donation History
                    </Typography>
                  </Box>
                  
                  {historyLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : donationHistory && donationHistory.donations && donationHistory.donations.length > 0 ? (
                    <Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          You have donated {donationHistory.total_donations} time{donationHistory.total_donations > 1 ? 's' : ''} to this cause
                        </Typography>
                        <Typography variant="h6" color="primary">
                          Total: ₹{donationHistory.total_amount?.toLocaleString()}
                        </Typography>
                      </Box>
                      
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="subtitle1">
                            View All Donations ({donationHistory.donations.length})
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            {donationHistory.donations.map((donation: any, index: number) => (
                              <ListItem key={donation.id || index} sx={{ px: 0 }}>
                                <ListItemIcon>
                                  <Receipt color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        ₹{donation.amount?.toLocaleString()}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {new Date(donation.created_at).toLocaleDateString()}
                                      </Typography>
                                    </Box>
                                  }
                                  secondary={
                                    <Box>
                                      <Typography variant="body2" color="text.secondary">
                                        Transaction ID: {donation.transaction_id}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        Status: {donation.status}
                                      </Typography>
                                    </Box>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      You haven't donated to this cause yet. Be the first to make a difference!
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}
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
                    {typeof error === 'string' ? error : JSON.stringify(error)}
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
                      <CurrencyRupee sx={{ mr: 1 }} />
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
              Thank you for your generous donation of ₹{donationSuccess?.amount?.toLocaleString() || '0'} to {donationSuccess?.cause_title || 'this cause'}!
            </Typography>
            
            <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Transaction Details:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Transaction ID:</strong> {donationSuccess?.transaction_id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Payment ID:</strong> {donationSuccess?.payment_id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Amount:</strong> ₹{donationSuccess?.amount?.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Date & Time:</strong> {donationSuccess?.date ? new Date(donationSuccess.date).toLocaleString() : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Status:</strong> Completed
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              You will receive a receipt via email shortly. This transaction will appear in your donation history.
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