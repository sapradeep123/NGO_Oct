import React from 'react'
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material'
import { AttachMoney, Receipt, TrendingUp } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { apiClient } from '../api/client'
import DataTable from '../components/DataTable'

const DonorDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Mock data for donor dashboard - in real implementation, these would be actual API calls
  const { data: donations = [], isLoading: donationsLoading } = useQuery({
    queryKey: ['donor-donations'],
    queryFn: async () => {
      // Mock donation data - replace with actual API call
      return [
        {
          id: 1,
          cause_title: 'Emergency Food Relief',
          ngo_name: 'Hope Trust',
          amount: 5000,
          status: 'CAPTURED',
          created_at: '2024-01-15T10:30:00Z',
          receipt_url: '/receipts/1.pdf'
        },
        {
          id: 2,
          cause_title: 'Education for Children',
          ngo_name: 'Care Works',
          amount: 2500,
          status: 'CAPTURED',
          created_at: '2024-01-10T14:20:00Z',
          receipt_url: '/receipts/2.pdf'
        }
      ]
    },
  })

  const { data: stats = { totalDonated: 0, totalCauses: 0, thisMonth: 0 } } = useQuery({
    queryKey: ['donor-stats'],
    queryFn: async () => {
      // Mock stats - replace with actual API call
      return {
        totalDonated: 7500,
        totalCauses: 2,
        thisMonth: 5000
      }
    },
  })

  const donationColumns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'cause_title', headerName: 'Cause', width: 200 },
    { field: 'ngo_name', headerName: 'NGO', width: 150 },
    { field: 'amount', headerName: 'Amount', width: 120, renderCell: (params: any) => `₹${params.value.toLocaleString()}` },
    { field: 'status', headerName: 'Status', width: 120, renderCell: (params: any) => (
      <Chip 
        label={params.value} 
        color={params.value === 'CAPTURED' ? 'success' : 'default'}
        size="small"
      />
    )},
    { field: 'created_at', headerName: 'Date', width: 150, renderCell: (params: any) => 
      new Date(params.value).toLocaleDateString()
    },
  ]

  const donationActions = [
    {
      icon: <Receipt />,
      label: 'Download Receipt',
      onClick: (params: any) => {
        // In real implementation, download receipt
        alert(`Downloading receipt for donation ${params.id}`)
      }
    }
  ]

  if (donationsLoading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {user?.first_name}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your donations and impact
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AttachMoney color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      ₹{stats.totalDonated.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Donated
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUp color="secondary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {stats.totalCauses}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Causes Supported
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Receipt color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      ₹{stats.thisMonth.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This Month
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Donations */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Recent Donations
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
            >
              Browse More Causes
            </Button>
          </Box>

          {donations.length === 0 ? (
            <Alert severity="info">
              You haven't made any donations yet. Start supporting causes that matter to you!
            </Alert>
          ) : (
            <DataTable
              rows={donations}
              columns={donationColumns}
              actions={donationActions}
              loading={donationsLoading}
            />
          )}
        </Box>

        {/* Quick Actions */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/')}
              >
                Browse Causes
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
              >
                View NGOs
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  // In real implementation, this would show tax documents
                  alert('Tax documents feature coming soon!')
                }}
              >
                Tax Documents
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

export default DonorDashboard
