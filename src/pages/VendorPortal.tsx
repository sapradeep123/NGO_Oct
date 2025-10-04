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
  Upload, 
  Receipt, 
  AttachMoney, 
  TrendingUp,
  Store
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { apiClient } from '../api/client'
import DataTable from '../components/DataTable'

const VendorPortal: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [tabValue, setTabValue] = useState(0)
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false)
  const [newInvoice, setNewInvoice] = useState({
    cause_id: '',
    number: '',
    amount: '',
    files: [] as File[]
  })

  // Fetch vendor's causes
  const { data: causes = [], isLoading: causesLoading } = useQuery({
    queryKey: ['vendor-causes'],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return [
        {
          id: 1,
          title: 'Emergency Food Relief',
          ngo_name: 'Hope Trust',
          status: 'LIVE',
          target_amount: 50000,
          current_amount: 25000
        }
      ]
    },
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
          number: 'INV-001',
          amount: 15000,
          status: 'SUBMITTED',
          created_at: '2024-01-15T10:30:00Z',
          files: ['invoice.pdf', 'receipt.pdf']
        },
        {
          id: 2,
          cause_title: 'Education Program',
          number: 'INV-002',
          amount: 25000,
          status: 'NGO_APPROVED',
          created_at: '2024-01-10T14:20:00Z',
          files: ['invoice.pdf']
        }
      ]
    },
  })

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: FormData) => {
      return apiClient.createVendorInvoice(invoiceData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-invoices'] })
      setCreateInvoiceOpen(false)
      setNewInvoice({ cause_id: '', number: '', amount: '', files: [] })
    },
  })

  const invoiceColumns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'cause_title', headerName: 'Cause', width: 200 },
    { field: 'number', headerName: 'Invoice #', width: 120 },
    { field: 'amount', headerName: 'Amount', width: 120, renderCell: (params: any) => 
      `₹${params.value.toLocaleString()}`
    },
    { field: 'status', headerName: 'Status', width: 120, renderCell: (params: any) => (
      <Chip 
        label={params.value} 
        color={
          params.value === 'SUBMITTED' ? 'warning' : 
          params.value === 'NGO_APPROVED' ? 'success' : 
          params.value === 'PAID' ? 'primary' : 'default'
        }
        size="small"
      />
    )},
    { field: 'created_at', headerName: 'Date', width: 150, renderCell: (params: any) => 
      new Date(params.value).toLocaleDateString()
    },
  ]

  const handleCreateInvoice = () => {
    const formData = new FormData()
    formData.append('cause_id', newInvoice.cause_id)
    formData.append('vendor_id', '1') // Mock vendor ID
    formData.append('number', newInvoice.number)
    formData.append('amount', newInvoice.amount)
    
    newInvoice.files.forEach((file, index) => {
      formData.append('files', file)
    })

    createInvoiceMutation.mutate(formData)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setNewInvoice({ ...newInvoice, files: [...newInvoice.files, ...files] })
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
            Vendor Portal
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your orders and submit invoices
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Store color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {causes.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Orders
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
                  <Receipt color="secondary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {invoices.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Invoices
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
                  <AttachMoney color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      ₹{invoices.reduce((sum, invoice) => sum + invoice.amount, 0).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Amount
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
                  <TrendingUp color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {invoices.filter(inv => inv.status === 'NGO_APPROVED').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Approved
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
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="My Orders" />
              <Tab label="Invoices" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Active Orders
              </Typography>
            </Box>

            {causes.length === 0 ? (
              <Alert severity="info">
                No active orders found. Contact NGOs to get linked to their causes.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {causes.map((cause) => (
                  <Grid item xs={12} sm={6} md={4} key={cause.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" component="h2" gutterBottom>
                          {cause.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          NGO: {cause.ngo_name}
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Goal: ₹{cause.target_amount.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Raised: ₹{cause.current_amount.toLocaleString()}
                          </Typography>
                        </Box>
                        <Chip 
                          label={cause.status} 
                          color={cause.status === 'LIVE' ? 'success' : 'default'}
                          size="small"
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Invoice History
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateInvoiceOpen(true)}
              >
                Submit Invoice
              </Button>
            </Box>

            <DataTable
              rows={invoices}
              columns={invoiceColumns}
              loading={invoicesLoading}
            />
          </TabPanel>
        </Card>

        {/* Create Invoice Dialog */}
        <Dialog open={createInvoiceOpen} onClose={() => setCreateInvoiceOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Submit New Invoice</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
              <InputLabel>Cause</InputLabel>
              <Select
                value={newInvoice.cause_id}
                onChange={(e) => setNewInvoice({ ...newInvoice, cause_id: e.target.value })}
              >
                {causes.map((cause) => (
                  <MenuItem key={cause.id} value={cause.id}>
                    {cause.title} - {cause.ngo_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Invoice Number"
              value={newInvoice.number}
              onChange={(e) => setNewInvoice({ ...newInvoice, number: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Amount (₹)"
              type="number"
              value={newInvoice.amount}
              onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Upload Files
              </Typography>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{ marginBottom: 16 }}
              />
              {newInvoice.files.length > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Selected files:
                  </Typography>
                  {newInvoice.files.map((file, index) => (
                    <Chip
                      key={index}
                      label={file.name}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateInvoiceOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateInvoice} 
              variant="contained"
              disabled={createInvoiceMutation.isPending || !newInvoice.cause_id || !newInvoice.number || !newInvoice.amount}
            >
              {createInvoiceMutation.isPending ? <CircularProgress size={20} /> : 'Submit Invoice'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  )
}

export default VendorPortal
