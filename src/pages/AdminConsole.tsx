import React, { useState, useEffect } from 'react'
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
  Snackbar,
  Alert,
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
  LockReset,
  AdminPanelSettings,
  Pending,
  TrendingUp,
  Email,
  Settings,
  Payment,
  CloudUpload,
  Image,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import DataTable from '../components/DataTable'

const AdminConsole: React.FC = () => {
  const queryClient = useQueryClient()
  const [tabValue, setTabValue] = useState(0)
  const [causeFilter, setCauseFilter] = useState<string>('all')
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

  // Password reset state
  const [passwordResetOpen, setPasswordResetOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')

  // Create user state
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: '',
    password: '',
    ngo_id: '',
    vendor_id: ''
  })

  // Edit user state
  const [editUserOpen, setEditUserOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editUserData, setEditUserData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: '',
    ngo_id: '',
    vendor_id: ''
  })

  // Email settings state
  const [emailSettings, setEmailSettings] = useState({
    smtp_host: '',
    smtp_port: 465,
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'SSL',
    from_email: '',
    from_name: ''
  })

  // Website settings state
  const [websiteSettings, setWebsiteSettings] = useState({
    app_name: '',
    app_title: '',
    logo_url: '',
    favicon_url: '',
    primary_color: '',
    secondary_color: '',
    footer_text: '',
    contact_email: '',
    contact_phone: '',
    address: ''
  })

  // Email sending state
  const [sendEmailOpen, setSendEmailOpen] = useState(false)
  const [emailType, setEmailType] = useState('')
  const [emailData, setEmailData] = useState({
    user_email: '',
    user_role: '',
    donor_name: '',
    cause_title: '',
    amount: '',
    transaction_id: ''
  })

  // Professional notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  })

  // File upload state
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [faviconPreview, setFaviconPreview] = useState<string>('')

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
  const { data: pendingCauses = [] } = useQuery({
    queryKey: ['admin-pending-causes'],
    queryFn: () => apiClient.getPendingCauses(),
  })

  // Fetch all causes (active, inactive, pending) for Platform Admin
  const { data: allCauses = [], isLoading: allCausesLoading } = useQuery({
    queryKey: ['admin-all-causes'],
    queryFn: () => apiClient.getAdminCauses(),
  })

  // Filter causes based on selected filter
  const filteredCauses = React.useMemo(() => {
    if (causeFilter === 'all') return allCauses
    if (causeFilter === 'active') return allCauses.filter(c => c.status === 'LIVE')
    if (causeFilter === 'pending') return allCauses.filter(c => c.status === 'PENDING_APPROVAL')
    return allCauses
  }, [allCauses, causeFilter])

  // Fetch NGO-Vendor associations
  const { data: associations = [], isLoading: associationsLoading } = useQuery({
    queryKey: ['ngo-vendor-associations'],
    queryFn: () => apiClient.getNgoVendorAssociations(),
  })

  // Fetch admin users
  const { data: adminUsers = [], isLoading: adminUsersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiClient.getAdminUsers(),
  })

  // Fetch email settings
  const { data: emailSettingsData } = useQuery({
    queryKey: ['emailSettings'],
    queryFn: () => apiClient.getEmailSettings(),
  })

  // Fetch website settings
  const { data: websiteSettingsData } = useQuery({
    queryKey: ['websiteSettings'],
    queryFn: () => apiClient.getWebsiteSettings(),
  })

  // Update settings when data is fetched
  useEffect(() => {
    if (emailSettingsData) {
      setEmailSettings(emailSettingsData)
    }
  }, [emailSettingsData])

  useEffect(() => {
    if (websiteSettingsData) {
      setWebsiteSettings(websiteSettingsData)
    }
  }, [websiteSettingsData])

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
      showNotification(error.response?.data?.detail || 'Failed to create association', 'error')
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

  // Password reset mutation
  const passwordResetMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number, newPassword: string }) => {
      return apiClient.resetUserPassword(userId, newPassword)
    },
    onSuccess: () => {
      setPasswordResetOpen(false)
      setNewPassword('')
      setSelectedUserId(null)
      showNotification('Password reset successfully!', 'success')
    },
    onError: (error: any) => {
      showNotification(error.response?.data?.detail || 'Failed to reset password', 'error')
    },
  })

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return apiClient.createUser(userData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setCreateUserOpen(false)
      setNewUser({ email: '', first_name: '', last_name: '', role: '', password: '', ngo_id: '', vendor_id: '' })
      showNotification('User created successfully!', 'success')
    },
    onError: (error: any) => {
      showNotification(error.response?.data?.detail || 'Failed to create user', 'error')
    },
  })

  // Edit user mutation
  const editUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: number, userData: any }) => {
      return apiClient.updateUser(userId, userData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setEditUserOpen(false)
      setEditingUser(null)
      setEditUserData({ email: '', first_name: '', last_name: '', role: '', ngo_id: '', vendor_id: '' })
      showNotification('User updated successfully!', 'success')
    },
    onError: (error: any) => {
      showNotification(error.response?.data?.detail || 'Failed to update user', 'error')
    },
  })

  // Update email settings mutation
  const updateEmailSettingsMutation = useMutation({
    mutationFn: (data: any) => apiClient.updateEmailSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailSettings'] })
      showNotification('Email settings updated successfully!', 'success')
    },
    onError: (error: any) => {
      showNotification(error.response?.data?.detail || 'Failed to update email settings', 'error')
    }
  })

  // Update website settings mutation
  const updateWebsiteSettingsMutation = useMutation({
    mutationFn: (data: any) => apiClient.updateWebsiteSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['websiteSettings'] })
      showNotification('Website settings updated successfully!', 'success')
    },
    onError: (error: any) => {
      showNotification(error.response?.data?.detail || 'Failed to update website settings', 'error')
    }
  })

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: (data: any) => {
      if (emailType === 'password-reset') {
        return apiClient.sendPasswordResetEmail(data.user_email)
      } else if (emailType === 'welcome') {
        return apiClient.sendWelcomeEmail(data.user_email, data.user_role)
      } else if (emailType === 'donation-invoice') {
        return apiClient.sendDonationInvoice(
          data.user_email,
          data.donor_name,
          data.cause_title,
          parseFloat(data.amount),
          data.transaction_id
        )
      }
      return Promise.resolve()
    },
    onSuccess: () => {
      setSendEmailOpen(false)
      setEmailData({
        user_email: '',
        user_role: '',
        donor_name: '',
        cause_title: '',
        amount: '',
        transaction_id: ''
      })
      showNotification('Email sent successfully!', 'success')
    },
    onError: (error: any) => {
      console.error('Email sending error:', error)
      let errorMessage = 'Failed to send email'
      
      if (error?.response?.data?.detail) {
        errorMessage = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : JSON.stringify(error.response.data.detail)
      } else if (error?.message) {
        errorMessage = typeof error.message === 'string' 
          ? error.message 
          : JSON.stringify(error.message)
      } else if (error) {
        errorMessage = typeof error === 'string' 
          ? error 
          : JSON.stringify(error)
      }
      
      showNotification(errorMessage, 'error')
    }
  })

  // File upload mutations
  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => apiClient.uploadLogo(file),
    onSuccess: (data) => {
      setWebsiteSettings(prev => ({ ...prev, logo_url: data.url }))
      showNotification('Logo uploaded successfully!', 'success')
    },
    onError: (error: any) => {
      showNotification(error.response?.data?.detail || 'Failed to upload logo', 'error')
    }
  })

  const uploadFaviconMutation = useMutation({
    mutationFn: (file: File) => apiClient.uploadFavicon(file),
    onSuccess: (data) => {
      setWebsiteSettings(prev => ({ ...prev, favicon_url: data.url }))
      showNotification('Favicon uploaded successfully!', 'success')
    },
    onError: (error: any) => {
      showNotification(error.response?.data?.detail || 'Failed to upload favicon', 'error')
    }
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

  // Password reset handlers
  const handlePasswordReset = (userId: number) => {
    setSelectedUserId(userId)
    setPasswordResetOpen(true)
  }

  const handleConfirmPasswordReset = () => {
    if (selectedUserId && newPassword) {
      passwordResetMutation.mutate({ userId: selectedUserId, newPassword })
    }
  }

  const handleCreateUser = () => {
    createUserMutation.mutate(newUser)
  }

  const handleEditUser = (user: any) => {
    setEditingUser(user)
    setEditUserData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      ngo_id: user.ngo_name || '',
      vendor_id: user.vendor_name || ''
    })
    setEditUserOpen(true)
  }

  const handleUpdateUser = () => {
    if (editingUser) {
      editUserMutation.mutate({ userId: editingUser.id, userData: editUserData })
    }
  }

  const handleUpdateEmailSettings = () => {
    updateEmailSettingsMutation.mutate(emailSettings)
  }

  const handleUpdateWebsiteSettings = () => {
    updateWebsiteSettingsMutation.mutate(websiteSettings)
  }

  const handleSendEmail = () => {
    sendEmailMutation.mutate(emailData)
  }

  const handleOpenSendEmail = (type: string) => {
    setEmailType(type)
    setSendEmailOpen(true)
  }

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    })
  }

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }))
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        showNotification('Logo file size must be less than 2MB', 'error')
        return
      }
      
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      // Upload the file
      uploadLogoMutation.mutate(file)
    }
  }

  const handleFaviconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (1MB limit)
      if (file.size > 1 * 1024 * 1024) {
        showNotification('Favicon file size must be less than 1MB', 'error')
        return
      }
      
      setFaviconFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setFaviconPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      // Upload the file
      uploadFaviconMutation.mutate(file)
    }
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
                      Pending Approval
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
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#DC2626' }}>{allCauses.length}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Causes</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {allCauses.filter(c => c.status === 'LIVE').length} active, {pendingCauses.length} pending
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
              <Tab label="All Causes" icon={<CheckCircle />} iconPosition="start" />
              <Tab label="NGOs" icon={<AccountBalance />} iconPosition="start" />
              <Tab label="Vendors" icon={<Store />} iconPosition="start" />
              <Tab label="Donors" icon={<Person />} iconPosition="start" />
              <Tab label="User Management" icon={<AdminPanelSettings />} iconPosition="start" />
              <Tab label="Categories" icon={<Category />} iconPosition="start" />
              <Tab label="NGO-Vendor Associations" icon={<Verified />} iconPosition="start" />
              <Tab label="Email Settings" icon={<Email />} iconPosition="start" />
              <Tab label="Website Settings" icon={<Settings />} iconPosition="start" />
              <Tab label="Payment Settings" icon={<Payment />} iconPosition="start" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 3 }}>
              {/* Header Section */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Cause Management
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage all causes across the platform - Active, Pending, and Inactive
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<CheckCircle />}
                  onClick={() => setCreateCauseOpen(true)}
                  sx={{ 
                    backgroundColor: '#059669', 
                    '&:hover': { backgroundColor: '#047857' },
                    px: 3,
                    py: 1.5,
                    fontSize: '0.95rem',
                    fontWeight: 'bold'
                  }}
                >
                  Create New Cause
                </Button>
              </Box>

              {/* Statistics Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {allCauses.filter(c => c.status === 'LIVE').length}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                            Active Causes
                          </Typography>
                        </Box>
                        <CheckCircle sx={{ fontSize: 32, opacity: 0.9 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: 'white',
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                  }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {pendingCauses.length}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                            Pending Approval
                          </Typography>
                        </Box>
                        <Pending sx={{ fontSize: 32, opacity: 0.9 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                    color: 'white',
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                  }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {allCauses.length}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                            Total Causes
                          </Typography>
                        </Box>
                        <TrendingUp sx={{ fontSize: 32, opacity: 0.9 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                    color: 'white',
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                  }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            ₹{allCauses.reduce((sum, c) => sum + (c.current_amount || 0), 0).toLocaleString()}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                            Total Raised
                          </Typography>
                        </Box>
                        <AttachMoney sx={{ fontSize: 32, opacity: 0.9 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Causes Table */}
              <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {causeFilter === 'all' ? 'All Causes' : 
                       causeFilter === 'active' ? 'Active Causes' : 
                       causeFilter === 'pending' ? 'Pending Causes' : 'All Causes'} ({filteredCauses.length})
                    </Typography>
                    
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Filter by Status</InputLabel>
                      <Select
                        value={causeFilter}
                        label="Filter by Status"
                        onChange={(e) => setCauseFilter(e.target.value)}
                        sx={{ backgroundColor: 'white' }}
                      >
                        <MenuItem value="all">All Causes</MenuItem>
                        <MenuItem value="active">Active Only</MenuItem>
                        <MenuItem value="pending">Pending Only</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <DataTable
                    rows={filteredCauses}
                    columns={[
                      { field: 'id', headerName: 'ID', width: 70, headerAlign: 'center', align: 'center' },
                      { field: 'title', headerName: 'Cause Title', width: 250, headerAlign: 'left' },
                      { field: 'ngo_names', headerName: 'NGOs', width: 180, renderCell: (params: any) => 
                        Array.isArray(params.value) ? params.value.join(', ') : params.value
                      },
                      { field: 'category_name', headerName: 'Category', width: 140, headerAlign: 'center', align: 'center' },
                      { field: 'target_amount', headerName: 'Target', width: 120, renderCell: (params: any) => 
                        `₹${params.value?.toLocaleString() || '0'}`, headerAlign: 'right', align: 'right'
                      },
                      { field: 'current_amount', headerName: 'Raised', width: 120, renderCell: (params: any) => 
                        `₹${(params.value || 0).toLocaleString()}`, headerAlign: 'right', align: 'right'
                      },
                      { field: 'status', headerName: 'Status', width: 130, renderCell: (params: any) => (
                        <Chip 
                          label={params.value === 'LIVE' ? 'Active' : params.value === 'PENDING_APPROVAL' ? 'Pending' : params.value}
                          color={params.value === 'LIVE' ? 'success' : params.value === 'PENDING_APPROVAL' ? 'warning' : 'default'}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      ), headerAlign: 'center', align: 'center' },
                      { field: 'created_at', headerName: 'Created', width: 120, renderCell: (params: any) => 
                        new Date(params.value).toLocaleDateString(), headerAlign: 'center', align: 'center'
                      },
                    ]}
                    actions={[
                      {
                        icon: <CheckCircle />,
                        label: 'Approve',
                        onClick: (params: any) => {
                          if (params.row.status === 'PENDING_APPROVAL') {
                            approveCauseMutation.mutate(params.id)
                          }
                        }
                      },
                      {
                        icon: <Cancel />,
                        label: 'Reject',
                        onClick: (params: any) => {
                          if (params.row.status === 'PENDING_APPROVAL') {
                            const reason = prompt('Reason for rejection:')
                            if (reason) {
                              rejectCauseMutation.mutate({ causeId: params.id, reason })
                            }
                          }
                        }
                      }
                    ]}
                    loading={allCausesLoading}
                  />
                </CardContent>
              </Card>
            </Box>
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
                User Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<AdminPanelSettings />}
                onClick={() => setCreateUserOpen(true)}
                sx={{ backgroundColor: '#059669', '&:hover': { backgroundColor: '#047857' } }}
              >
                Add User
              </Button>
            </Box>
            
            {adminUsersLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <DataTable
                rows={adminUsers}
                columns={[
                  { field: 'id', headerName: 'ID', width: 80 },
                  { field: 'email', headerName: 'Email', width: 250 },
                  { field: 'first_name', headerName: 'First Name', width: 150 },
                  { field: 'last_name', headerName: 'Last Name', width: 150 },
                  { 
                    field: 'role', 
                    headerName: 'Role', 
                    width: 150,
                    renderCell: (params: any) => (
                      <Chip 
                        label={params.value.replace('_', ' ')} 
                        color={
                          params.value === 'PLATFORM_ADMIN' ? 'error' :
                          params.value === 'NGO_ADMIN' ? 'primary' :
                          params.value === 'NGO_STAFF' ? 'info' :
                          params.value === 'VENDOR' ? 'warning' :
                          'success'
                        }
                        size="small"
                      />
                    )
                  },
                  { 
                    field: 'ngo_name', 
                    headerName: 'NGO/Vendor', 
                    width: 150,
                    renderCell: (params: any) => params.value || '-'
                  },
                  { 
                    field: 'last_login', 
                    headerName: 'Last Login', 
                    width: 150,
                    renderCell: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : 'Never'
                  }
                ]}
                actions={[
                  {
                    icon: <AdminPanelSettings />,
                    label: 'Edit User',
                    onClick: (params: any) => handleEditUser(params.row)
                  },
                  {
                    icon: <LockReset />,
                    label: 'Reset Password',
                    onClick: (params: any) => handlePasswordReset(params.row.id)
                  }
                ]}
                onRowClick={() => {}}
                getRowId={(row) => row.id.toString()}
              />
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={5}>
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

          <TabPanel value={tabValue} index={6}>
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

          {/* Email Settings Tab */}
          <TabPanel value={tabValue} index={7}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Email Settings
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="SMTP Host"
                    value={emailSettings.smtp_host}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_host: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="SMTP Port"
                    type="number"
                    value={emailSettings.smtp_port}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_port: parseInt(e.target.value) })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="SMTP Username"
                    value={emailSettings.smtp_username}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_username: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="SMTP Password"
                    type="password"
                    value={emailSettings.smtp_password}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtp_password: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>SMTP Encryption</InputLabel>
                    <Select
                      value={emailSettings.smtp_encryption}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtp_encryption: e.target.value })}
                    >
                      <MenuItem value="SSL">SSL</MenuItem>
                      <MenuItem value="TLS">TLS</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="From Email"
                    value={emailSettings.from_email}
                    onChange={(e) => setEmailSettings({ ...emailSettings, from_email: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="From Name"
                    value={emailSettings.from_name}
                    onChange={(e) => setEmailSettings({ ...emailSettings, from_name: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleUpdateEmailSettings}
                  disabled={updateEmailSettingsMutation.isPending}
                >
                  {updateEmailSettingsMutation.isPending ? <CircularProgress size={20} /> : 'Save Settings'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleOpenSendEmail('password-reset')}
                >
                  Test Password Reset Email
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleOpenSendEmail('welcome')}
                >
                  Test Welcome Email
                </Button>
              </Box>
            </Box>
          </TabPanel>

          {/* Website Settings Tab */}
          <TabPanel value={tabValue} index={8}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Website Settings
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="App Name"
                    value={websiteSettings.app_name}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, app_name: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="App Title"
                    value={websiteSettings.app_title}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, app_title: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  
                  {/* Logo Upload */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                      Logo Upload
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {logoPreview && (
                        <Box sx={{ width: 60, height: 60, border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
                          <img 
                            src={logoPreview} 
                            alt="Logo Preview" 
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </Box>
                      )}
                      <Box sx={{ flex: 1 }}>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="logo-upload"
                          type="file"
                          onChange={handleLogoUpload}
                        />
                        <label htmlFor="logo-upload">
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<CloudUpload />}
                            sx={{ width: '100%' }}
                          >
                            {logoFile ? logoFile.name : 'Choose Logo File'}
                          </Button>
                        </label>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          Recommended: PNG, JPG, SVG (max 2MB)
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Favicon Upload */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                      Favicon Upload
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {faviconPreview && (
                        <Box sx={{ width: 32, height: 32, border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
                          <img 
                            src={faviconPreview} 
                            alt="Favicon Preview" 
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </Box>
                      )}
                      <Box sx={{ flex: 1 }}>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="favicon-upload"
                          type="file"
                          onChange={handleFaviconUpload}
                        />
                        <label htmlFor="favicon-upload">
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<Image />}
                            sx={{ width: '100%' }}
                          >
                            {faviconFile ? faviconFile.name : 'Choose Favicon File'}
                          </Button>
                        </label>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          Recommended: ICO, PNG (16x16 or 32x32px)
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <TextField
                    fullWidth
                    label="Primary Color"
                    type="color"
                    value={websiteSettings.primary_color}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, primary_color: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Secondary Color"
                    type="color"
                    value={websiteSettings.secondary_color}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, secondary_color: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Footer Text"
                    value={websiteSettings.footer_text}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, footer_text: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Contact Email"
                    value={websiteSettings.contact_email}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, contact_email: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Contact Phone"
                    value={websiteSettings.contact_phone}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, contact_phone: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Address"
                    multiline
                    rows={3}
                    value={websiteSettings.address}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, address: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleUpdateWebsiteSettings}
                  disabled={updateWebsiteSettingsMutation.isPending}
                >
                  {updateWebsiteSettingsMutation.isPending ? <CircularProgress size={20} /> : 'Save Settings'}
                </Button>
              </Box>
            </Box>
          </TabPanel>

          {/* Payment Settings Tab */}
          <TabPanel value={tabValue} index={9}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Payment Settings
              </Typography>
              
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Razorpay Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Current Razorpay settings are configured in the backend. Test credentials are already set up.
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => handleOpenSendEmail('donation-invoice')}
                  >
                    Test Donation Invoice Email
                  </Button>
                </Box>
              </Card>
            </Box>
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

        {/* Create User Dialog */}
        <Dialog open={createUserOpen} onClose={() => setCreateUserOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New User</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    label="Role"
                  >
                    <MenuItem value="PLATFORM_ADMIN">Platform Admin</MenuItem>
                    <MenuItem value="NGO_ADMIN">NGO Admin</MenuItem>
                    <MenuItem value="NGO_STAFF">NGO Staff</MenuItem>
                    <MenuItem value="VENDOR">Vendor</MenuItem>
                    <MenuItem value="DONOR">Donor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {newUser.role === 'NGO_ADMIN' || newUser.role === 'NGO_STAFF' ? (
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>NGO</InputLabel>
                    <Select
                      value={newUser.ngo_id}
                      onChange={(e) => setNewUser({ ...newUser, ngo_id: e.target.value })}
                      label="NGO"
                    >
                      {ngos.map((ngo) => (
                        <MenuItem key={ngo.id} value={ngo.id}>
                          {ngo.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              ) : null}
              {newUser.role === 'VENDOR' ? (
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Vendor</InputLabel>
                    <Select
                      value={newUser.vendor_id}
                      onChange={(e) => setNewUser({ ...newUser, vendor_id: e.target.value })}
                      label="Vendor"
                    >
                      {vendors.map((vendor) => (
                        <MenuItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              ) : null}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateUserOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateUser}
              variant="contained"
              disabled={createUserMutation.isPending || !newUser.email || !newUser.password || !newUser.first_name || !newUser.last_name || !newUser.role}
            >
              {createUserMutation.isPending ? <CircularProgress size={20} /> : 'Create User'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={editUserOpen} onClose={() => setEditUserOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit User</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={editUserData.first_name}
                  onChange={(e) => setEditUserData({ ...editUserData, first_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={editUserData.last_name}
                  onChange={(e) => setEditUserData({ ...editUserData, last_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={editUserData.role}
                    onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                    label="Role"
                  >
                    <MenuItem value="PLATFORM_ADMIN">Platform Admin</MenuItem>
                    <MenuItem value="NGO_ADMIN">NGO Admin</MenuItem>
                    <MenuItem value="NGO_STAFF">NGO Staff</MenuItem>
                    <MenuItem value="VENDOR">Vendor</MenuItem>
                    <MenuItem value="DONOR">Donor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {editUserData.role === 'NGO_ADMIN' || editUserData.role === 'NGO_STAFF' ? (
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>NGO</InputLabel>
                    <Select
                      value={editUserData.ngo_id}
                      onChange={(e) => setEditUserData({ ...editUserData, ngo_id: e.target.value })}
                      label="NGO"
                    >
                      {ngos.map((ngo) => (
                        <MenuItem key={ngo.id} value={ngo.name}>
                          {ngo.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              ) : null}
              {editUserData.role === 'VENDOR' ? (
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Vendor</InputLabel>
                    <Select
                      value={editUserData.vendor_id}
                      onChange={(e) => setEditUserData({ ...editUserData, vendor_id: e.target.value })}
                      label="Vendor"
                    >
                      {vendors.map((vendor) => (
                        <MenuItem key={vendor.id} value={vendor.name}>
                          {vendor.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              ) : null}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditUserOpen(false)}>Cancel</Button>
            <Button
              onClick={handleUpdateUser}
              variant="contained"
              disabled={editUserMutation.isPending || !editUserData.email || !editUserData.first_name || !editUserData.last_name || !editUserData.role}
            >
              {editUserMutation.isPending ? <CircularProgress size={20} /> : 'Update User'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Password Reset Dialog */}
        <Dialog open={passwordResetOpen} onClose={() => setPasswordResetOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Reset User Password</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter a new password for the selected user. This will immediately change their login credentials.
            </Typography>
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              sx={{ mb: 2 }}
              helperText="Password should be at least 8 characters long"
            />
            <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
              ⚠️ The user will need to use this new password for their next login.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordResetOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConfirmPasswordReset}
              variant="contained"
              color="warning"
              disabled={passwordResetMutation.isPending || !newPassword || newPassword.length < 8}
            >
              {passwordResetMutation.isPending ? <CircularProgress size={20} /> : 'Reset Password'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Send Email Dialog */}
        <Dialog open={sendEmailOpen} onClose={() => setSendEmailOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {emailType === 'password-reset' && 'Send Password Reset Email'}
            {emailType === 'welcome' && 'Send Welcome Email'}
            {emailType === 'donation-invoice' && 'Send Donation Invoice'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  value={emailData.user_email}
                  onChange={(e) => setEmailData({ ...emailData, user_email: e.target.value })}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              {emailType === 'welcome' && (
                <Grid item xs={12}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>User Role</InputLabel>
                    <Select
                      value={emailData.user_role}
                      onChange={(e) => setEmailData({ ...emailData, user_role: e.target.value })}
                    >
                      <MenuItem value="DONOR">Donor</MenuItem>
                      <MenuItem value="NGO_ADMIN">NGO Admin</MenuItem>
                      <MenuItem value="NGO_STAFF">NGO Staff</MenuItem>
                      <MenuItem value="VENDOR">Vendor</MenuItem>
                      <MenuItem value="PLATFORM_ADMIN">Platform Admin</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              {emailType === 'donation-invoice' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Donor Name"
                      value={emailData.donor_name}
                      onChange={(e) => setEmailData({ ...emailData, donor_name: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Cause Title"
                      value={emailData.cause_title}
                      onChange={(e) => setEmailData({ ...emailData, cause_title: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Amount"
                      type="number"
                      value={emailData.amount}
                      onChange={(e) => setEmailData({ ...emailData, amount: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Transaction ID"
                      value={emailData.transaction_id}
                      onChange={(e) => setEmailData({ ...emailData, transaction_id: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSendEmailOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSendEmail} 
              variant="contained"
              disabled={sendEmailMutation.isPending || !emailData.user_email}
            >
              {sendEmailMutation.isPending ? <CircularProgress size={20} /> : 'Send Email'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Professional Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity}
            variant="filled"
            sx={{ 
              width: '100%',
              '& .MuiAlert-message': {
                fontSize: '14px',
                fontWeight: 500
              }
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  )
}

export default AdminConsole
