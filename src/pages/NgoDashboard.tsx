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
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material'
import { 
  Add, 
  Edit, 
  AttachMoney, 
  TrendingUp, 
  Domain,
  PhotoCamera,
  Upload,
  CheckCircle,
  Visibility,
  Download,
  Preview,
  OpenInNew,
  Language
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { useAuth } from '../auth/AuthContext'

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

const NgoDashboard: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [tabValue, setTabValue] = useState(0)
  
  // State for various dialogs
  const [photoUploadOpen, setPhotoUploadOpen] = useState(false)
  const [bankDetailsOpen, setBankDetailsOpen] = useState(false)
  const [causeCreateOpen, setCauseCreateOpen] = useState(false)
  const [vendorDetailsOpen, setVendorDetailsOpen] = useState(false)
  const [micrositePreviewOpen, setMicrositePreviewOpen] = useState(false)
  const [aboutPageOpen, setAboutPageOpen] = useState(false)
  const [contactPageOpen, setContactPageOpen] = useState(false)
  const [domainManagementOpen, setDomainManagementOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<any>(null)
  
  // State for forms
  const [newPhoto, setNewPhoto] = useState<File | null>(null)
  const [bankDetails, setBankDetails] = useState({
    account_number: '',
    bank_name: '',
    ifsc_code: '',
    branch: '',
    account_holder_name: ''
  })
  const [newCause, setNewCause] = useState({
    title: '',
    description: '',
    target_amount: '',
    category_id: '',
    type: 'VENDOR' as 'VENDOR' | 'NGO_MANAGED',
    image_url: ''
  })

  // About Us page state
  const [aboutData, setAboutData] = useState({
    content: '',
    mission: '',
    vision: '',
    values: [] as string[],
    team: [] as Array<{name: string, role: string, bio: string}>
  })

  // Contact page state
  const [contactData, setContactData] = useState({
    phone: '',
    office_hours: '',
    departments: [] as Array<{name: string, email: string, phone: string}>,
    social_media: {} as Record<string, string>
  })

  // Domain management state
  const [domainData, setDomainData] = useState({
    custom_domain: '',
    subdomain: '',
    status: 'PENDING_DNS',
    dns_instructions: ''
  })

  // Fetch NGO data (filtered by user's NGO)
  const { data: ngoData, isLoading: ngoLoading } = useQuery({
    queryKey: ['ngo-data'],
    queryFn: () => apiClient.getAdminNGOs(),
    select: (data: any) => {
      // For NGO users, the backend already returns only their NGO
      // For platform admin, we need to filter by user's NGO if they have one
      if (user?.role === 'NGO_ADMIN' || user?.role === 'NGO_STAFF') {
        return data.value?.[0] // Backend already filters to user's NGO
      }
      return data.value?.[0] // Default behavior
    }
  })

  // Fetch associated vendors (filtered by user's NGO)
  const { data: vendors = [] } = useQuery({
    queryKey: ['ngo-vendors'],
    queryFn: () => apiClient.getAdminVendors(),
    select: (data: any) => {
      // For NGO users, filter vendors by their NGO associations
      if (user?.role === 'NGO_ADMIN' || user?.role === 'NGO_STAFF') {
        const userNgoId = user.ngo_id
        return data.value?.filter((vendor: any) => 
          vendor.ngo_associations?.some((assoc: any) => assoc.ngo_id === userNgoId)
        ) || []
      }
      return data.value || []
    }
  })

  // Fetch causes (filtered by user's NGO)
  const { data: causes = [] } = useQuery({
    queryKey: ['ngo-causes'],
    queryFn: () => apiClient.getAdminCauses(),
    select: (data: any) => {
      // The backend already filters causes by user's NGO
      return data || []
    }
  })

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories()
  })

  // Photo upload mutation
  const photoUploadMutation = useMutation({
    mutationFn: async ({ photo, ngoId }: { photo: File, ngoId: number }) => {
      return apiClient.uploadNgoPhoto(photo, ngoId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngo-data'] })
      setPhotoUploadOpen(false)
      setNewPhoto(null)
      alert('Photo uploaded successfully!')
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Failed to upload photo')
    },
  })

  // Vendor details mutation
  const vendorDetailsMutation = useMutation({
    mutationFn: async (vendorId: number) => {
      return apiClient.getVendorDetails(vendorId)
    },
    onSuccess: (data) => {
      setSelectedVendor(data)
      setVendorDetailsOpen(true)
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Failed to load vendor details')
    },
  })

  // About page mutation
  const aboutPageMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.updateNgoAboutPage(ngo?.id || 1, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngo-data'] })
      setAboutPageOpen(false)
      alert('About page updated successfully!')
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Failed to update about page')
    },
  })

  // Contact page mutation
  const contactPageMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.updateNgoContactPage(ngo?.id || 1, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngo-data'] })
      setContactPageOpen(false)
      alert('Contact page updated successfully!')
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Failed to update contact page')
    },
  })

  // Mock data for demonstration (fallback when API data is not available)
  const mockNgoData = {
    id: user?.ngo_id || 1,
    name: user?.ngo_name || "Hope Trust",
    description: "Dedicated to providing hope and support to communities in need through education, healthcare, and emergency relief programs.",
    logo_url: "https://picsum.photos/200/200?random=1",
    contact_email: "sarah@hopetrust.org",
    website_url: "https://hopetrust.org",
    phone: "+91-9876543210",
    address: "123 Hope Street, Mumbai, Maharashtra 400001",
    status: "ACTIVE",
    verified: true,
    registration_number: "NGO/2024/001",
    pan_number: "AAACH1234H",
    contact_person: "Dr. Sarah Johnson",
    slug: "hope-trust",
    photo_gallery: [
      "https://picsum.photos/400/300?random=11",
      "https://picsum.photos/400/300?random=12",
      "https://picsum.photos/400/300?random=13",
      "https://picsum.photos/400/300?random=14"
    ],
    bank_details: {
      account_number: "1234567890",
      bank_name: "State Bank of India",
      ifsc_code: "SBIN0001234",
      branch: "Mumbai Main Branch"
    },
    financial_summary: {
      total_donations: 170000,
      target_amount: 400000,
      progress_percentage: 42.5,
      active_causes: 2
    }
  }

  const mockInvoices = [
    {
      id: 1,
      invoice_number: "INV-2024-001",
      vendor_name: "Alpha Supplies",
      cause_title: "Daily Meals for Children",
      amount: 15000,
      status: "PAID",
      created_at: "2024-01-05",
      paid_at: "2024-01-10"
    },
    {
      id: 2,
      invoice_number: "INV-2024-002",
      vendor_name: "Alpha Supplies",
      cause_title: "School Infrastructure Development",
      amount: 10000,
      status: "PENDING",
      created_at: "2024-01-12",
      paid_at: null
    }
  ]

  // Mock donors with detailed information
  const mockDonors = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+1234567895",
      total_donations: 25000,
      last_donation_date: "2024-01-20T14:20:00Z",
      donation_reasons: ["Education", "Healthcare"],
      causes_supported: 3,
      donation_history: [
        { cause: "School Infrastructure Development", amount: 15000, date: "2024-01-20", reason: "Education" },
        { cause: "Medical Equipment Fund", amount: 10000, date: "2024-01-15", reason: "Healthcare" }
      ]
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+1234567896",
      total_donations: 15000,
      last_donation_date: "2024-01-18T10:15:00Z",
      donation_reasons: ["Emergency Relief", "Food & Nutrition"],
      causes_supported: 2,
      donation_history: [
        { cause: "Flood Relief Fund", amount: 10000, date: "2024-01-18", reason: "Emergency Relief" },
        { cause: "Daily Meals for Children", amount: 5000, date: "2024-01-10", reason: "Food & Nutrition" }
      ]
    },
    {
      id: 3,
      name: "Michael Chen",
      email: "michael.chen@email.com",
      phone: "+1234567897",
      total_donations: 30000,
      last_donation_date: "2024-01-22T16:30:00Z",
      donation_reasons: ["Education", "Women & Children"],
      causes_supported: 4,
      donation_history: [
        { cause: "Girl Child Education", amount: 20000, date: "2024-01-22", reason: "Women & Children" },
        { cause: "Library Development", amount: 10000, date: "2024-01-12", reason: "Education" }
      ]
    }
  ]

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handlePhotoUpload = () => {
    if (newPhoto && ngo) {
      photoUploadMutation.mutate({ photo: newPhoto, ngoId: ngo.id })
    }
  }

  const handleVendorView = (vendorId: number) => {
    vendorDetailsMutation.mutate(vendorId)
  }

  const handleMicrositePreview = () => {
    setMicrositePreviewOpen(true)
  }

  const handleAboutPageEdit = () => {
    // Load current about data
    setAboutData({
      content: ngo?.about_content || `Learn more about ${ngo?.name} and our mission to make a difference in communities worldwide.`,
      mission: ngo?.mission || 'To create positive change through verified, transparent operations.',
      vision: ngo?.vision || 'A world where every community has access to the support they need.',
      values: ngo?.values || ['Transparency', 'Impact', 'Community', 'Trust'],
      team: ngo?.team || [
        {name: 'Dr. Sarah Johnson', role: 'Founder & CEO', bio: 'Passionate about community development'},
        {name: 'Michael Chen', role: 'Program Director', bio: 'Expert in social impact programs'}
      ]
    })
    setAboutPageOpen(true)
  }

  const handleContactPageEdit = () => {
    // Load current contact data
    setContactData({
      phone: ngo?.phone || '',
      office_hours: ngo?.office_hours || 'Monday - Friday: 9:00 AM - 6:00 PM',
      departments: ngo?.departments || [
        {name: 'General Inquiries', email: ngo?.contact_email || '', phone: ngo?.phone || ''},
        {name: 'Donations', email: `donations@${ngo?.slug || 'hope-trust'}.org`, phone: ngo?.phone || ''},
        {name: 'Volunteer', email: `volunteer@${ngo?.slug || 'hope-trust'}.org`, phone: ngo?.phone || ''}
      ],
      social_media: ngo?.social_media || {
        facebook: `https://facebook.com/${ngo?.slug || 'hope-trust'}`,
        twitter: `https://twitter.com/${ngo?.slug || 'hope-trust'}`,
        instagram: `https://instagram.com/${ngo?.slug || 'hope-trust'}`
      }
    })
    setContactPageOpen(true)
  }

  const handleAboutPageUpdate = () => {
    aboutPageMutation.mutate(aboutData)
  }

  const handleContactPageUpdate = () => {
    contactPageMutation.mutate(contactData)
  }

  const handleBankDetailsUpdate = () => {
    // TODO: Implement bank details update with validation workflow
    console.log('Updating bank details:', bankDetails)
    setBankDetailsOpen(false)
  }

  const handleCauseCreate = () => {
    // TODO: Implement cause creation API
    console.log('Creating cause:', newCause)
    setCauseCreateOpen(false)
    setNewCause({
      title: '',
      description: '',
      target_amount: '',
      category_id: '',
      type: 'VENDOR',
      image_url: ''
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'success'
      case 'PENDING': return 'warning'
      case 'REJECTED': return 'error'
      default: return 'default'
    }
  }

  if (ngoLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  const ngo = ngoData || mockNgoData

  // Debug logging
  console.log('Current tab value:', tabValue)
  console.log('NGO data:', ngo)
  console.log('Vendors:', vendors)
  console.log('Causes:', causes)

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1F2937' }}>
              {ngo.name} Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back, {user?.first_name}! Manage your NGO operations and track progress.
            </Typography>
            {user?.role === 'NGO_ADMIN' && (
              <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                Role: NGO Administrator
              </Typography>
            )}
            {user?.role === 'NGO_STAFF' && (
              <Typography variant="body2" color="info.main" sx={{ mt: 1 }}>
                Role: NGO Staff Member
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Language />}
              onClick={() => setDomainManagementOpen(true)}
              sx={{ 
                borderColor: '#059669',
                color: '#059669',
                '&:hover': { 
                  borderColor: '#047857',
                  backgroundColor: '#ECFDF5'
                },
                minWidth: 180
              }}
            >
              Domain Management
            </Button>
            <Button
              variant="contained"
              startIcon={<Preview />}
              onClick={handleMicrositePreview}
              sx={{ 
                backgroundColor: '#7C3AED', 
                '&:hover': { backgroundColor: '#6D28D9' },
                minWidth: 200
              }}
            >
              Preview Microsite
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="ngo dashboard tabs"
          id="simple-tab"
        >
          <Tab label="NGO Details" id="simple-tab-0" aria-controls="simple-tabpanel-0" />
          <Tab label="Financial Summary" id="simple-tab-1" aria-controls="simple-tabpanel-1" />
          <Tab label="Associated Vendors" id="simple-tab-2" aria-controls="simple-tabpanel-2" />
          <Tab label="Active Causes" id="simple-tab-3" aria-controls="simple-tabpanel-3" />
          <Tab label="Invoice History" id="simple-tab-4" aria-controls="simple-tabpanel-4" />
          <Tab label="Donor Details" id="simple-tab-5" aria-controls="simple-tabpanel-5" />
          <Tab label="About Us Page" id="simple-tab-6" aria-controls="simple-tabpanel-6" />
          <Tab label="Contact Page" id="simple-tab-7" aria-controls="simple-tabpanel-7" />
          <Tab label="Photo Gallery" id="simple-tab-8" aria-controls="simple-tabpanel-8" />
        </Tabs>
      </Box>

      {/* NGO Details Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* NGO Information */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    src={ngo.logo_url}
                    sx={{ width: 80, height: 80, mr: 3 }}
                  />
                  <Box>
                    <Typography variant="h5" component="h2" gutterBottom>
                      {ngo.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      {ngo.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip 
                        label={ngo.status} 
                        color={ngo.status === 'ACTIVE' ? 'success' : 'default'} 
                        size="small" 
                      />
                      <Chip 
                        label={ngo.verified ? 'Verified' : 'Unverified'} 
                        color={ngo.verified ? 'success' : 'warning'} 
                        size="small" 
                      />
                    </Box>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Registration Number</Typography>
                    <Typography variant="body1">{ngo.registration_number}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Contact Person</Typography>
                    <Typography variant="body1">{ngo.contact_person}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{ngo.contact_email}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{ngo.phone}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                    <Typography variant="body1">{ngo.address}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Photo Gallery */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Photo Gallery</Typography>
                  <Button
                    startIcon={<Add />}
                    onClick={() => setPhotoUploadOpen(true)}
                    size="small"
                    variant="outlined"
                  >
                    Add Photo
                  </Button>
                </Box>
                <Grid container spacing={1}>
                  {ngo.photo_gallery.map((photo: string, index: number) => (
                    <Grid item xs={6} key={index}>
                      <Box
                        component="img"
                        src={photo}
                        alt={`Gallery ${index + 1}`}
                        sx={{
                          width: '100%',
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: 1,
                          cursor: 'pointer'
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Bank Details</Typography>
                  <Button
                    startIcon={<Edit />}
                    onClick={() => setBankDetailsOpen(true)}
                    size="small"
                    variant="outlined"
                  >
                    Update
                  </Button>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Bank Name</Typography>
                  <Typography variant="body2">{ngo.bank_details.bank_name}</Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Account Number</Typography>
                  <Typography variant="body2">{ngo.bank_details.account_number}</Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">IFSC Code</Typography>
                  <Typography variant="body2">{ngo.bank_details.ifsc_code}</Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">Branch</Typography>
                  <Typography variant="body2">{ngo.bank_details.branch}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 2 }}>
                  <Chip 
                    label="Verified" 
                    color="success" 
                    size="small" 
                    icon={<CheckCircle />}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Last updated: Jan 15, 2024
                  </Typography>
                </Box>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Admin Approval Required:</strong> Bank details updates require validation by Platform Admin before being published to the frontend.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Financial Summary Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AttachMoney sx={{ color: '#059669', mr: 1 }} />
                  <Typography variant="h6">Total Donations</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#059669' }}>
                  ₹{ngo.financial_summary.total_donations.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp sx={{ color: '#2563EB', mr: 1 }} />
                  <Typography variant="h6">Target Amount</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2563EB' }}>
                  ₹{ngo.financial_summary.target_amount.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp sx={{ color: '#7C3AED', mr: 1 }} />
                  <Typography variant="h6">Progress</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#7C3AED' }}>
                  {ngo.financial_summary.progress_percentage}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={ngo.financial_summary.progress_percentage} 
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Domain sx={{ color: '#DC2626', mr: 1 }} />
                  <Typography variant="h6">Active Causes</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#DC2626' }}>
                  {ngo.financial_summary.active_causes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Associated Vendors Tab */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Associated Vendors
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Vendor Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Contact Email</TableCell>
                    <TableCell>KYC Status</TableCell>
                    <TableCell>Associated Since</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vendors.map((vendor: any) => (
                    <TableRow key={vendor.id}>
                      <TableCell>{vendor.name}</TableCell>
                      <TableCell>{vendor.category || 'General'}</TableCell>
                      <TableCell>{vendor.contact_email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={vendor.kyc_status} 
                          color={vendor.kyc_status === 'VERIFIED' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(vendor.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small"
                          onClick={() => handleVendorView(vendor.id)}
                        >
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Active Causes Tab */}
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Active Causes</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCauseCreateOpen(true)}
          >
            Create Cause
          </Button>
        </Box>
        <Grid container spacing={2}>
          {causes.map((cause: any) => (
            <Grid item xs={12} md={6} key={cause.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {cause.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {cause.description}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip label={cause.category?.name || 'General'} size="small" />
                    <Chip 
                      label={cause.status} 
                      color={cause.status === 'LIVE' ? 'success' : 'default'}
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Raised: ₹{(cause.current_amount || 0).toLocaleString()}</Typography>
                    <Typography variant="body2">Target: ₹{(cause.target_amount || 0).toLocaleString()}</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={((cause.current_amount || 0) / (cause.target_amount || 1)) * 100} 
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Invoice History Tab */}
      <TabPanel value={tabValue} index={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Invoice History
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Cause</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Paid</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.vendor_name}</TableCell>
                      <TableCell>{invoice.cause_title}</TableCell>
                      <TableCell>₹{invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={invoice.status} 
                          color={getStatusColor(invoice.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{invoice.created_at}</TableCell>
                      <TableCell>{invoice.paid_at || '-'}</TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <Download />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Donor Details Tab */}
      <TabPanel value={tabValue} index={5}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Donor Details & Donation History
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              View detailed information about your donors and their donation patterns
            </Typography>
            <List>
              {mockDonors.map((donor) => (
                <React.Fragment key={donor.id}>
                  <ListItem sx={{ alignItems: 'flex-start' }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {donor.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6">{donor.name}</Typography>
                          <Chip 
                            label={`₹${donor.total_donations.toLocaleString()}`} 
                            color="success" 
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            📧 {donor.email} • 📞 {donor.phone}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            🎯 Causes Supported: {donor.causes_supported} • 
                            📅 Last Donation: {new Date(donor.last_donation_date).toLocaleDateString()}
                          </Typography>
                          
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              💝 Donation Reasons:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {donor.donation_reasons.map((reason, index) => (
                                <Chip key={index} label={reason} size="small" color="primary" />
                              ))}
                            </Box>
                          </Box>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            📊 Recent Donation History:
                          </Typography>
                          <Box sx={{ ml: 2 }}>
                            {donor.donation_history.map((donation, index) => (
                              <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {donation.cause}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  ₹{donation.amount.toLocaleString()} • {donation.date} • Reason: {donation.reason}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider sx={{ my: 2 }} />
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* About Us Page Tab */}
      <TabPanel value={tabValue} index={6}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">About Us Page Management</Typography>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={handleAboutPageEdit}
          >
            Edit About Page
          </Button>
        </Box>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Current About Page Content</Typography>
            <Typography variant="body1" paragraph>
              {ngo?.about_content || `Learn more about ${ngo?.name} and our mission to make a difference in communities worldwide.`}
            </Typography>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Mission</Typography>
            <Typography variant="body1" paragraph>
              {ngo?.mission || 'To create positive change through verified, transparent operations.'}
            </Typography>
            <Typography variant="h6" gutterBottom>Vision</Typography>
            <Typography variant="body1" paragraph>
              {ngo?.vision || 'A world where every community has access to the support they need.'}
            </Typography>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Values</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {(ngo?.values || ['Transparency', 'Impact', 'Community', 'Trust']).map((value: string, index: number) => (
                <Chip key={index} label={value} color="primary" size="small" />
              ))}
            </Box>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Team</Typography>
            <List>
              {(ngo?.team || [
                {name: 'Dr. Sarah Johnson', role: 'Founder & CEO', bio: 'Passionate about community development'},
                {name: 'Michael Chen', role: 'Program Director', bio: 'Expert in social impact programs'}
              ]).map((member: {name: string, role: string, bio: string}, index: number) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={`${member.name} - ${member.role}`}
                    secondary={member.bio}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Contact Page Tab */}
      <TabPanel value={tabValue} index={7}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Contact Page Management</Typography>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={handleContactPageEdit}
          >
            Edit Contact Page
          </Button>
        </Box>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Current Contact Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{ngo?.contact_email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">{ngo?.phone || 'Not provided'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                <Typography variant="body1">{ngo?.address}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Office Hours</Typography>
                <Typography variant="body1">{ngo?.office_hours || 'Monday - Friday: 9:00 AM - 6:00 PM'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Website</Typography>
                <Typography variant="body1">{ngo?.website_url || 'Not provided'}</Typography>
              </Grid>
            </Grid>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Departments</Typography>
            <List>
              {(ngo?.departments || [
                {name: 'General Inquiries', email: ngo?.contact_email || '', phone: ngo?.phone || ''},
                {name: 'Donations', email: `donations@${ngo?.slug || 'hope-trust'}.org`, phone: ngo?.phone || ''},
                {name: 'Volunteer', email: `volunteer@${ngo?.slug || 'hope-trust'}.org`, phone: ngo?.phone || ''}
              ]).map((dept: {name: string, email: string, phone: string}, index: number) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={dept.name}
                    secondary={`${dept.email} | ${dept.phone}`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Photo Gallery Tab */}
      <TabPanel value={tabValue} index={8}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Photo Gallery Management</Typography>
          <Button
            variant="contained"
            startIcon={<PhotoCamera />}
            onClick={() => setPhotoUploadOpen(true)}
          >
            Add New Photo
          </Button>
        </Box>
        <Grid container spacing={2}>
          {(ngo?.photo_gallery || [
            "https://picsum.photos/400/300?random=11",
            "https://picsum.photos/400/300?random=12",
            "https://picsum.photos/400/300?random=13",
            "https://picsum.photos/400/300?random=14"
          ]).map((photo: string, index: number) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <Box
                  component="img"
                  src={photo}
                  alt={`Gallery ${index + 1}`}
                  sx={{
                    width: '100%',
                    height: 200,
                    objectFit: 'cover',
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8,
                      transform: 'scale(1.02)',
                      transition: 'all 0.3s ease'
                    }
                  }}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2">Photo {index + 1}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" color="primary" variant="outlined">
                        Edit
                      </Button>
                      <Button size="small" color="error" variant="outlined">
                        Remove
                      </Button>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Uploaded: Jan {15 + index}, 2024
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Photo Guidelines:</strong> Upload high-quality images (min 800x600px) that represent your NGO's work. 
            Photos will be displayed on your microsite and public profile.
          </Typography>
        </Alert>
      </TabPanel>


      {/* Photo Upload Dialog */}
      <Dialog open={photoUploadOpen} onClose={() => setPhotoUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Photo to Gallery</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="photo-upload"
              type="file"
              onChange={(e) => setNewPhoto(e.target.files?.[0] || null)}
            />
            <label htmlFor="photo-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<PhotoCamera />}
                fullWidth
                sx={{ mb: 2 }}
              >
                Choose Photo
              </Button>
            </label>
            {newPhoto && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Selected: {newPhoto.name}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoUploadOpen(false)}>Cancel</Button>
          <Button 
            onClick={handlePhotoUpload} 
            variant="contained"
            disabled={!newPhoto}
          >
            Upload Photo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bank Details Update Dialog */}
      <Dialog open={bankDetailsOpen} onClose={() => setBankDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Update Bank Details</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Bank details updates require validation by Platform Admin. Please upload supporting documents.
          </Alert>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Account Holder Name"
                value={bankDetails.account_holder_name}
                onChange={(e) => setBankDetails({ ...bankDetails, account_holder_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Account Number"
                value={bankDetails.account_number}
                onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bank Name"
                value={bankDetails.bank_name}
                onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="IFSC Code"
                value={bankDetails.ifsc_code}
                onChange={(e) => setBankDetails({ ...bankDetails, ifsc_code: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Branch"
                value={bankDetails.branch}
                onChange={(e) => setBankDetails({ ...bankDetails, branch: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Supporting Documents (PDF/Image)
              </Typography>
              <input
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                id="bank-docs-upload"
                type="file"
                multiple
              />
              <label htmlFor="bank-docs-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<Upload />}
                  fullWidth
                >
                  Upload Documents
                </Button>
              </label>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBankDetailsOpen(false)}>Cancel</Button>
          <Button onClick={handleBankDetailsUpdate} variant="contained">
            Submit for Validation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Cause Dialog */}
      <Dialog open={causeCreateOpen} onClose={() => setCauseCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Cause</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cause Title"
                value={newCause.title}
                onChange={(e) => setNewCause({ ...newCause, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={newCause.description}
                onChange={(e) => setNewCause({ ...newCause, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Target Amount"
                type="number"
                value={newCause.target_amount}
                onChange={(e) => setNewCause({ ...newCause, target_amount: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
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
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newCause.type}
                  onChange={(e) => setNewCause({ ...newCause, type: e.target.value as 'VENDOR' | 'NGO_MANAGED' })}
                  label="Type"
                >
                  <MenuItem value="VENDOR">Vendor Managed</MenuItem>
                  <MenuItem value="NGO_MANAGED">NGO Managed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image URL"
                value={newCause.image_url}
                onChange={(e) => setNewCause({ ...newCause, image_url: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCauseCreateOpen(false)}>Cancel</Button>
          <Button onClick={handleCauseCreate} variant="contained">
            Create Cause
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vendor Details Dialog */}
      <Dialog open={vendorDetailsOpen} onClose={() => setVendorDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Vendor Details</DialogTitle>
        <DialogContent>
          {selectedVendor && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Vendor Name</Typography>
                <Typography variant="body1">{selectedVendor.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">GSTIN</Typography>
                <Typography variant="body1">{selectedVendor.gstin}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Contact Email</Typography>
                <Typography variant="body1">{selectedVendor.contact_email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">{selectedVendor.phone}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                <Typography variant="body1">{selectedVendor.address}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">KYC Status</Typography>
                <Chip 
                  label={selectedVendor.kyc_status} 
                  color={selectedVendor.kyc_status === 'VERIFIED' ? 'success' : 'warning'}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Total Invoices</Typography>
                <Typography variant="body1">{selectedVendor.total_invoices || 0}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Total Amount</Typography>
                <Typography variant="body1">₹{(selectedVendor.total_amount || 0).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Associated Since</Typography>
                <Typography variant="body1">{new Date(selectedVendor.created_at).toLocaleDateString()}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVendorDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Microsite Preview Dialog */}
      <Dialog open={micrositePreviewOpen} onClose={() => setMicrositePreviewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Microsite Preview - {ngo.name}</Typography>
            <Button
              variant="outlined"
              startIcon={<OpenInNew />}
              onClick={() => window.open(`/microsite/${ngo.slug || 'hope-trust'}`, '_blank')}
            >
              Open in New Tab
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This is how your NGO microsite will appear when hosted on your domain. No redirects to our platform will be shown.
          </Alert>
          <Box sx={{ 
            border: '1px solid #e0e0e0', 
            borderRadius: 2, 
            overflow: 'hidden',
            height: '600px'
          }}>
            <iframe
              src={`/microsite/${ngo.slug || 'hope-trust'}`}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              title="Microsite Preview"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMicrositePreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* About Us Page Edit Dialog */}
      <Dialog open={aboutPageOpen} onClose={() => setAboutPageOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit About Us Page</DialogTitle>
        <DialogContent>
          <TextField
            label="About Content"
            fullWidth
            margin="normal"
            multiline
            rows={4}
            value={aboutData.content}
            onChange={(e) => setAboutData({ ...aboutData, content: e.target.value })}
            placeholder="Tell your story and mission..."
          />
          <TextField
            label="Mission Statement"
            fullWidth
            margin="normal"
            value={aboutData.mission}
            onChange={(e) => setAboutData({ ...aboutData, mission: e.target.value })}
            placeholder="What is your organization's mission?"
          />
          <TextField
            label="Vision Statement"
            fullWidth
            margin="normal"
            value={aboutData.vision}
            onChange={(e) => setAboutData({ ...aboutData, vision: e.target.value })}
            placeholder="What is your vision for the future?"
          />
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Values</Typography>
          <TextField
            label="Values (comma-separated)"
            fullWidth
            margin="normal"
            value={aboutData.values.join(', ')}
            onChange={(e) => setAboutData({ ...aboutData, values: e.target.value.split(',').map(v => v.trim()).filter(v => v) })}
            placeholder="Transparency, Impact, Community, Trust"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAboutPageOpen(false)}>Cancel</Button>
          <Button onClick={handleAboutPageUpdate} variant="contained">
            Update About Page
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contact Page Edit Dialog */}
      <Dialog open={contactPageOpen} onClose={() => setContactPageOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Contact Page</DialogTitle>
        <DialogContent>
          <TextField
            label="Phone Number"
            fullWidth
            margin="normal"
            value={contactData.phone}
            onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
            placeholder="+91-9876543210"
          />
          <TextField
            label="Office Hours"
            fullWidth
            margin="normal"
            value={contactData.office_hours}
            onChange={(e) => setContactData({ ...contactData, office_hours: e.target.value })}
            placeholder="Monday - Friday: 9:00 AM - 6:00 PM"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactPageOpen(false)}>Cancel</Button>
          <Button onClick={handleContactPageUpdate} variant="contained">
            Update Contact Page
          </Button>
        </DialogActions>
      </Dialog>

      {/* Domain Configuration Dialog */}
      <Dialog open={domainManagementOpen} onClose={() => setDomainManagementOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Configure Custom Domain</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Professional Setup:</strong> Configure your custom domain to eliminate redirects and provide a professional donor experience.
            </Typography>
          </Alert>

          <TextField
            label="Custom Domain"
            placeholder="e.g., hopetrust.org or www.hopetrust.org"
            value={domainData.custom_domain}
            onChange={(e) => setDomainData({...domainData, custom_domain: e.target.value})}
            fullWidth
            sx={{ mb: 2 }}
            helperText="Enter your domain without http:// or https://"
          />

          <TextField
            label="Subdomain (Optional)"
            placeholder="e.g., donate, support, or leave blank for root domain"
            value={domainData.subdomain}
            onChange={(e) => setDomainData({...domainData, subdomain: e.target.value})}
            fullWidth
            sx={{ mb: 2 }}
            helperText="If you want a subdomain like donate.yourdomain.org"
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Domain Type</InputLabel>
            <Select
              value={domainData.custom_domain ? 'custom' : 'subdomain'}
              onChange={(e) => {
                if (e.target.value === 'subdomain') {
                  setDomainData({...domainData, custom_domain: '', subdomain: ''})
                }
              }}
            >
              <MenuItem value="subdomain">Use Platform Subdomain (free)</MenuItem>
              <MenuItem value="custom">Use Custom Domain (professional)</MenuItem>
            </Select>
          </FormControl>

          {domainData.custom_domain && (
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                DNS Configuration Required:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                <strong>CNAME Record:</strong><br/>
                Name: www<br/>
                Value: microsites.yourplatform.com<br/>
                TTL: 300
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                <strong>A Record (for root domain):</strong><br/>
                Name: @<br/>
                Value: 192.168.1.100<br/>
                TTL: 300
              </Typography>
            </Box>
          )}

          <Alert severity="warning">
            <Typography variant="body2">
              <strong>Important:</strong> After configuring DNS, it may take 24-48 hours for changes to propagate. 
              Your domain will show as "Pending" until DNS is properly configured.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDomainManagementOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            // TODO: Implement domain configuration API call
            setDomainManagementOpen(false)
          }} variant="contained">
            Configure Domain
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default NgoDashboard