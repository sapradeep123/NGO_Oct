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
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material'
import { 
  Visibility,
  LocalShipping,
  CheckCircle,
  PlayArrow,
  Done,
  Receipt, 
  Business,
  VolunteerActivism,
  Update
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { apiClient } from '../api/client'

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

const VendorPortal: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [tabValue, setTabValue] = useState(0)
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false)
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [deliveryDate, setDeliveryDate] = useState('')
  const [stockStatusOpen, setStockStatusOpen] = useState(false)
  const [selectedCause, setSelectedCause] = useState<any>(null)
  const [stockFormData, setStockFormData] = useState({
    status: 'AVAILABLE',
    available_quantity: '',
    unit: '',
    price_per_unit: '',
    notes: ''
  })

  // Fetch vendor's orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['vendor-orders'],
    queryFn: () => apiClient.getVendorOrders(),
  })

  // Fetch vendor associations
  const { data: associations, isLoading: associationsLoading } = useQuery({
    queryKey: ['vendor-associations'],
    queryFn: () => apiClient.getVendorAssociations(),
  })

  // Fetch vendor stock status
  const { data: stockStatus = [], isLoading: stockLoading } = useQuery({
    queryKey: ['vendor-stock-status'],
    queryFn: () => apiClient.getVendorStockStatus(),
  })

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, deliveryDate }: { orderId: number, status: string, deliveryDate?: string }) => {
      return apiClient.updateOrderStatus(orderId, { status, delivery_date: deliveryDate })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] })
      setStatusUpdateOpen(false)
      setSelectedOrder(null)
      setDeliveryDate('')
    },
  })

  // Update stock status mutation
  const updateStockMutation = useMutation({
    mutationFn: async (stockData: any) => {
      return apiClient.updateStockStatus(stockData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-stock-status'] })
      setStockStatusOpen(false)
      setStockFormData({
        status: 'AVAILABLE',
        available_quantity: '',
        unit: '',
        price_per_unit: '',
        notes: ''
      })
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ORDER_RECEIVED': return 'info'
      case 'ORDER_IN_PROCESS': return 'warning'
      case 'ORDER_IN_TRANSIT': return 'primary'
      case 'ORDER_DELIVERED': return 'success'
      default: return 'default'
    }
  }

  // Helper function to filter orders by status
  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status)
  }

  // Helper function to get all orders
  const getAllOrders = () => {
    return orders
  }

  // Reusable OrderTable component
  const OrderTable = ({ ordersToShow, emptyMessage }: { ordersToShow: any[], emptyMessage: string }) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order #</TableCell>
            <TableCell>Cause</TableCell>
            <TableCell>NGO</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ordersLoading ? (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <CircularProgress size={24} />
              </TableCell>
            </TableRow>
          ) : ordersToShow.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography variant="body2" color="text.secondary">
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            ordersToShow.map((order: any) => (
              <TableRow key={order.id}>
                <TableCell>{order.order_number}</TableCell>
                <TableCell>{order.cause_title}</TableCell>
                <TableCell>{order.ngo_name}</TableCell>
                <TableCell>₹{order.order_amount.toLocaleString()}</TableCell>
                <TableCell>
      <Chip 
                    icon={getStatusIcon(order.status)}
                    label={order.status.replace('_', ' ')}
                    color={getStatusColor(order.status) as any}
        size="small"
      />
                </TableCell>
                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedOrder(order)
                        setOrderDetailsOpen(true)
                      }}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  {order.status !== 'ORDER_DELIVERED' && (
                    <Tooltip title="Update Status">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedOrder(order)
                          setStatusUpdateOpen(true)
                        }}
                      >
                        <CheckCircle />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ORDER_RECEIVED': return <Receipt />
      case 'ORDER_IN_PROCESS': return <PlayArrow />
      case 'ORDER_IN_TRANSIT': return <LocalShipping />
      case 'ORDER_DELIVERED': return <Done />
      default: return <Receipt />
    }
  }

  const handleConfirmStatusUpdate = () => {
    if (!selectedOrder) return
    
    const nextStatus = getNextStatus(selectedOrder.status)
    if (!nextStatus) return

    updateStatusMutation.mutate({
      orderId: selectedOrder.id,
      status: nextStatus,
      deliveryDate: nextStatus === 'ORDER_IN_TRANSIT' ? deliveryDate : undefined
    })
  }

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'ORDER_RECEIVED': return 'ORDER_IN_PROCESS'
      case 'ORDER_IN_PROCESS': return 'ORDER_IN_TRANSIT'
      case 'ORDER_IN_TRANSIT': return 'ORDER_DELIVERED'
      default: return null
    }
  }

  if (ordersLoading) {
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
          Vendor Portal - {user?.vendor_name || 'Vendor Dashboard'}
          </Typography>
        
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
          <Tab label="Order Received" />
          <Tab label="Order In Process" />
          <Tab label="Order In Transit" />
          <Tab label="Order Delivered" />
          <Tab label="All Orders" />
          <Tab label="NGO Associations" />
          <Tab label="Cause Associations" />
          <Tab label="Stock Management" />
        </Tabs>

        {/* Order Received Tab */}
        <TabPanel value={tabValue} index={0}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Received ({getOrdersByStatus('ORDER_RECEIVED').length})
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                New orders that need to be processed
              </Typography>
              <OrderTable 
                ordersToShow={getOrdersByStatus('ORDER_RECEIVED')} 
                emptyMessage="No orders received yet"
              />
            </CardContent>
          </Card>
        </TabPanel>

        {/* Order In Process Tab */}
        <TabPanel value={tabValue} index={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order In Process ({getOrdersByStatus('ORDER_IN_PROCESS').length})
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Orders currently being processed
          </Typography>
              <OrderTable 
                ordersToShow={getOrdersByStatus('ORDER_IN_PROCESS')} 
                emptyMessage="No orders in process"
              />
            </CardContent>
          </Card>
        </TabPanel>

        {/* Order In Transit Tab */}
        <TabPanel value={tabValue} index={2}>
            <Card>
              <CardContent>
              <Typography variant="h6" gutterBottom>
                Order In Transit ({getOrdersByStatus('ORDER_IN_TRANSIT').length})
                    </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Orders shipped and in transit
                    </Typography>
              <OrderTable 
                ordersToShow={getOrdersByStatus('ORDER_IN_TRANSIT')} 
                emptyMessage="No orders in transit"
              />
              </CardContent>
            </Card>
        </TabPanel>

        {/* Order Delivered Tab */}
        <TabPanel value={tabValue} index={3}>
            <Card>
              <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Delivered ({getOrdersByStatus('ORDER_DELIVERED').length})
                    </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Orders delivered and waiting for NGO confirmation
                    </Typography>
              <OrderTable 
                ordersToShow={getOrdersByStatus('ORDER_DELIVERED')} 
                emptyMessage="No orders delivered yet"
              />
              </CardContent>
            </Card>
        </TabPanel>

        {/* All Orders Tab */}
        <TabPanel value={tabValue} index={4}>
            <Card>
              <CardContent>
              <Typography variant="h6" gutterBottom>
                All Orders ({getAllOrders().length})
                    </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Complete overview of all orders
                    </Typography>
              <OrderTable 
                ordersToShow={getAllOrders()} 
                emptyMessage="No orders found"
              />
              </CardContent>
            </Card>
        </TabPanel>

        {/* NGO Associations Tab */}
        <TabPanel value={tabValue} index={5}>
            <Card>
              <CardContent>
              <Typography variant="h6" gutterBottom>
                Associated NGOs ({associations?.associated_ngos?.length || 0})
                    </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                NGOs you are currently associated with
                    </Typography>
              {associationsLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : associations?.associated_ngos?.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  No NGO associations found
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {associations?.associated_ngos?.map((ngo: any) => (
                    <Grid item xs={12} sm={6} md={4} key={ngo.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Business color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6">{ngo.name}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            📧 {ngo.contact_email}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            📞 {ngo.contact_phone}
                          </Typography>
                          {ngo.website_url && (
                            <Typography variant="body2" color="primary">
                              🌐 {ngo.website_url}
                            </Typography>
                          )}
              </CardContent>
            </Card>
          </Grid>
                  ))}
        </Grid>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        {/* Cause Associations Tab */}
        <TabPanel value={tabValue} index={6}>
        <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Associated Causes ({associations?.associated_causes?.length || 0})
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Causes you have orders for
              </Typography>
              {associationsLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
            </Box>
              ) : associations?.associated_causes?.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  No cause associations found
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {associations?.associated_causes?.map((cause: any) => (
                  <Grid item xs={12} sm={6} md={4} key={cause.id}>
                      <Card variant="outlined">
                      <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <VolunteerActivism color="secondary" sx={{ mr: 1 }} />
                            <Typography variant="h6">{cause.title}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {cause.description}
                        </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            🏢 {cause.ngo_name}
                        </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            📦 Orders: {cause.order_count}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            📅 Last Order: {cause.last_order_date ? new Date(cause.last_order_date).toLocaleDateString() : 'N/A'}
                          </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
            </CardContent>
          </Card>
          </TabPanel>

        {/* Stock Management Tab */}
        <TabPanel value={tabValue} index={7}>
          <Card>
            <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                  Stock Status Management ({stockStatus.length})
              </Typography>
              <Button
                variant="contained"
                  startIcon={<Update />}
                  onClick={() => {
                    setSelectedCause(null)
                    setStockStatusOpen(true)
                  }}
                >
                  Update Stock
              </Button>
            </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Manage stock availability for causes
              </Typography>
              {stockLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : stockStatus.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  No stock status records found
                </Typography>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Cause</TableCell>
                        <TableCell>NGO</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Unit</TableCell>
                        <TableCell>Price/Unit</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell>Updated</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stockStatus.map((stock: any) => (
                        <TableRow key={stock.id}>
                          <TableCell>{stock.cause_title}</TableCell>
                          <TableCell>{stock.ngo_name}</TableCell>
                          <TableCell>
                            <Chip
                              label={stock.status}
                              color={
                                stock.status === 'AVAILABLE' ? 'success' :
                                stock.status === 'LIMITED' ? 'warning' : 'error'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{stock.available_quantity}</TableCell>
                          <TableCell>{stock.unit}</TableCell>
                          <TableCell>₹{stock.price_per_unit}</TableCell>
                          <TableCell>{stock.notes}</TableCell>
                          <TableCell>{new Date(stock.updated_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedCause(stock)
                                setStockFormData({
                                  status: stock.status,
                                  available_quantity: stock.available_quantity.toString(),
                                  unit: stock.unit,
                                  price_per_unit: stock.price_per_unit.toString(),
                                  notes: stock.notes
                                })
                                setStockStatusOpen(true)
                              }}
                            >
                              <Update />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
          </TabPanel>

        {/* Order Details Dialog */}
        <Dialog open={orderDetailsOpen} onClose={() => setOrderDetailsOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Order Details - {selectedOrder?.order_number}</DialogTitle>
          <DialogContent>
            {selectedOrder && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Cause</Typography>
                    <Typography variant="body1">{selectedOrder.cause_title}</Typography>
          </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">NGO</Typography>
                    <Typography variant="body1">{selectedOrder.ngo_name}</Typography>
          </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Order Amount</Typography>
                    <Typography variant="body1">₹{selectedOrder.order_amount.toLocaleString()}</Typography>
        </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                        <Chip 
                      icon={getStatusIcon(selectedOrder.status)}
                      label={selectedOrder.status.replace('_', ' ')}
                      color={getStatusColor(selectedOrder.status) as any}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Order Details</Typography>
                    <Typography variant="body1">{selectedOrder.order_details}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Delivery Address</Typography>
                    <Typography variant="body1">{selectedOrder.delivery_address}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Contact Person</Typography>
                    <Typography variant="body1">{selectedOrder.contact_person}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Contact Phone</Typography>
                    <Typography variant="body1">{selectedOrder.contact_phone}</Typography>
                  </Grid>
                  {selectedOrder.notes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                      <Typography variant="body1">{selectedOrder.notes}</Typography>
                    </Grid>
                  )}
              </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOrderDetailsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog open={statusUpdateOpen} onClose={() => setStatusUpdateOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogContent>
            {selectedOrder && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" gutterBottom>
                  Update order <strong>{selectedOrder.order_number}</strong> status from{' '}
                  <Chip label={selectedOrder.status.replace('_', ' ')} size="small" /> to{' '}
                  <Chip label={getNextStatus(selectedOrder.status)?.replace('_', ' ')} size="small" color="primary" />
                </Typography>
                
                {getNextStatus(selectedOrder.status) === 'ORDER_IN_TRANSIT' && (
            <TextField
              fullWidth
                    label="Expected Delivery Date"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mt: 2 }}
                  />
                )}
                </Box>
              )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusUpdateOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleConfirmStatusUpdate}
              variant="contained"
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? <CircularProgress size={20} /> : 'Update Status'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Stock Status Dialog */}
        <Dialog open={stockStatusOpen} onClose={() => setStockStatusOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedCause ? 'Update Stock Status' : 'Add Stock Status'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Status"
                    value={stockFormData.status}
                    onChange={(e) => setStockFormData({ ...stockFormData, status: e.target.value })}
                    SelectProps={{ native: true }}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="LIMITED">Limited Stock</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Available Quantity"
                    type="number"
                    value={stockFormData.available_quantity}
                    onChange={(e) => setStockFormData({ ...stockFormData, available_quantity: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Unit"
                    value={stockFormData.unit}
                    onChange={(e) => setStockFormData({ ...stockFormData, unit: e.target.value })}
                    placeholder="e.g., pieces, kg, liters"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Price per Unit (₹)"
                    type="number"
                    value={stockFormData.price_per_unit}
                    onChange={(e) => setStockFormData({ ...stockFormData, price_per_unit: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={stockFormData.notes}
                    onChange={(e) => setStockFormData({ ...stockFormData, notes: e.target.value })}
                    placeholder="Additional information about stock availability..."
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStockStatusOpen(false)}>Cancel</Button>
            <Button 
              variant="contained"
              onClick={() => {
                if (selectedCause) {
                  // Update existing stock status
                  updateStockMutation.mutate({
                    cause_id: selectedCause.cause_id,
                    status: stockFormData.status,
                    available_quantity: parseInt(stockFormData.available_quantity),
                    unit: stockFormData.unit,
                    price_per_unit: parseFloat(stockFormData.price_per_unit),
                    notes: stockFormData.notes
                  })
                } else {
                  // Add new stock status - need to select a cause first
                  // This would require a cause selection dialog
                  alert('Please select a cause first')
                }
              }}
              disabled={updateStockMutation.isPending}
            >
              {updateStockMutation.isPending ? 'Updating...' : 'Update Stock'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  )
}

export default VendorPortal