import React, { useState } from 'react'
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material'
import { 
  AttachMoney, 
  Receipt, 
  TrendingUp, 
  Visibility, 
  Support, 
  LocalShipping,
  CheckCircle,
  Schedule,
  Warning
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { apiClient } from '../api/client'
import DataTable from '../components/DataTable'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

const DonorDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [tabValue, setTabValue] = useState(0)
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false)
  const [deliveryStatusDialogOpen, setDeliveryStatusDialogOpen] = useState(false)
  const [taxDocsDialogOpen, setTaxDocsDialogOpen] = useState(false)
  const [selectedCause, setSelectedCause] = useState<any>(null)
  const [deliveryStatus, setDeliveryStatus] = useState<any>(null)
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    priority: 'MEDIUM'
  })

  // Fetch donor's donations
  const { data: donations = [], isLoading: donationsLoading } = useQuery({
    queryKey: ['donor-donations'],
    queryFn: () => apiClient.getDonorDonations(),
  })

  // Fetch donor's order status
  const { data: donorOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['donor-orders'],
    queryFn: () => apiClient.getDonorOrders(),
  })

  // Fetch donor's tickets
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['donor-tickets'],
    queryFn: () => apiClient.getDonorTickets(),
  })

  // Fetch tax documents
  const { data: taxDocuments = [], isLoading: taxDocsLoading } = useQuery({
    queryKey: ['donor-tax-documents'],
    queryFn: () => apiClient.getDonorTaxDocuments(),
  })

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: (ticketData: any) => apiClient.createDonorTicket(ticketData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donor-tickets'] })
      setTicketDialogOpen(false)
      setTicketForm({ subject: '', description: '', priority: 'MEDIUM' })
    },
  })

  // Get delivery status mutation
  const getDeliveryStatusMutation = useMutation({
    mutationFn: (causeId: number) => apiClient.getCauseDeliveryStatus(causeId),
    onSuccess: (data) => {
      setDeliveryStatus(data)
      setDeliveryStatusDialogOpen(true)
    },
  })

  const { data: stats = { totalDonated: 0, totalCauses: 0, thisMonth: 0 } } = useQuery({
    queryKey: ['donor-stats'],
    queryFn: async () => {
      // Calculate stats from donations
      const totalDonated = donations.reduce((sum: number, donation: any) => sum + donation.amount, 0)
      const totalCauses = new Set(donations.map((d: any) => d.cause_id)).size
      const thisMonth = donations
        .filter((d: any) => new Date(d.date).getMonth() === new Date().getMonth())
        .reduce((sum: number, donation: any) => sum + donation.amount, 0)
      
      return { totalDonated, totalCauses, thisMonth }
    },
    enabled: donations.length > 0
  })

  const donationColumns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'cause_title', headerName: 'Cause', width: 200 },
    { field: 'ngo_name', headerName: 'NGO', width: 150 },
    { field: 'amount', headerName: 'Amount', width: 120, renderCell: (params: any) => `₹${params.value.toLocaleString()}` },
    { field: 'status', headerName: 'Status', width: 120, renderCell: (params: any) => (
      <Chip 
        label={params.value} 
        color={params.value === 'COMPLETED' ? 'success' : 'info'} 
        size="small" 
      />
    )},
    { field: 'date', headerName: 'Date', width: 120, renderCell: (params: any) => new Date(params.value).toLocaleDateString() },
  ]

  const donationActions = [
    {
      icon: <Visibility />,
      label: 'View Details',
      onClick: (params: any) => {
        // Show donation details
        console.log('View donation:', params.row)
      }
    },
    {
      icon: <LocalShipping />,
      label: 'Check Delivery Status',
      onClick: (params: any) => {
        setSelectedCause(params.row)
        getDeliveryStatusMutation.mutate(params.row.cause_id)
      }
    },
    {
      icon: <Support />,
      label: 'Raise Ticket',
      onClick: (params: any) => {
        setSelectedCause(params.row)
        setTicketForm({
          subject: `Delivery Status Inquiry - ${params.row.cause_title}`,
          description: `I donated to ${params.row.cause_title} but haven't received any updates on delivery status.`,
          priority: 'MEDIUM'
        })
        setTicketDialogOpen(true)
      }
    }
  ]

  const ticketColumns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'cause_title', headerName: 'Cause', width: 200 },
    { field: 'subject', headerName: 'Subject', width: 250 },
    { field: 'status', headerName: 'Status', width: 120, renderCell: (params: any) => (
      <Chip 
        label={params.value} 
        color={params.value === 'RESOLVED' ? 'success' : params.value === 'OPEN' ? 'warning' : 'info'} 
        size="small" 
      />
    )},
    { field: 'priority', headerName: 'Priority', width: 100 },
    { field: 'created_at', headerName: 'Created', width: 120, renderCell: (params: any) => new Date(params.value).toLocaleDateString() },
  ]

  const taxDocColumns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'cause_title', headerName: 'Cause', width: 200 },
    { field: 'ngo_name', headerName: 'NGO', width: 150 },
    { field: 'amount', headerName: 'Amount', width: 120, renderCell: (params: any) => `₹${params.value.toLocaleString()}` },
    { field: 'date', headerName: 'Date', width: 120, renderCell: (params: any) => new Date(params.value).toLocaleDateString() },
    { field: 'tax_exempt', headerName: 'Tax Exempt', width: 120, renderCell: (params: any) => (
      <Chip 
        label={params.value ? 'Yes' : 'No'} 
        color={params.value ? 'success' : 'default'} 
        size="small" 
      />
    )},
  ]

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'ORDER_RECEIVED': return 'info'
      case 'ORDER_IN_PROCESS': return 'warning'
      case 'ORDER_IN_TRANSIT': return 'primary'
      case 'ORDER_DELIVERED': return 'success'
      default: return 'default'
    }
  }

  const getDeliveryStatusIcon = (status: string) => {
    switch (status) {
      case 'ORDER_RECEIVED': return <Receipt />
      case 'ORDER_IN_PROCESS': return <Schedule />
      case 'ORDER_IN_TRANSIT': return <LocalShipping />
      case 'ORDER_DELIVERED': return <CheckCircle />
      default: return <Warning />
    }
  }

  const handleCreateTicket = () => {
    if (!selectedCause || !ticketForm.subject || !ticketForm.description) return
    
    createTicketMutation.mutate({
      cause_id: selectedCause.cause_id,
      cause_title: selectedCause.cause_title,
      ngo_name: selectedCause.ngo_name,
      subject: ticketForm.subject,
      description: ticketForm.description,
      priority: ticketForm.priority
    })
  }

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
        <Typography variant="h4" component="h1" gutterBottom>
          Donor Dashboard - {user?.first_name} {user?.last_name}
        </Typography>

        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
          <Tab label="My Donations" />
          <Tab label="Order Status" />
          <Tab label="Support Tickets" />
          <Tab label="Tax Documents" />
        </Tabs>

        {/* My Donations Tab */}
        <TabPanel value={tabValue} index={0}>
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
                    <TrendingUp color="success" sx={{ fontSize: 40 }} />
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

          {/* Donations Table */}
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
                  onClick={() => setTaxDocsDialogOpen(true)}
                >
                  Tax Documents
                </Button>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Order Status Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h5" gutterBottom>
            Order Status for My Donations
          </Typography>
          
          {ordersLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : donorOrders.length === 0 ? (
            <Card>
              <CardContent>
                <Typography variant="body1" color="text.secondary" align="center">
                  No orders found for your donations. Orders will appear here once NGOs place orders for causes you've supported.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {donorOrders.map((order: any) => (
                <Grid item xs={12} key={order.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {order.cause_title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            NGO: {order.ngo_name} | Vendor: {order.vendor_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Order #{order.order_number} | Your Donation: ₹{order.donor_donation_amount?.toLocaleString()}
                          </Typography>
                        </Box>
                        <Chip 
                          label={order.status?.replace('_', ' ')} 
                          color={
                            order.status === 'ORDER_DELIVERED' ? 'success' :
                            order.status === 'ORDER_IN_TRANSIT' ? 'info' :
                            order.status === 'ORDER_IN_PROCESS' ? 'warning' :
                            'default'
                          }
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body2" gutterBottom>
                        <strong>Order Details:</strong> {order.order_details}
                      </Typography>
                      
                      <Typography variant="body2" gutterBottom>
                        <strong>Delivery Address:</strong> {order.delivery_address}
                      </Typography>
                      
                      <Typography variant="body2" gutterBottom>
                        <strong>Contact Person:</strong> {order.contact_person} ({order.contact_phone})
                      </Typography>
                      
                      {order.delivery_date && (
                        <Typography variant="body2" gutterBottom>
                          <strong>Expected Delivery:</strong> {new Date(order.delivery_date).toLocaleDateString()}
                        </Typography>
                      )}
                      
                      {order.delivered_at && (
                        <Typography variant="body2" gutterBottom>
                          <strong>Delivered On:</strong> {new Date(order.delivered_at).toLocaleDateString()}
                        </Typography>
                      )}
                      
                      {order.ngo_confirmed_at && (
                        <Typography variant="body2" color="success.main" gutterBottom>
                          <strong>✓ Confirmed by NGO:</strong> {new Date(order.ngo_confirmed_at).toLocaleDateString()}
                        </Typography>
                      )}
                      
                      <Typography variant="caption" color="text.secondary">
                        Last Updated: {new Date(order.updated_at).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Support Tickets Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Support Tickets
            </Typography>
            <Button
              variant="contained"
              onClick={() => setTicketDialogOpen(true)}
            >
              Create New Ticket
            </Button>
          </Box>

          {tickets.length === 0 ? (
            <Alert severity="info">
              You haven't created any support tickets yet.
            </Alert>
          ) : (
            <DataTable
              rows={tickets}
              columns={ticketColumns}
              loading={ticketsLoading}
            />
          )}
        </TabPanel>

        {/* Tax Documents Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h5" gutterBottom>
            Tax Documents
          </Typography>
          
          {taxDocuments.length === 0 ? (
            <Alert severity="info">
              No tax documents available yet. Make a donation to generate tax receipts.
            </Alert>
          ) : (
            <DataTable
              rows={taxDocuments}
              columns={taxDocColumns}
              loading={taxDocsLoading}
            />
          )}
        </TabPanel>

        {/* Create Ticket Dialog */}
        <Dialog open={ticketDialogOpen} onClose={() => setTicketDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create Support Ticket</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Subject"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={ticketForm.priority}
                  onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTicketDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateTicket} 
              variant="contained"
              disabled={!ticketForm.subject || !ticketForm.description || createTicketMutation.isPending}
            >
              {createTicketMutation.isPending ? 'Creating...' : 'Create Ticket'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delivery Status Dialog */}
        <Dialog open={deliveryStatusDialogOpen} onClose={() => setDeliveryStatusDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Delivery Status - {deliveryStatus?.cause_title}</DialogTitle>
          <DialogContent>
            {deliveryStatus && (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Cause</Typography>
                    <Typography variant="body1">{deliveryStatus.cause_title}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">NGO</Typography>
                    <Typography variant="body1">{deliveryStatus.ngo_name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Current Status</Typography>
                    <Chip
                      icon={getDeliveryStatusIcon(deliveryStatus.order_status)}
                      label={deliveryStatus.order_status?.replace('_', ' ')}
                      color={getDeliveryStatusColor(deliveryStatus.order_status) as any}
                      sx={{ mt: 1 }}
                    />
                  </Grid>
                  {deliveryStatus.delivery_date && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Expected Delivery</Typography>
                      <Typography variant="body1">{new Date(deliveryStatus.delivery_date).toLocaleDateString()}</Typography>
                    </Grid>
                  )}
                  {deliveryStatus.delivered_at && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Delivered On</Typography>
                      <Typography variant="body1">{new Date(deliveryStatus.delivered_at).toLocaleDateString()}</Typography>
                    </Grid>
                  )}
                  {deliveryStatus.ngo_confirmed_at && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">NGO Confirmed</Typography>
                      <Typography variant="body1">{new Date(deliveryStatus.ngo_confirmed_at).toLocaleDateString()}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeliveryStatusDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Tax Documents Dialog */}
        <Dialog open={taxDocsDialogOpen} onClose={() => setTaxDocsDialogOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>Tax Documents</DialogTitle>
          <DialogContent>
            {taxDocuments.length === 0 ? (
              <Alert severity="info">
                No tax documents available yet. Make a donation to generate tax receipts.
              </Alert>
            ) : (
              <DataTable
                rows={taxDocuments}
                columns={taxDocColumns}
                loading={taxDocsLoading}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTaxDocsDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  )
}

export default DonorDashboard