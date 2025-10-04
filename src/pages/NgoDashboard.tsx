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
  const [editCauseOpen, setEditCauseOpen] = useState(false)
  const [micrositeOpen, setMicrositeOpen] = useState(false)
  const [editingCause, setEditingCause] = useState<any>(null)
  const [newCause, setNewCause] = useState({
    title: '',
    description: '',
    target_amount: '',
    category_id: '',
    type: 'VENDOR' as 'VENDOR' | 'NGO_MANAGED',
    image_url: '',  // Added image URL field
    ngo_id: 1  // Default NGO ID for Hope Trust
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
      return apiClient.createNgoCause(causeData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngo-causes'] })
      setCreateCauseOpen(false)
      setNewCause({ title: '', description: '', target_amount: '', category_id: '', type: 'VENDOR', image_url: '', ngo_id: 1 })
    },
    onError: (error) => {
      console.error('Error creating cause:', error)
      alert('Failed to create cause. Please try again.')
    }
  })

  // Update cause mutation
  const updateCauseMutation = useMutation({
    mutationFn: async (causeData: any) => {
      // For now, we'll simulate an update - in a real app, you'd have an update endpoint
      console.log('Updating cause:', causeData)
      return { id: causeData.id, ...causeData }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngo-causes'] })
      setEditCauseOpen(false)
      setEditingCause(null)
      alert('Cause updated successfully!')
    },
    onError: (error) => {
      console.error('Error updating cause:', error)
      alert('Failed to update cause. Please try again.')
    }
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
        handleEditCause(params.row)
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

  const handleEditCause = (cause: any) => {
    setEditingCause(cause)
    setEditCauseOpen(true)
  }

  const handleUpdateCause = () => {
    if (editingCause) {
      updateCauseMutation.mutate(editingCause)
    }
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
              <Tab label="Gallery Management" />
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
                Photo Gallery Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  const imageUrl = prompt('Enter image URL:')
                  if (imageUrl) {
                    // Add to gallery logic here
                    alert(`Image added to gallery: ${imageUrl}`)
                  }
                }}
              >
                Add Photo
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              {/* Sample gallery images */}
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <img 
                      src="https://picsum.photos/300/200?random=101" 
                      alt="Gallery Image 1"
                      style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8 }}
                    />
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        School Building
                      </Typography>
                      <Button size="small" color="error" onClick={() => alert('Delete image?')}>
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <img 
                      src="https://picsum.photos/300/200?random=102" 
                      alt="Gallery Image 2"
                      style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8 }}
                    />
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Medical Camp
                      </Typography>
                      <Button size="small" color="error" onClick={() => alert('Delete image?')}>
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <img 
                      src="https://picsum.photos/300/200?random=103" 
                      alt="Gallery Image 3"
                      style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8 }}
                    />
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Food Distribution
                      </Typography>
                      <Button size="small" color="error" onClick={() => alert('Delete image?')}>
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <img 
                      src="https://picsum.photos/300/200?random=104" 
                      alt="Gallery Image 4"
                      style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8 }}
                    />
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Children Learning
                      </Typography>
                      <Button size="small" color="error" onClick={() => alert('Delete image?')}>
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
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

            <Alert severity="info" sx={{ mb: 3 }}>
              Configure your custom domain to create a microsite for your NGO. This will allow donors to visit your dedicated page.
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Current Microsite
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Your NGO microsite URL:
                    </Typography>
                    <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2 }}>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                        https://hope-trust.ngoplatform.com
                      </Typography>
                    </Box>
                    <Button 
                      variant="outlined" 
                      onClick={() => window.open('https://hope-trust.ngoplatform.com', '_blank')}
                      sx={{ mr: 1 }}
                    >
                      Visit Microsite
                    </Button>
                    <Button variant="outlined" color="secondary">
                      Preview
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Custom Domain Settings
                    </Typography>
                    <TextField
                      fullWidth
                      label="Custom Domain"
                      placeholder="yourngo.com"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Subdomain"
                      placeholder="hope-trust"
                      sx={{ mb: 2 }}
                    />
                    <Button variant="contained" fullWidth>
                      Configure Custom Domain
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Microsite Features
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="primary">✓</Typography>
                          <Typography variant="body2">Custom Branding</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="primary">✓</Typography>
                          <Typography variant="body2">Cause Showcase</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="primary">✓</Typography>
                          <Typography variant="body2">Donation Tracking</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="primary">✓</Typography>
                          <Typography variant="body2">Impact Reports</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
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
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={newCause.type}
                onChange={(e) => setNewCause({ ...newCause, type: e.target.value as 'VENDOR' | 'NGO_MANAGED' })}
              >
                <MenuItem value="VENDOR">Vendor Managed</MenuItem>
                <MenuItem value="NGO_MANAGED">NGO Managed</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Image URL (Optional)"
              value={newCause.image_url}
              onChange={(e) => setNewCause({ ...newCause, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
              sx={{ mb: 2 }}
            />
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

        {/* Edit Cause Dialog */}
        <Dialog open={editCauseOpen} onClose={() => setEditCauseOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Cause</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Title"
              value={editingCause?.title || ''}
              onChange={(e) => setEditingCause({ ...editingCause, title: e.target.value })}
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={editingCause?.description || ''}
              onChange={(e) => setEditingCause({ ...editingCause, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Goal Amount (₹)"
              type="number"
              value={editingCause?.target_amount || ''}
              onChange={(e) => setEditingCause({ ...editingCause, target_amount: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={editingCause?.category_id || ''}
                onChange={(e) => setEditingCause({ ...editingCause, category_id: e.target.value })}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={editingCause?.type || 'VENDOR'}
                onChange={(e) => setEditingCause({ ...editingCause, type: e.target.value })}
              >
                <MenuItem value="VENDOR">Vendor Managed</MenuItem>
                <MenuItem value="NGO_MANAGED">NGO Managed</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Image URL (Optional)"
              value={editingCause?.image_url || ''}
              onChange={(e) => setEditingCause({ ...editingCause, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditCauseOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleUpdateCause} 
              variant="contained"
              disabled={updateCauseMutation.isPending}
            >
              {updateCauseMutation.isPending ? <CircularProgress size={20} /> : 'Update'}
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
