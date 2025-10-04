import React, { useState } from 'react'
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material'
import { 
  Category, 
  CheckCircle,
  Cancel,
  AttachMoney,
  Security,
  Verified,
  Store,
  AccountBalance,
  Person,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import DataTable from '../components/DataTable'

const AdminConsole: React.FC = () => {
  const queryClient = useQueryClient()
  const [tabValue, setTabValue] = useState(0)
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false)
  const [createCauseOpen, setCreateCauseOpen] = useState(false)
  const [createNGOOpen, setCreateNGOOpen] = useState(false)
  const [createVendorOpen, setCreateVendorOpen] = useState(false)
  const [createAssociationOpen, setCreateAssociationOpen] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })
  const [newCause, setNewCause] = useState({ 
    title: '', 
    description: '', 
    target_amount: '', 
    category_id: '', 
    ngo_ids: [] as number[]  // Changed to array for multiple NGOs
  })
  const [newNGO, setNewNGO] = useState({ 
    name: '', 
    description: '', 
    contact_email: '', 
    website_url: '' 
  })
  const [newVendor, setNewVendor] = useState({ 
    name: '', 
    gstin: '', 
    contact_email: '', 
    phone: '', 
    address: '' 
  })
  const [newAssociation, setNewAssociation] = useState({
    ngo_id: '',
    vendor_id: '',
    category_id: ''
  })

  // Detail view state
  const [vendorDetailsOpen, setVendorDetailsOpen] = useState(false)
  const [ngoDetailsOpen, setNgoDetailsOpen] = useState(false)
  const [donorDetailsOpen, setDonorDetailsOpen] = useState(false)
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null)
  const [selectedNgoId, setSelectedNgoId] = useState<number | null>(null)
  const [selectedDonorId, setSelectedDonorId] = useState<number | null>(null)

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories(),
  })

  // Fetch NGOs
  const { data: ngos = [], isLoading: ngosLoading } = useQuery({
    queryKey: ['admin-ngos'],
    queryFn: () => apiClient.getAdminNGOs(),
  })

  // Fetch vendors
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: () => apiClient.getAdminVendors(),
  })

  // Fetch donors
  const { data: donors = [], isLoading: donorsLoading } = useQuery({
    queryKey: ['admin-donors'],
    queryFn: () => apiClient.getAdminDonors(),
  })

  // Fetch payment summary
  const { data: paymentSummary = {} } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => apiClient.getAdminPayments(),
  })

  // Fetch pending causes
  const { data: pendingCauses = [], isLoading: pendingCausesLoading } = useQuery({
    queryKey: ['admin-pending-causes'],
    queryFn: () => apiClient.getPendingCauses(),
  })

  // Fetch NGO-Vendor associations
  const { data: associations = [], isLoading: associationsLoading } = useQuery({
    queryKey: ['ngo-vendor-associations'],
    queryFn: () => apiClient.getNgoVendorAssociations(),
  })

  // Fetch vendor details
  const { data: vendorDetails, isLoading: vendorDetailsLoading } = useQuery({
    queryKey: ['vendor-details', selectedVendorId],
    queryFn: () => apiClient.getVendorDetails(selectedVendorId!),
    enabled: !!selectedVendorId,
  })

  // Fetch NGO details
  const { data: ngoDetails, isLoading: ngoDetailsLoading } = useQuery({
    queryKey: ['ngo-details', selectedNgoId],
    queryFn: () => apiClient.getNgoDetails(selectedNgoId!),
    enabled: !!selectedNgoId,
  })

  // Fetch donor details
  const { data: donorDetails, isLoading: donorDetailsLoading } = useQuery({
    queryKey: ['donor-details', selectedDonorId],
    queryFn: () => apiClient.getDonorDetails(selectedDonorId!),
    enabled: !!selectedDonorId,
  })

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      return apiClient.createCategory(categoryData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setCreateCategoryOpen(false)
      setNewCategory({ name: '', description: '' })
    },
  })

  // Create cause mutation
  const createCauseMutation = useMutation({
    mutationFn: async (causeData: any) => {
      // Convert ngo_ids array to comma-separated string for backend
      const dataToSend = {
        ...causeData,
        ngo_ids: causeData.ngo_ids.join(',')
      }
      return apiClient.createCause(dataToSend)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-causes'] })
      queryClient.invalidateQueries({ queryKey: ['causes'] })
      setCreateCauseOpen(false)
      setNewCause({ title: '', description: '', target_amount: '', category_id: '', ngo_ids: [] })
    },
  })

  // Create NGO mutation
  const createNGOMutation = useMutation({
    mutationFn: async (ngoData: any) => {
      return apiClient.createNGO(ngoData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ngos'] })
      queryClient.invalidateQueries({ queryKey: ['ngos'] })
      setCreateNGOOpen(false)
      setNewNGO({ name: '', description: '', contact_email: '', website_url: '' })
    },
  })

  // Create vendor mutation
  const createVendorMutation = useMutation({
    mutationFn: async (vendorData: any) => {
      return apiClient.createVendor(vendorData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] })
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      setCreateVendorOpen(false)
      setNewVendor({ name: '', gstin: '', contact_email: '', phone: '', address: '' })
    },
  })

  // Create association mutation
  const createAssociationMutation = useMutation({
    mutationFn: async (associationData: any) => {
      return apiClient.createNgoVendorAssociation(
        parseInt(associationData.ngo_id),
        parseInt(associationData.vendor_id),
        parseInt(associationData.category_id)
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngo-vendor-associations'] })
      setCreateAssociationOpen(false)
      setNewAssociation({ ngo_id: '', vendor_id: '', category_id: '' })
    },
    onError: (error: any) => {
      console.error('Error creating association:', error)
      // You can add a toast notification here if you have one
      alert(error.response?.data?.detail || 'Failed to create association')
    },
  })

  // Delete association mutation
  const deleteAssociationMutation = useMutation({
    mutationFn: async (associationId: number) => {
      return apiClient.deleteNgoVendorAssociation(associationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngo-vendor-associations'] })
    },
  })

  // Approve cause mutation
  const approveCauseMutation = useMutation({
    mutationFn: async (causeId: number) => {
      return apiClient.approveCause(causeId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-causes'] })
    },
  })

  // Reject cause mutation
  const rejectCauseMutation = useMutation({
    mutationFn: async ({ causeId, reason }: { causeId: number, reason: string }) => {
      return apiClient.rejectCause(causeId, reason)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-causes'] })
    },
  })

  const handleCreateCategory = () => {
    createCategoryMutation.mutate(newCategory)
  }

  const handleCreateCause = () => {
    createCauseMutation.mutate(newCause)
  }

  const handleCreateNGO = () => {
    createNGOMutation.mutate(newNGO)
  }

  const handleCreateVendor = () => {
    createVendorMutation.mutate(newVendor)
  }

  const handleCreateAssociation = () => {
    createAssociationMutation.mutate(newAssociation)
  }

  const handleDeleteAssociation = (associationId: number) => {
    deleteAssociationMutation.mutate(associationId)
  }

  // Detail view handlers
  const handleViewVendorDetails = (vendorId: number) => {
    setSelectedVendorId(vendorId)
    setVendorDetailsOpen(true)
  }

  const handleViewNgoDetails = (ngoId: number) => {
    setSelectedNgoId(ngoId)
    setNgoDetailsOpen(true)
  }

  const handleViewDonorDetails = (donorId: number) => {
    setSelectedDonorId(donorId)
    setDonorDetailsOpen(true)
  }

  // Helper function to get available vendors for selected NGO and category
  const getAvailableVendors = () => {
    if (!newAssociation.ngo_id || !newAssociation.category_id) return vendors
    
    const existingAssociations = associations.filter(assoc => 
      assoc.ngo_id === parseInt(newAssociation.ngo_id) && 
      assoc.category_id === parseInt(newAssociation.category_id)
    )
    
    const usedVendorIds = existingAssociations.map(assoc => assoc.vendor_id)
    return vendors.filter(vendor => !usedVendorIds.includes(vendor.id))
  }

  // Helper function to get available categories for selected NGO and vendor
  const getAvailableCategories = () => {
    if (!newAssociation.ngo_id || !newAssociation.vendor_id) return categories
    
    const existingAssociations = associations.filter(assoc => 
      assoc.ngo_id === parseInt(newAssociation.ngo_id) && 
      assoc.vendor_id === parseInt(newAssociation.vendor_id)
    )
    
    const usedCategoryIds = existingAssociations.map(assoc => assoc.category_id)
    return categories.filter(category => !usedCategoryIds.includes(category.id))
  }

  // Helper function to get available NGOs for selected vendor and category
  const getAvailableNGOs = () => {
    if (!newAssociation.vendor_id || !newAssociation.category_id) return ngos
    
    const existingAssociations = associations.filter(assoc => 
      assoc.vendor_id === parseInt(newAssociation.vendor_id) && 
      assoc.category_id === parseInt(newAssociation.category_id)
    )
    
    const usedNgoIds = existingAssociations.map(assoc => assoc.ngo_id)
    return ngos.filter(ngo => !usedNgoIds.includes(ngo.id))
  }

  const TabPanel = ({ children, value, index }: { children: React.ReactNode, value: number, index: number }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )

  return (
    <Box sx={{ backgroundColor: '#F7F7F7', minHeight: '100vh', py: 3 }}>
      <Container maxWidth="xl">
        {/* Dashboard Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Admin Console
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage platform operations, approve receipts, and monitor system health
          </Typography>
        </Box>

        {/* Key Metrics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: '#F9FAFB',
              color: '#1F2937',
              border: '1px solid #E5E7EB',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      ₹{paymentSummary.total_donations?.toLocaleString() || '0'}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Donations
                    </Typography>
                  </Box>
                  <AttachMoney sx={{ fontSize: 40, opacity: 0.9 }} />
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {paymentSummary.monthly_stats?.growth_percentage ? `+${paymentSummary.monthly_stats.growth_percentage}% from last month` : '+0% from last month'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
              color: '#1F2937',
              border: '1px solid #D1D5DB',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {pendingCauses.length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Pending Causes
                    </Typography>
                  </Box>
                  <CheckCircle sx={{ fontSize: 40, opacity: 0.9 }} />
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Awaiting approval
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
              color: '#1F2937',
              border: '1px solid #D1D5DB',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {categories.length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Active Categories
                    </Typography>
                  </Box>
                  <Category sx={{ fontSize: 40, opacity: 0.9 }} />
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    +1 this month
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
              color: '#1F2937',
              border: '1px solid #D1D5DB',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {vendors.length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Registered Vendors
                    </Typography>
                  </Box>
                  <Store sx={{ fontSize: 40, opacity: 0.9 }} />
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Service providers
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Workflow Overview */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1F2937' }}>
              📋 Complete Workflow Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#F3F4F6', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#059669' }}>1</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Categories</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {categories.length} categories defined
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Food & Nutrition, Education, Healthcare, Emergency Relief, Women & Children
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#F3F4F6', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2563EB' }}>2</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>NGOs</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {ngos.length} registered NGOs
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Hope Trust, Care Works, Health First Foundation
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#F3F4F6', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#7C3AED' }}>3</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Vendors</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {vendors.length} registered vendors
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Alpha Supplies, Beta Medical, Gamma Educational
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#F3F4F6', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#DC2626' }}>4</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Causes</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pendingCauses.length} pending approval
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Only approved causes visible to donors
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1F2937' }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<CheckCircle />}
                  sx={{ 
                    backgroundColor: '#059669',
                    py: 1.5,
                    fontWeight: 'bold',
                    '&:hover': { backgroundColor: '#047857' }
                  }}
                  onClick={() => setCreateCauseOpen(true)}
                >
                  Approve Causes
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AccountBalance />}
                  sx={{ 
                    backgroundColor: '#2563EB',
                    py: 1.5,
                    fontWeight: 'bold',
                    '&:hover': { backgroundColor: '#1D4ED8' }
                  }}
                  onClick={() => setTabValue(1)}
                >
                  Manage NGOs
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Store />}
                  sx={{ 
                    backgroundColor: '#7C3AED',
                    py: 1.5,
                    fontWeight: 'bold',
                    '&:hover': { backgroundColor: '#6D28D9' }
                  }}
                  onClick={() => setTabValue(2)}
                >
                  Manage Vendors
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Category />}
                  sx={{ 
                    backgroundColor: '#DC2626',
                    py: 1.5,
                    fontWeight: 'bold',
                    '&:hover': { backgroundColor: '#B91C1C' }
                  }}
                  onClick={() => setTabValue(4)}
                >
                  Manage Categories
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Account Reconciliation */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1F2937' }}>
              💰 Account Reconciliation & Reporting
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Financial Summary
                </Typography>
                <Box sx={{ backgroundColor: '#F9FAFB', p: 2, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Total Received:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      ₹{paymentSummary.reconciliation?.total_received?.toLocaleString() || '0'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Total Disbursed:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      ₹{paymentSummary.reconciliation?.total_disbursed?.toLocaleString() || '0'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Platform Commission:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      ₹{paymentSummary.reconciliation?.platform_commission?.toLocaleString() || '0'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Pending Disbursements:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#DC2626' }}>
                      ₹{paymentSummary.reconciliation?.pending_disbursements?.toLocaleString() || '0'}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Account Balance:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#059669' }}>
                      ₹{paymentSummary.reconciliation?.account_balance?.toLocaleString() || '0'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Category Breakdown
                </Typography>
                <Box sx={{ backgroundColor: '#F9FAFB', p: 2, borderRadius: 2 }}>
                  {paymentSummary.category_breakdown && Object.entries(paymentSummary.category_breakdown).map(([category, amount]) => (
                    <Box key={category} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{category}:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        ₹{(amount as number).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Last Reconciliation: {paymentSummary.reconciliation?.last_reconciliation ? 
                  new Date(paymentSummary.reconciliation.last_reconciliation).toLocaleString() : 'Never'}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1F2937' }}>
                  Recent Activity
                </Typography>
                <List>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ backgroundColor: '#059669' }}>
                        <CheckCircle />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Receipt approved for Hope Trust"
                      secondary="2 hours ago"
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ backgroundColor: '#2563EB' }}>
                        <Verified />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="New NGO registered: Care Works"
                      secondary="4 hours ago"
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ backgroundColor: '#7C3AED' }}>
                        <Category />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="New category added: Environment"
                      secondary="1 day ago"
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1F2937' }}>
                  System Health
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>Database Performance</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#059669' }}>98%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={98}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: '#E5E7EB',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#059669'
                      }
                    }}
                  />
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>API Response Time</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2563EB' }}>45ms</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={85}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: '#E5E7EB',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#2563EB'
                      }
                    }}
                  />
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>Storage Usage</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#7C3AED' }}>67%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={67}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: '#E5E7EB',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#7C3AED'
                      }
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Security sx={{ color: '#059669' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    All systems operational
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label="Pending Causes" icon={<CheckCircle />} iconPosition="start" />
              <Tab label="NGOs" icon={<AccountBalance />} iconPosition="start" />
              <Tab label="Vendors" icon={<Store />} iconPosition="start" />
              <Tab label="Donors" icon={<Person />} iconPosition="start" />
              <Tab label="Categories" icon={<Category />} iconPosition="start" />
              <Tab label="NGO-Vendor Associations" icon={<Verified />} iconPosition="start" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Causes Pending Approval
              </Typography>
              <Button
                variant="contained"
                startIcon={<CheckCircle />}
                onClick={() => setCreateCauseOpen(true)}
                sx={{ backgroundColor: '#059669', '&:hover': { backgroundColor: '#047857' } }}
              >
                Create Cause
              </Button>
            </Box>

            <DataTable
              rows={pendingCauses}
              columns={[
                { field: 'id', headerName: 'ID', width: 80 },
                { field: 'title', headerName: 'Cause Title', width: 200 },
                { field: 'ngo_names', headerName: 'NGOs', width: 200, renderCell: (params: any) => 
                  Array.isArray(params.value) ? params.value.join(', ') : params.value
                },
                { field: 'category_name', headerName: 'Category', width: 150 },
                { field: 'target_amount', headerName: 'Target Amount', width: 150, renderCell: (params: any) => 
                  `₹${params.value?.toLocaleString() || '0'}`
                },
                { field: 'status', headerName: 'Status', width: 150, renderCell: (params: any) => (
                  <Chip 
                    label={params.value} 
                    color={params.value === 'PENDING_APPROVAL' ? 'warning' : 'default'}
                    size="small"
                  />
                )},
                { field: 'created_at', headerName: 'Created', width: 150, renderCell: (params: any) => 
                  new Date(params.value).toLocaleDateString()
                },
              ]}
              actions={[
                {
                  icon: <CheckCircle />,
                  label: 'Approve',
                  onClick: (params: any) => {
                    approveCauseMutation.mutate(params.id)
                  }
                },
                {
                  icon: <Cancel />,
                  label: 'Reject',
                  onClick: (params: any) => {
                    const reason = prompt('Reason for rejection:')
                    if (reason) {
                      rejectCauseMutation.mutate({ causeId: params.id, reason })
                    }
                  }
                }
              ]}
              loading={pendingCausesLoading}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Registered NGOs
              </Typography>
              <Button
                variant="contained"
                startIcon={<AccountBalance />}
                onClick={() => setCreateNGOOpen(true)}
                sx={{ backgroundColor: '#059669', '&:hover': { backgroundColor: '#047857' } }}
              >
                Add NGO
              </Button>
            </Box>

            <DataTable
              rows={ngos}
              columns={[
                { field: 'id', headerName: 'ID', width: 80 },
                { field: 'name', headerName: 'NGO Name', width: 200 },
                { field: 'contact_email', headerName: 'Email', width: 200 },
                { field: 'status', headerName: 'Status', width: 120, renderCell: (params: any) => (
                  <Chip 
                    label={params.value} 
                    color={params.value === 'ACTIVE' ? 'success' : 'default'}
                    size="small"
                  />
                )},
                { field: 'total_donations', headerName: 'Total Donations', width: 150, renderCell: (params: any) => 
                  `₹${params.value?.toLocaleString() || '0'}`
                },
                { field: 'total_causes', headerName: 'Causes', width: 100 },
                { field: 'verified', headerName: 'Verified', width: 100, renderCell: (params: any) => 
                  params.value ? 'Yes' : 'No'
                },
                {
                  field: 'actions',
                  headerName: 'Actions',
                  width: 120,
                  renderCell: (params: any) => (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewNgoDetails(params.row.id)}
                      sx={{ mr: 1 }}
                    >
                      View Details
                    </Button>
                  )
                }
              ]}
              loading={ngosLoading}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Registered Vendors
              </Typography>
              <Button
                variant="contained"
                startIcon={<Store />}
                onClick={() => setCreateVendorOpen(true)}
                sx={{ backgroundColor: '#059669', '&:hover': { backgroundColor: '#047857' } }}
              >
                Add Vendor
              </Button>
            </Box>

            <DataTable
              rows={vendors}
              columns={[
                { field: 'id', headerName: 'ID', width: 80 },
                { field: 'name', headerName: 'Vendor Name', width: 200 },
                { field: 'gstin', headerName: 'GSTIN', width: 150 },
                { field: 'kyc_status', headerName: 'KYC Status', width: 120, renderCell: (params: any) => (
                  <Chip 
                    label={params.value} 
                    color={params.value === 'VERIFIED' ? 'success' : params.value === 'PENDING' ? 'warning' : 'default'}
                    size="small"
                  />
                )},
                { field: 'tenant_name', headerName: 'NGO', width: 150 },
                { field: 'total_invoices', headerName: 'Invoices', width: 100 },
                { field: 'total_amount', headerName: 'Total Amount', width: 150, renderCell: (params: any) => 
                  `₹${params.value?.toLocaleString() || '0'}`
                },
                {
                  field: 'actions',
                  headerName: 'Actions',
                  width: 120,
                  renderCell: (params: any) => (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewVendorDetails(params.row.id)}
                      sx={{ mr: 1 }}
                    >
                      View Details
                    </Button>
                  )
                }
              ]}
              loading={vendorsLoading}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Registered Donors
              </Typography>
            </Box>

            <DataTable
              rows={donors}
              columns={[
                { field: 'id', headerName: 'ID', width: 80 },
                { field: 'first_name', headerName: 'First Name', width: 150 },
                { field: 'last_name', headerName: 'Last Name', width: 150 },
                { field: 'email', headerName: 'Email', width: 200 },
                { field: 'phone', headerName: 'Phone', width: 150 },
                { field: 'total_donations', headerName: 'Total Donations', width: 150, renderCell: (params: any) => 
                  `₹${params.value?.toLocaleString() || '0'}`
                },
                { field: 'total_causes_supported', headerName: 'Causes Supported', width: 150 },
                { field: 'last_donation_date', headerName: 'Last Donation', width: 150, renderCell: (params: any) => 
                  params.value ? new Date(params.value).toLocaleDateString() : 'Never'
                },
                {
                  field: 'actions',
                  headerName: 'Actions',
                  width: 120,
                  renderCell: (params: any) => (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewDonorDetails(params.row.id)}
                      sx={{ mr: 1 }}
                    >
                      View Details
                    </Button>
                  )
                }
              ]}
              loading={donorsLoading}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Cause Categories
              </Typography>
              <Button
                variant="contained"
                startIcon={<Category />}
                onClick={() => setCreateCategoryOpen(true)}
                sx={{ backgroundColor: '#059669', '&:hover': { backgroundColor: '#047857' } }}
              >
                Add Category
              </Button>
            </Box>

            <Grid container spacing={2}>
              {categories.map((category) => (
                <Grid item xs={12} sm={6} md={4} key={category.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {category.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {category.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                NGO-Vendor Associations
              </Typography>
              <Button
                variant="contained"
                startIcon={<Verified />}
                onClick={() => setCreateAssociationOpen(true)}
                sx={{ backgroundColor: '#059669', '&:hover': { backgroundColor: '#047857' } }}
              >
                Create Association
              </Button>
            </Box>

            <DataTable
              rows={associations}
              columns={[
                { field: 'id', headerName: 'ID', width: 80 },
                { field: 'ngo_name', headerName: 'NGO', width: 200 },
                { field: 'vendor_name', headerName: 'Vendor', width: 200 },
                { field: 'category_name', headerName: 'Category', width: 150 },
                { field: 'status', headerName: 'Status', width: 120, renderCell: (params: any) => (
                  <Chip 
                    label={params.value} 
                    color={params.value === 'ACTIVE' ? 'success' : 'default'}
                    size="small"
                  />
                )},
                { field: 'created_at', headerName: 'Created', width: 150, renderCell: (params: any) => 
                  new Date(params.value).toLocaleDateString()
                },
                { 
                  field: 'actions', 
                  headerName: 'Actions', 
                  width: 120, 
                  renderCell: (params: any) => (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeleteAssociation(params.row.id)}
                      disabled={deleteAssociationMutation.isPending}
                    >
                      Delete
                    </Button>
                  )
                }
              ]}
              loading={associationsLoading}
            />
          </TabPanel>
        </Card>

        {/* Create Category Dialog */}
        <Dialog open={createCategoryOpen} onClose={() => setCreateCategoryOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Category</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Category Name"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateCategoryOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateCategory} 
              variant="contained"
              disabled={createCategoryMutation.isPending || !newCategory.name}
            >
              {createCategoryMutation.isPending ? <CircularProgress size={20} /> : 'Create Category'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Cause Dialog */}
        <Dialog open={createCauseOpen} onClose={() => setCreateCauseOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Cause</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Cause Title"
              value={newCause.title}
              onChange={(e) => setNewCause({ ...newCause, title: e.target.value })}
              sx={{ mb: 2 }}
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
              label="Target Amount (₹)"
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
                label="Category"
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>NGOs (Select Multiple)</InputLabel>
              <Select
                multiple
                value={newCause.ngo_ids}
                onChange={(e) => setNewCause({ ...newCause, ngo_ids: e.target.value as number[] })}
                label="NGOs (Select Multiple)"
                renderValue={(selected) => {
                  const selectedNGOs = ngos.filter(ngo => selected.includes(ngo.id))
                  return selectedNGOs.map(ngo => ngo.name).join(', ')
                }}
              >
                {ngos.map((ngo) => (
                  <MenuItem key={ngo.id} value={ngo.id}>
                    {ngo.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateCauseOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateCause} 
              variant="contained"
              disabled={createCauseMutation.isPending || !newCause.title || !newCause.category_id || newCause.ngo_ids.length === 0}
            >
              {createCauseMutation.isPending ? <CircularProgress size={20} /> : 'Create Cause'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create NGO Dialog */}
        <Dialog open={createNGOOpen} onClose={() => setCreateNGOOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New NGO</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="NGO Name"
              value={newNGO.name}
              onChange={(e) => setNewNGO({ ...newNGO, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={newNGO.description}
              onChange={(e) => setNewNGO({ ...newNGO, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Contact Email"
              type="email"
              value={newNGO.contact_email}
              onChange={(e) => setNewNGO({ ...newNGO, contact_email: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Website URL"
              value={newNGO.website_url}
              onChange={(e) => setNewNGO({ ...newNGO, website_url: e.target.value })}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateNGOOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateNGO} 
              variant="contained"
              disabled={createNGOMutation.isPending || !newNGO.name || !newNGO.contact_email}
            >
              {createNGOMutation.isPending ? <CircularProgress size={20} /> : 'Create NGO'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Vendor Dialog */}
        <Dialog open={createVendorOpen} onClose={() => setCreateVendorOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Vendor</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Vendor Name"
              value={newVendor.name}
              onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="GSTIN"
              value={newVendor.gstin}
              onChange={(e) => setNewVendor({ ...newVendor, gstin: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Contact Email"
              type="email"
              value={newVendor.contact_email}
              onChange={(e) => setNewVendor({ ...newVendor, contact_email: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Phone"
              value={newVendor.phone}
              onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Address"
              multiline
              rows={3}
              value={newVendor.address}
              onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateVendorOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateVendor} 
              variant="contained"
              disabled={createVendorMutation.isPending || !newVendor.name || !newVendor.contact_email}
            >
              {createVendorMutation.isPending ? <CircularProgress size={20} /> : 'Create Vendor'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Association Dialog */}
        <Dialog open={createAssociationOpen} onClose={() => setCreateAssociationOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create NGO-Vendor Association</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>NGO</InputLabel>
              <Select
                value={newAssociation.ngo_id}
                onChange={(e) => {
                  const ngoId = e.target.value
                  setNewAssociation({ 
                    ngo_id: ngoId, 
                    vendor_id: '', 
                    category_id: '' 
                  })
                }}
                label="NGO"
              >
                {getAvailableNGOs().map((ngo) => (
                  <MenuItem key={ngo.id} value={ngo.id}>
                    {ngo.name}
                  </MenuItem>
                ))}
                {getAvailableNGOs().length === 0 && (
                  <MenuItem disabled>
                    No available NGOs for this vendor-category combination
                  </MenuItem>
                )}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Vendor</InputLabel>
              <Select
                value={newAssociation.vendor_id}
                onChange={(e) => {
                  const vendorId = e.target.value
                  setNewAssociation({ 
                    ...newAssociation, 
                    vendor_id: vendorId,
                    category_id: '' // Reset category when vendor changes
                  })
                }}
                label="Vendor"
                disabled={!newAssociation.ngo_id}
              >
                {getAvailableVendors().map((vendor) => (
                  <MenuItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </MenuItem>
                ))}
                {getAvailableVendors().length === 0 && newAssociation.ngo_id && newAssociation.category_id && (
                  <MenuItem disabled>
                    No available vendors for this NGO-category combination
                  </MenuItem>
                )}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={newAssociation.category_id}
                onChange={(e) => setNewAssociation({ ...newAssociation, category_id: e.target.value })}
                label="Category"
                disabled={!newAssociation.ngo_id || !newAssociation.vendor_id}
              >
                {getAvailableCategories().map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
                {getAvailableCategories().length === 0 && newAssociation.ngo_id && newAssociation.vendor_id && (
                  <MenuItem disabled>
                    No available categories for this NGO-vendor combination
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateAssociationOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateAssociation} 
              variant="contained"
              disabled={createAssociationMutation.isPending || !newAssociation.ngo_id || !newAssociation.vendor_id || !newAssociation.category_id}
            >
              {createAssociationMutation.isPending ? <CircularProgress size={20} /> : 'Create Association'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Vendor Details Dialog */}
        <Dialog open={vendorDetailsOpen} onClose={() => setVendorDetailsOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>Vendor Details</DialogTitle>
          <DialogContent>
            {vendorDetailsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : vendorDetails ? (
              <Box>
                {/* Vendor Basic Info */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {vendorDetails.vendor.name}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">GSTIN:</Typography>
                        <Typography variant="body1">{vendorDetails.vendor.gstin}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">KYC Status:</Typography>
                        <Chip 
                          label={vendorDetails.vendor.kyc_status} 
                          color={vendorDetails.vendor.kyc_status === 'VERIFIED' ? 'success' : 'warning'}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">Email:</Typography>
                        <Typography variant="body1">{vendorDetails.vendor.contact_email}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">Phone:</Typography>
                        <Typography variant="body1">{vendorDetails.vendor.phone}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Address:</Typography>
                        <Typography variant="body1">{vendorDetails.vendor.address}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Financial Summary */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Financial Summary</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="text.secondary">Total Invoiced:</Typography>
                        <Typography variant="h6" color="primary">
                          ₹{vendorDetails.financial_summary.total_invoiced.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="text.secondary">Total Paid:</Typography>
                        <Typography variant="h6" color="success.main">
                          ₹{vendorDetails.financial_summary.total_paid.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="text.secondary">Total Pending:</Typography>
                        <Typography variant="h6" color="warning.main">
                          ₹{vendorDetails.financial_summary.total_pending.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Associated NGOs */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Associated NGOs</Typography>
                    {vendorDetails.associated_ngos.length > 0 ? (
                      <DataTable
                        rows={vendorDetails.associated_ngos}
                        columns={[
                          { field: 'ngo_name', headerName: 'NGO Name', width: 200 },
                          { field: 'category_name', headerName: 'Category', width: 150 },
                          { field: 'association_created_at', headerName: 'Associated Since', width: 150, renderCell: (params: any) =>
                            new Date(params.value).toLocaleDateString()
                          }
                        ]}
                        loading={false}
                        getRowId={(row) => `${row.ngo_id}-${row.category_id}`}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">No associated NGOs</Typography>
                    )}
                  </CardContent>
                </Card>

                {/* Invoices */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Invoice History</Typography>
                    {vendorDetails.invoices.length > 0 ? (
                      <DataTable
                        rows={vendorDetails.invoices}
                        columns={[
                          { field: 'invoice_number', headerName: 'Invoice #', width: 150 },
                          { field: 'ngo_name', headerName: 'NGO', width: 150 },
                          { field: 'cause_title', headerName: 'Cause', width: 200 },
                          { field: 'amount', headerName: 'Amount', width: 120, renderCell: (params: any) =>
                            `₹${params.value.toLocaleString()}`
                          },
                          { field: 'status', headerName: 'Status', width: 100, renderCell: (params: any) => (
                            <Chip 
                              label={params.value} 
                              color={params.value === 'PAID' ? 'success' : 'warning'}
                              size="small"
                            />
                          )},
                          { field: 'created_at', headerName: 'Created', width: 120, renderCell: (params: any) =>
                            new Date(params.value).toLocaleDateString()
                          },
                          { field: 'paid_at', headerName: 'Paid', width: 120, renderCell: (params: any) =>
                            params.value ? new Date(params.value).toLocaleDateString() : '-'
                          }
                        ]}
                        loading={false}
                        getRowId={(row) => row.id.toString()}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">No invoices found</Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            ) : (
              <Typography>No vendor details available</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setVendorDetailsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* NGO Details Dialog */}
        <Dialog open={ngoDetailsOpen} onClose={() => setNgoDetailsOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>NGO Details</DialogTitle>
          <DialogContent>
            {ngoDetailsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : ngoDetails ? (
              <Box>
                {/* NGO Basic Info */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <img 
                        src={ngoDetails.ngo.logo_url} 
                        alt={ngoDetails.ngo.name}
                        style={{ width: 80, height: 80, borderRadius: 8, marginRight: 16 }}
                      />
                      <Box>
                        <Typography variant="h5" gutterBottom>
                          {ngoDetails.ngo.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {ngoDetails.ngo.description}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">Registration Number:</Typography>
                        <Typography variant="body1">{ngoDetails.ngo.registration_number}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">PAN Number:</Typography>
                        <Typography variant="body1">{ngoDetails.ngo.pan_number}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">Contact Person:</Typography>
                        <Typography variant="body1">{ngoDetails.ngo.contact_person}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">Phone:</Typography>
                        <Typography variant="body1">{ngoDetails.ngo.phone}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">Email:</Typography>
                        <Typography variant="body1">{ngoDetails.ngo.contact_email}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">Website:</Typography>
                        <Typography variant="body1">
                          <a href={ngoDetails.ngo.website_url} target="_blank" rel="noopener noreferrer">
                            {ngoDetails.ngo.website_url}
                          </a>
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Address:</Typography>
                        <Typography variant="body1">{ngoDetails.ngo.address}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">Status:</Typography>
                        <Chip 
                          label={ngoDetails.ngo.status} 
                          color={ngoDetails.ngo.status === 'ACTIVE' ? 'success' : 'default'}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">Verified:</Typography>
                        <Chip 
                          label={ngoDetails.ngo.verified ? 'Yes' : 'No'} 
                          color={ngoDetails.ngo.verified ? 'success' : 'default'}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Photo Gallery */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Photo Gallery</Typography>
                    <Grid container spacing={2}>
                      {ngoDetails.ngo.photo_gallery?.map((photo: string, index: number) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                          <img 
                            src={photo} 
                            alt={`Gallery ${index + 1}`}
                            style={{ 
                              width: '100%', 
                              height: 200, 
                              objectFit: 'cover', 
                              borderRadius: 8,
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(photo, '_blank')}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>

                {/* Bank Details */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Bank Details</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">Bank Name:</Typography>
                        <Typography variant="body1">{ngoDetails.ngo.bank_details?.bank_name}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">Account Number:</Typography>
                        <Typography variant="body1">{ngoDetails.ngo.bank_details?.account_number}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">IFSC Code:</Typography>
                        <Typography variant="body1">{ngoDetails.ngo.bank_details?.ifsc_code}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">Branch:</Typography>
                        <Typography variant="body1">{ngoDetails.ngo.bank_details?.branch}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Financial Summary */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Financial Summary</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary">Total Donations:</Typography>
                        <Typography variant="h6" color="primary">
                          ₹{ngoDetails.financial_summary.total_donations_received.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary">Target Amount:</Typography>
                        <Typography variant="h6" color="info.main">
                          ₹{ngoDetails.financial_summary.total_target_amount.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary">Progress:</Typography>
                        <Typography variant="h6" color="success.main">
                          {ngoDetails.financial_summary.funding_progress_percentage.toFixed(1)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary">Active Causes:</Typography>
                        <Typography variant="h6" color="warning.main">
                          {ngoDetails.financial_summary.active_causes}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Associated Vendors */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Associated Vendors</Typography>
                    {ngoDetails.associated_vendors.length > 0 ? (
                      <DataTable
                        rows={ngoDetails.associated_vendors}
                        columns={[
                          { field: 'vendor_name', headerName: 'Vendor Name', width: 200 },
                          { field: 'category_name', headerName: 'Category', width: 150 },
                          { field: 'association_created_at', headerName: 'Associated Since', width: 150, renderCell: (params: any) =>
                            new Date(params.value).toLocaleDateString()
                          }
                        ]}
                        loading={false}
                        getRowId={(row) => `${row.vendor_id}-${row.category_id}`}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">No associated vendors</Typography>
                    )}
                  </CardContent>
                </Card>

                {/* Causes */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Active Causes</Typography>
                    {ngoDetails.causes.length > 0 ? (
                      <DataTable
                        rows={ngoDetails.causes}
                        columns={[
                          { field: 'title', headerName: 'Cause Title', width: 200 },
                          { field: 'category_name', headerName: 'Category', width: 150 },
                          { field: 'status', headerName: 'Status', width: 120, renderCell: (params: any) => (
                            <Chip 
                              label={params.value} 
                              color={params.value === 'LIVE' ? 'success' : params.value === 'FUNDED' ? 'primary' : 'default'}
                              size="small"
                            />
                          )},
                          { field: 'current_amount', headerName: 'Raised', width: 120, renderCell: (params: any) =>
                            `₹${params.value.toLocaleString()}`
                          },
                          { field: 'target_amount', headerName: 'Target', width: 120, renderCell: (params: any) =>
                            `₹${params.value.toLocaleString()}`
                          }
                        ]}
                        loading={false}
                        getRowId={(row) => row.id.toString()}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">No causes found</Typography>
                    )}
                  </CardContent>
                </Card>

                {/* Invoices */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Invoice History</Typography>
                    {ngoDetails.invoices.length > 0 ? (
                      <DataTable
                        rows={ngoDetails.invoices}
                        columns={[
                          { field: 'invoice_number', headerName: 'Invoice #', width: 150 },
                          { field: 'vendor_name', headerName: 'Vendor', width: 150 },
                          { field: 'cause_title', headerName: 'Cause', width: 200 },
                          { field: 'amount', headerName: 'Amount', width: 120, renderCell: (params: any) =>
                            `₹${params.value.toLocaleString()}`
                          },
                          { field: 'status', headerName: 'Status', width: 100, renderCell: (params: any) => (
                            <Chip 
                              label={params.value} 
                              color={params.value === 'PAID' ? 'success' : 'warning'}
                              size="small"
                            />
                          )},
                          { field: 'created_at', headerName: 'Created', width: 120, renderCell: (params: any) =>
                            new Date(params.value).toLocaleDateString()
                          },
                          { field: 'paid_at', headerName: 'Paid', width: 120, renderCell: (params: any) =>
                            params.value ? new Date(params.value).toLocaleDateString() : '-'
                          }
                        ]}
                        loading={false}
                        getRowId={(row) => row.id.toString()}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">No invoices found</Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            ) : (
              <Typography>No NGO details available</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNgoDetailsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Donor Details Dialog */}
        <Dialog open={donorDetailsOpen} onClose={() => setDonorDetailsOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>Donor Details</DialogTitle>
          <DialogContent>
            {donorDetailsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : donorDetails ? (
              <Box>
                {/* Donor Basic Info */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {donorDetails.donor.name}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">Email:</Typography>
                        <Typography variant="body1">{donorDetails.donor.email}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">Phone:</Typography>
                        <Typography variant="body1">{donorDetails.donor.phone}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Address:</Typography>
                        <Typography variant="body1">{donorDetails.donor.address}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">PAN Number:</Typography>
                        <Typography variant="body1">{donorDetails.donor.pan_number}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">Tax Exemption:</Typography>
                        <Chip 
                          label={donorDetails.donor.tax_exemption ? 'Yes' : 'No'} 
                          color={donorDetails.donor.tax_exemption ? 'success' : 'default'}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Donation Summary */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Donation Summary</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary">Total Donations:</Typography>
                        <Typography variant="h6" color="primary">
                          ₹{donorDetails.donor.total_donations.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary">Donation Count:</Typography>
                        <Typography variant="h6" color="info.main">
                          {donorDetails.donor.donation_count}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary">Last Donation:</Typography>
                        <Typography variant="h6" color="success.main">
                          {donorDetails.donor.last_donation_date ? 
                            new Date(donorDetails.donor.last_donation_date).toLocaleDateString() : 'Never'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary">Payment Methods:</Typography>
                        <Typography variant="body1">
                          {donorDetails.donor.payment_methods?.join(', ')}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">Preferred Categories:</Typography>
                      <Box sx={{ mt: 1 }}>
                        {donorDetails.donor.preferred_categories?.map((category: string, index: number) => (
                          <Chip key={index} label={category} size="small" sx={{ mr: 1, mb: 1 }} />
                        ))}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Donation History */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Donation History</Typography>
                    {donorDetails.donor.donation_history?.length > 0 ? (
                      <DataTable
                        rows={donorDetails.donor.donation_history}
                        columns={[
                          { field: 'cause_title', headerName: 'Cause', width: 200 },
                          { field: 'ngo_name', headerName: 'NGO', width: 150 },
                          { field: 'amount', headerName: 'Amount', width: 120, renderCell: (params: any) =>
                            `₹${params.value.toLocaleString()}`
                          },
                          { field: 'status', headerName: 'Status', width: 100, renderCell: (params: any) => (
                            <Chip 
                              label={params.value} 
                              color={params.value === 'COMPLETED' ? 'success' : 'warning'}
                              size="small"
                            />
                          )},
                          { field: 'date', headerName: 'Date', width: 120, renderCell: (params: any) =>
                            new Date(params.value).toLocaleDateString()
                          }
                        ]}
                        loading={false}
                        getRowId={(row) => row.id.toString()}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">No donation history found</Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            ) : (
              <Typography>No donor details available</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDonorDetailsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  )
}

export default AdminConsole
