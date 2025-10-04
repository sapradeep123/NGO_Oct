import React, { useState } from 'react'
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material'
import { 
  Add, 
  Edit, 
  Delete, 
  AttachMoney, 
  TrendingUp, 
  Receipt,
  Store,
  Domain
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import DataTable from '../components/DataTable'

const NgoDashboard: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tabValue, setTabValue] = useState(0)
  const [createCauseOpen, setCreateCauseOpen] = useState(false)
  const [micrositeOpen, setMicrositeOpen] = useState(false)
  const [newCause, setNewCause] = useState({
    title: '',
    description: '',
    target_amount: '',
    category_id: '',
    type: 'VENDOR' as 'VENDOR' | 'NGO_MANAGED'
  })

  // Fetch causes
  const { data: causes = [], isLoading: causesLoading } = useQuery({
    queryKey: ['ngo-causes'],
    queryFn: () => apiClient.getCauses({ tenant: 'hope-trust' }), // Mock tenant
  })

  // Fetch vendor invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['vendor-invoices'],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return [
        {
          id: 1,
          cause_title: 'Emergency Food Relief',
          vendor_name: 'Alpha Supplies',
          number: 'INV-001',
          amount: 15000,
          status: 'SUBMITTED',
          created_at: '2024-01-15T10:30:00Z'
        }
      ]
    },
  })

  // Fetch NGO receipts
  const { data: receipts = [], isLoading: receiptsLoading } = useQuery({
    queryKey: ['ngo-receipts'],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return [
        {
          id: 1,
          cause_title: 'Education Program',
          amount: 25000,
          status: 'SUBMITTED',
          created_at: '2024-01-10T14:20:00Z'
        }
      ]
    },
  })

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories(),
  })

  // Create cause mutation
  const createCauseMutation = useMutation({
    mutationFn: async (causeData: any) => {
      // Mock API call - replace with actual implementation
      console.log('Creating cause:', causeData)
      return { id: Date.now(), ...causeData }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngo-causes'] })
      setCreateCauseOpen(false)
      setNewCause({ title: '', description: '', target_amount: '', category_id: '', type: 'VENDOR' })
    },
  })

  // Approve invoice mutation
  const approveInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      return apiClient.approveVendorInvoice(invoiceId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-invoices'] })
    },
  })

  const causeColumns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'title', headerName: 'Title', width: 200 },
    { field: 'category', headerName: 'Category', width: 120, renderCell: (params: any) => 
      <Chip label={params.row.category?.name || 'N/A'} size="small" />
    },
    { field: 'target_amount', headerName: 'Goal', width: 120, renderCell: (params: any) => 
      `₹${params.value.toLocaleString()}` 
    },
    { field: 'current_amount', headerName: 'Raised', width: 120, renderCell: (params: any) => 
      `₹${params.value.toLocaleString()}` 
    },
    { field: 'status', headerName: 'Status', width: 120, renderCell: (params: any) => (
      <Chip 
        label={params.value} 
        color={params.value === 'LIVE' ? 'success' : 'default'}
        size="small"
      />
    )},
  ]

  const invoiceColumns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'cause_title', headerName: 'Cause', width: 150 },
    { field: 'vendor_name', headerName: 'Vendor', width: 150 },
    { field: 'number', headerName: 'Invoice #', width: 120 },
    { field: 'amount', headerName: 'Amount', width: 120, renderCell: (params: any) => 
      `₹${params.value.toLocaleString()}`
    },
    { field: 'status', headerName: 'Status', width: 120, renderCell: (params: any) => (
      <Chip 
        label={params.value} 
        color={params.value === 'SUBMITTED' ? 'warning' : params.value === 'NGO_APPROVED' ? 'success' : 'default'}
        size="small"
      />
    )},
  ]

  const receiptColumns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'cause_title', headerName: 'Cause', width: 150 },
    { field: 'amount', headerName: 'Amount', width: 120, renderCell: (params: any) => 
      `₹${params.value.toLocaleString()}`
    },
    { field: 'status', headerName: 'Status', width: 120, renderCell: (params: any) => (
      <Chip 
        label={params.value} 
        color={params.value === 'SUBMITTED' ? 'warning' : params.value === 'ADMIN_APPROVED' ? 'success' : 'default'}
        size="small"
      />
    )},
  ]

  const causeActions = [
    {
      icon: <Edit />,
      label: 'Edit',
      onClick: (params: any) => {
        // Navigate to edit cause page
        navigate(`/cause/${params.id}/edit`)
      }
    },
    {
      icon: <Delete />,
      label: 'Delete',
      onClick: (params: any) => {
        if (window.confirm('Are you sure you want to delete this cause?')) {
          // Delete cause logic
          console.log('Deleting cause:', params.id)
        }
      }
    }
  ]

  const invoiceActions = [
    {
      icon: <Receipt />,
      label: 'Approve',
      onClick: (params: any) => {
        if (params.row.status === 'SUBMITTED') {
          approveInvoiceMutation.mutate(params.id)
        }
      }
    }
  ]

  const handleCreateCause = () => {
    createCauseMutation.mutate(newCause)
  }

  const TabPanel = ({ children, value, index }: { children: React.ReactNode, value: number, index: number }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            NGO Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your causes, vendors, and receipts
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUp color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {causes.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Causes
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AttachMoney color="secondary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      ₹{causes.reduce((sum, cause) => sum + (cause.current_amount || 0), 0).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Raised
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Store color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {invoices.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Invoices
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Receipt color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {receipts.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Receipts
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label="Causes" />
              <Tab label="Vendor Invoices" />
              <Tab label="NGO Receipts" />
              <Tab label="Microsite Settings" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Your Causes
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateCauseOpen(true)}
              >
                Create Cause
              </Button>
            </Box>

            <DataTable
              rows={causes}
              columns={causeColumns}
              actions={causeActions}
              loading={causesLoading}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Vendor Invoices
              </Typography>
            </Box>

            <DataTable
              rows={invoices}
              columns={invoiceColumns}
              actions={invoiceActions}
              loading={invoicesLoading}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                NGO Receipts
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  // Navigate to create receipt page
                  alert('Create receipt feature coming soon!')
                }}
              >
                Upload Receipt
              </Button>
            </Box>

            <DataTable
              rows={receipts}
              columns={receiptColumns}
              loading={receiptsLoading}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Microsite Settings
              </Typography>
              <Button
                variant="contained"
                startIcon={<Domain />}
                onClick={() => setMicrositeOpen(true)}
              >
                Configure Domain
              </Button>
            </Box>

            <Alert severity="info">
              Configure your custom domain to create a microsite for your NGO. This will allow donors to visit your dedicated page.
            </Alert>
          </TabPanel>
        </Card>

        {/* Create Cause Dialog */}
        <Dialog open={createCauseOpen} onClose={() => setCreateCauseOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Cause</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Title"
              value={newCause.title}
              onChange={(e) => setNewCause({ ...newCause, title: e.target.value })}
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={newCause.description}
              onChange={(e) => setNewCause({ ...newCause, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Goal Amount (₹)"
              type="number"
              value={newCause.target_amount}
              onChange={(e) => setNewCause({ ...newCause, target_amount: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={newCause.category_id}
                onChange={(e) => setNewCause({ ...newCause, category_id: e.target.value })}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={newCause.type}
                onChange={(e) => setNewCause({ ...newCause, type: e.target.value as 'VENDOR' | 'NGO_MANAGED' })}
              >
                <MenuItem value="VENDOR">Vendor Managed</MenuItem>
                <MenuItem value="NGO_MANAGED">NGO Managed</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateCauseOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateCause} 
              variant="contained"
              disabled={createCauseMutation.isPending}
            >
              {createCauseMutation.isPending ? <CircularProgress size={20} /> : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Microsite Domain Dialog */}
        <Dialog open={micrositeOpen} onClose={() => setMicrositeOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Configure Microsite Domain</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Contact support to configure your custom domain for the microsite.
            </Alert>
            <TextField
              fullWidth
              label="Domain (e.g., yourngo.example.com)"
              placeholder="yourngo.example.com"
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              fullWidth
              label="Contact Email"
              placeholder="admin@yourngo.com"
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMicrositeOpen(false)}>Cancel</Button>
            <Button variant="contained">
              Request Configuration
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  )
}

export default NgoDashboard
