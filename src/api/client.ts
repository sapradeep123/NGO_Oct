import axios, { AxiosInstance, AxiosResponse } from 'axios'

// Types for API responses
export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  phone?: string
  is_active: boolean
  created_at: string
  role?: string
  ngo_id?: number
  ngo_name?: string
  vendor_id?: number
  vendor_name?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface Category {
  id: number
  name: string
  description: string
}

export interface Tenant {
  id: number
  name: string
  slug: string
  description: string
  logo_url?: string
  website_url?: string
  contact_email?: string
  contact_phone?: string
  address?: string
}

export interface Cause {
  id: number
  tenant_id?: number
  category_id?: number
  title: string
  description: string
  target_amount: number
  current_amount: number
  type?: 'VENDOR' | 'NGO_MANAGED'
  status: 'DRAFT' | 'LIVE' | 'FUNDED' | 'FULFILLED' | 'CLOSED' | 'PENDING_APPROVAL'
  policy_flags_json?: Record<string, any>
  created_at: string
  updated_at?: string
  tenant?: Tenant
  category?: Category
  // Direct properties from backend
  ngo_name?: string
  category_name?: string
  image_url?: string
  donation_count?: number
}

export interface DonationInitRequest {
  cause_id: number
  amount: number
  currency?: string
}

export interface DonationInitResponse {
  order_id: string
  amount: number
  currency: string
  razorpay_order_id?: string
}

export interface VendorInvoice {
  id: number
  cause_id: number
  vendor_id: number
  number: string
  amount: number
  files: string[]
  status: 'SUBMITTED' | 'NGO_APPROVED' | 'PAID' | 'REJECTED'
  created_at: string
  updated_at: string
}

export interface NGOReceipt {
  id: number
  cause_id: number
  amount: number
  files: string[]
  note?: string
  status: 'SUBMITTED' | 'ADMIN_APPROVED' | 'REJECTED'
  created_at: string
  updated_at: string
}

export interface Payout {
  id: number
  to_type: 'VENDOR' | 'NGO'
  to_id: number
  amount: number
  currency: string
  pg_payout_id?: string
  status: 'INIT' | 'QUEUED' | 'PROCESSED' | 'FAILED'
  created_at: string
  updated_at: string
}

export interface TenantByHostResponse {
  mode: 'MICROSITE' | 'MARKETPLACE'
  tenant?: Tenant
  theme?: {
    primary_color?: string
    secondary_color?: string
    logo_url?: string
  }
}

export interface DemoUser {
  email: string
  password: string
  role: string
  tenant?: string
}

export interface DemoUsersResponse {
  users: DemoUser[]
}

class ApiClient {
  private client: AxiosInstance
  private baseURL: string

  constructor() {
    // Use environment variable or fallback to localhost for development
    this.baseURL = (import.meta as any).env?.VITE_API_BASE_URL || 
                   (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                    ? 'http://localhost:8002' 
                    : `${window.location.protocol}//${window.location.hostname}:8002`)
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add request interceptor to include auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      // Don't set Content-Type for FormData - let the browser handle it
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type']
      }
      
      return config
    })

    // Add response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const formData = new FormData()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)
    
    const response: AxiosResponse<LoginResponse> = await this.client.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.client.get('/auth/me')
    return response.data
  }

  // Public endpoints
  async getCategories(): Promise<Category[]> {
    const response: AxiosResponse<{ value: Category[]; Count: number }> = await this.client.get('/public/categories')
    return response.data.value || []
  }

  async getNGOs(): Promise<Tenant[]> {
    const response: AxiosResponse<{ value: Tenant[]; Count: number }> = await this.client.get('/public/ngos')
    return response.data.value || []
  }

  async getCauses(params?: { tenant?: string; status?: string; category?: string }): Promise<Cause[]> {
    const response: AxiosResponse<{ value: Cause[]; Count: number }> = await this.client.get('/public/causes', { params })
    return response.data.value || []
  }

  async getAdminCauses(): Promise<Cause[]> {
    const response: AxiosResponse<{ value: Cause[]; Count: number }> = await this.client.get('/admin/causes')
    return response.data.value || []
  }

  // Domain Management Methods
  async getAdminDomains(): Promise<any[]> {
    const response: AxiosResponse<{ value: any[]; Count: number }> = await this.client.get('/admin/domains')
    return response.data.value || []
  }

  async createDomain(host: string, isPrimary: boolean = false): Promise<any> {
    const formData = new FormData()
    formData.append('host', host)
    formData.append('is_primary', isPrimary.toString())
    
    const response: AxiosResponse<any> = await this.client.post('/admin/domains', formData)
    return response.data
  }

  async verifyDomain(domainId: number): Promise<any> {
    const response: AxiosResponse<any> = await this.client.post(`/admin/domains/${domainId}/verify`)
    return response.data
  }

  async deleteDomain(domainId: number): Promise<any> {
    const response: AxiosResponse<any> = await this.client.delete(`/admin/domains/${domainId}`)
    return response.data
  }

  async getTenantBySlug(slug: string): Promise<Tenant> {
    const response: AxiosResponse<Tenant> = await this.client.get(`/tenant/${slug}`)
    return response.data
  }

  async getTenantByHost(host: string): Promise<TenantByHostResponse> {
    const response: AxiosResponse<TenantByHostResponse> = await this.client.get('/public/tenants/by-host', {
      params: { host }
    })
    return response.data
  }

  // Donation endpoints (removed duplicates - using newer implementations below)

  // Vendor endpoints

  async linkVendorToCause(causeId: number, vendorLink: any): Promise<any> {
    const response = await this.client.post(`/causes/${causeId}/vendors`, vendorLink)
    return response.data
  }

  async createVendorInvoice(invoiceData: FormData): Promise<VendorInvoice> {
    const response: AxiosResponse<VendorInvoice> = await this.client.post('/vendor-invoices', invoiceData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async approveVendorInvoice(invoiceId: number): Promise<any> {
    const response = await this.client.patch(`/vendor-invoices/${invoiceId}/approve`)
    return response.data
  }

  async getVendorInvoice(invoiceId: number): Promise<VendorInvoice> {
    const response: AxiosResponse<VendorInvoice> = await this.client.get(`/vendor-invoices/${invoiceId}`)
    return response.data
  }

  // NGO Receipt endpoints
  async createNGOReceipt(receiptData: FormData): Promise<NGOReceipt> {
    const response: AxiosResponse<NGOReceipt> = await this.client.post('/ngo-receipts', receiptData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async approveNGOReceipt(receiptId: number): Promise<any> {
    const response = await this.client.patch(`/ngo-receipts/${receiptId}/approve`)
    return response.data
  }

  async getNGOReceipt(receiptId: number): Promise<NGOReceipt> {
    const response: AxiosResponse<NGOReceipt> = await this.client.get(`/ngo-receipts/${receiptId}`)
    return response.data
  }

  // Payout endpoints
  async getPayout(payoutId: number): Promise<Payout> {
    const response: AxiosResponse<Payout> = await this.client.get(`/payouts/${payoutId}`)
    return response.data
  }

  // Upload endpoints
  async getPresignedUploadUrl(filename: string, contentType: string): Promise<any> {
    const response = await this.client.post('/uploads/presign', null, {
      params: { filename, content_type: contentType }
    })
    return response.data
  }

  async verifyFileUpload(fileUrl: string, fileHash: string, purpose: string): Promise<any> {
    const response = await this.client.post('/uploads/verify', {
      file_url: fileUrl,
      file_hash: fileHash,
      purpose
    })
    return response.data
  }

  // Demo endpoints
  async getDemoUsers(): Promise<DemoUsersResponse> {
    const response: AxiosResponse<DemoUsersResponse> = await this.client.get('/demo/users')
    return response.data
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await this.client.get('/healthz')
    return response.data
  }

  // Admin API methods
  async getAdminNGOs(): Promise<any[]> {
    const response: AxiosResponse<{ value: any[]; Count: number }> = await this.client.get('/admin/ngos')
    return response.data.value || []
  }

  async getAdminVendors(): Promise<any[]> {
    const response: AxiosResponse<{ value: any[]; Count: number }> = await this.client.get('/admin/vendors')
    return response.data.value || []
  }

  async getAdminDonors(): Promise<any[]> {
    const response: AxiosResponse<{ value: any[]; Count: number }> = await this.client.get('/admin/donors')
    return response.data.value || []
  }

  async getAdminPayments(): Promise<any> {
    const response = await this.client.get('/admin/payments')
    return response.data
  }

  // Admin Management API methods
  async createNGO(data: any): Promise<any> {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key])
      }
    })
    const response = await this.client.post('/admin/ngos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  async createVendor(data: any): Promise<any> {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key])
      }
    })
    const response = await this.client.post('/admin/vendors', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  async createCategory(data: any): Promise<any> {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key])
      }
    })
    const response = await this.client.post('/admin/categories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  async createCause(data: any): Promise<any> {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key])
      }
    })
    const response = await this.client.post('/admin/causes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  async createNgoCause(data: any): Promise<any> {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key])
      }
    })
    const response = await this.client.post('/ngo/causes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  async getPendingCauses(): Promise<any[]> {
    const response: AxiosResponse<{ value: any[]; Count: number }> = await this.client.get('/admin/pending-causes')
    return response.data.value || []
  }

  async approveCause(causeId: number): Promise<any> {
    const response = await this.client.post(`/admin/causes/${causeId}/approve`)
    return response.data
  }

  async rejectCause(causeId: number, reason: string): Promise<any> {
    const formData = new FormData()
    formData.append('reason', reason)
    const response = await this.client.post(`/admin/causes/${causeId}/reject`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  // NGO-Vendor Association Management API methods
  async getNgoVendorAssociations(): Promise<any[]> {
    const response: AxiosResponse<{ value: any[]; Count: number }> = await this.client.get('/admin/ngo-vendor-associations')
    return response.data.value || []
  }

  async createNgoVendorAssociation(ngoId: number, vendorId: number, categoryId: number): Promise<any> {
    const formData = new FormData()
    formData.append('ngo_id', ngoId.toString())
    formData.append('vendor_id', vendorId.toString())
    formData.append('category_id', categoryId.toString())
    const response = await this.client.post('/admin/ngo-vendor-associations', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  async deleteNgoVendorAssociation(associationId: number): Promise<any> {
    const response = await this.client.delete(`/admin/ngo-vendor-associations/${associationId}`)
    return response.data
  }

  async getNgoVendors(ngoId: number): Promise<any[]> {
    const response: AxiosResponse<{ value: any[]; Count: number }> = await this.client.get(`/admin/ngos/${ngoId}/vendors`)
    return response.data.value || []
  }

  async getVendorNgos(vendorId: number): Promise<any[]> {
    const response: AxiosResponse<{ value: any[]; Count: number }> = await this.client.get(`/admin/vendors/${vendorId}/ngos`)
    return response.data.value || []
  }

  async getCategoryAssociations(categoryId: number): Promise<any[]> {
    const response: AxiosResponse<{ value: any[]; Count: number }> = await this.client.get(`/admin/categories/${categoryId}/ngo-vendor-associations`)
    return response.data.value || []
  }

  // Detailed Vendor and NGO View API methods

  async getNgoDetails(ngoId: number): Promise<any> {
    const response = await this.client.get(`/admin/ngos/${ngoId}/details`)
    return response.data
  }

  async getDonorDetails(donorId: number): Promise<any> {
    const response = await this.client.get(`/admin/donors/${donorId}/details`)
    return response.data
  }

  // User Management API methods
  async getAdminUsers(): Promise<any[]> {
    const response: AxiosResponse<{ value: any[]; Count: number }> = await this.client.get('/admin/users')
    return response.data.value || []
  }

  async resetUserPassword(userId: number, newPassword: string): Promise<any> {
    const formData = new FormData()
    formData.append('new_password', newPassword)
    const response = await this.client.post(`/admin/users/${userId}/reset-password`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  async createUser(userData: any): Promise<any> {
    const formData = new FormData()
    Object.keys(userData).forEach(key => {
      if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key])
      }
    })
    const response = await this.client.post('/admin/users', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  async updateUser(userId: number, userData: any): Promise<any> {
    const formData = new FormData()
    Object.keys(userData).forEach(key => {
      if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key])
      }
    })
    const response = await this.client.put(`/admin/users/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  async uploadNgoPhoto(photo: File, ngoId: number): Promise<any> {
    const formData = new FormData()
    formData.append('photo', photo)
    formData.append('ngo_id', ngoId.toString())
    const response = await this.client.post('/admin/ngo/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  async getVendorDetails(vendorId: number): Promise<any> {
    const response = await this.client.get(`/admin/vendors/${vendorId}/details`)
    return response.data
  }

  async getTenantAboutPage(slug: string): Promise<any> {
    const response = await this.client.get(`/tenant/${slug}/about`)
    return response.data
  }

  async getTenantContactPage(slug: string): Promise<any> {
    const response = await this.client.get(`/tenant/${slug}/contact`)
    return response.data
  }

  async updateNgoAboutPage(ngoId: number, aboutData: any): Promise<any> {
    const response = await this.client.put(`/admin/ngo/${ngoId}/about`, aboutData)
    return response.data
  }

  async updateNgoContactPage(ngoId: number, contactData: any): Promise<any> {
    const response = await this.client.put(`/admin/ngo/${ngoId}/contact`, contactData)
    return response.data
  }

  async createDonation(donationData: any): Promise<any> {
    const response = await this.client.post('/donations', donationData)
    return response.data
  }

  async getDonationStatus(donationId: number): Promise<any> {
    const response = await this.client.get(`/donations/${donationId}`)
    return response.data
  }

  // Runtime config
  async getRuntimeConfig(): Promise<{ apiBaseUrl: string }> {
    const response = await this.client.get('/.well-known/runtime-config')
    return response.data
  }

  // Order Management API methods
  async getVendorOrders(): Promise<any[]> {
    const response: AxiosResponse<{ value: any[]; Count: number }> = await this.client.get('/vendor/orders')
    return response.data.value || []
  }

  async getOrderDetails(orderId: number): Promise<any> {
    const response: AxiosResponse<any> = await this.client.get(`/vendor/orders/${orderId}`)
    return response.data
  }

  async updateOrderStatus(orderId: number, statusData: { status: string; delivery_date?: string }): Promise<any> {
    const response: AxiosResponse<any> = await this.client.put(`/vendor/orders/${orderId}/status`, statusData)
    return response.data
  }

  // Donor Order API methods
  async getDonorOrders(): Promise<any[]> {
    const response: AxiosResponse<{ value: any[]; Count: number }> = await this.client.get('/donor/orders')
    return response.data.value || []
  }

  async getNgoOrders(): Promise<any[]> {
    const response: AxiosResponse<{ value: any[]; Count: number }> = await this.client.get('/ngo/orders')
    return response.data.value || []
  }

  async confirmOrderDelivery(orderId: number): Promise<any> {
    const response: AxiosResponse<any> = await this.client.put(`/ngo/orders/${orderId}/confirm`)
    return response.data
  }

  // Vendor Association API methods
  async getVendorAssociations(): Promise<any> {
    const response: AxiosResponse<any> = await this.client.get('/vendor/associations')
    return response.data
  }

  async updateStockStatus(stockData: {
    cause_id: number;
    status: string;
    available_quantity: number;
    unit?: string;
    price_per_unit?: number;
    notes: string;
  }): Promise<any> {
    const response: AxiosResponse<any> = await this.client.post('/vendor/stock-status', stockData)
    return response.data
  }

  async getVendorStockStatus(): Promise<any[]> {
    const response: AxiosResponse<{ value: any[]; Count: number }> = await this.client.get('/vendor/stock-status')
    return response.data.value || []
  }

  // Donor-specific API methods

  async getCauseDeliveryStatus(causeId: number): Promise<any> {
    const response: AxiosResponse<any> = await this.client.get(`/donor/causes/${causeId}/status`)
    return response.data
  }

  async getDonorTaxDocuments(): Promise<any[]> {
    const response: AxiosResponse<{ value: any[]; Count: number }> = await this.client.get('/donor/tax-documents')
    return response.data.value || []
  }

  async getDonorTickets(): Promise<any[]> {
    const response: AxiosResponse<{ value: any[]; Count: number }> = await this.client.get('/donor/tickets')
    return response.data.value || []
  }

  async createDonorTicket(ticketData: { cause_id: number; cause_title: string; ngo_name: string; subject: string; description: string; priority?: string }): Promise<any> {
    const response: AxiosResponse<any> = await this.client.post('/donor/tickets', ticketData)
    return response.data
  }

  // Admin ticket management
  async getAdminTickets(): Promise<any[]> {
    const response: AxiosResponse<{ value: any[]; Count: number }> = await this.client.get('/admin/tickets')
    return response.data.value || []
  }

  async updateTicket(ticketId: number, updateData: { status?: string; admin_response?: string }): Promise<any> {
    const response: AxiosResponse<any> = await this.client.put(`/admin/tickets/${ticketId}`, updateData)
    return response.data
  }

  // Donation API methods
  async initDonation(donationData: { cause_id: number; amount: number; donor_name: string; donor_email: string; donor_phone?: string }): Promise<any> {
    console.log('API Client - initDonation called with:', donationData)
    
    const formData = new FormData()
    formData.append('cause_id', donationData.cause_id.toString())
    formData.append('amount', donationData.amount.toString())
    formData.append('donor_name', donationData.donor_name)
    formData.append('donor_email', donationData.donor_email)
    if (donationData.donor_phone) {
      formData.append('donor_phone', donationData.donor_phone)
    }
    
    console.log('API Client - FormData contents:')
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`)
    }
    
    const response: AxiosResponse<any> = await this.client.post('/donations/init', formData)
    console.log('API Client - Response received:', response.data)
    return response.data
  }

  async verifyDonation(verificationData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }): Promise<any> {
    const formData = new FormData()
    formData.append('razorpay_order_id', verificationData.razorpay_order_id)
    formData.append('razorpay_payment_id', verificationData.razorpay_payment_id)
    formData.append('razorpay_signature', verificationData.razorpay_signature)
    
    const response: AxiosResponse<any> = await this.client.post('/donations/verify', formData)
    return response.data
  }

  async getDonation(donationId: number): Promise<any> {
    const response: AxiosResponse<any> = await this.client.get(`/donations/${donationId}`)
    return response.data
  }

  async getDonationReceipt(donationId: number): Promise<any> {
    const response: AxiosResponse<any> = await this.client.get(`/donations/${donationId}/receipt`)                                                              
    return response.data
  }

  // Donation History API methods
  async getDonorDonations(): Promise<any> {
    const response = await this.client.get('/donor/donations')
    return response.data
  }

  async getDonorDonationsByNgo(ngoSlug: string): Promise<any> {
    const response = await this.client.get(`/donor/donations/${ngoSlug}`)
    return response.data
  }

  async getDonorDonationsByCause(causeId: number): Promise<any> {
    const response = await this.client.get(`/donor/donations/cause/${causeId}`)
    return response.data
  }

  // Email and Website Settings API methods
  async getEmailSettings(): Promise<any> {
    const response = await this.client.get('/admin/email-settings')
    return response.data
  }

  async updateEmailSettings(emailData: any): Promise<any> {
    const formData = new FormData()
    Object.keys(emailData).forEach(key => {
      if (emailData[key] !== null && emailData[key] !== undefined) {
        formData.append(key, emailData[key].toString())
      }
    })
    const response = await this.client.put('/admin/email-settings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  async getWebsiteSettings(): Promise<any> {
    const response = await this.client.get('/admin/website-settings')
    return response.data
  }

  async updateWebsiteSettings(websiteData: any): Promise<any> {
    const formData = new FormData()
    Object.keys(websiteData).forEach(key => {
      if (websiteData[key] !== null && websiteData[key] !== undefined) {
        formData.append(key, websiteData[key].toString())
      }
    })
    const response = await this.client.put('/admin/website-settings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }

  async sendPasswordResetEmail(userEmail: string): Promise<any> {
    const formData = new FormData()
    formData.append('user_email', userEmail)
    const response = await this.client.post('/admin/send-password-reset', formData)
    return response.data
  }

  async sendWelcomeEmail(userEmail: string, userRole: string): Promise<any> {
    const formData = new FormData()
    formData.append('user_email', userEmail)
    formData.append('user_role', userRole)
    const response = await this.client.post('/admin/send-welcome-email', formData)
    return response.data
  }

  async sendDonationInvoice(donorEmail: string, donorName: string, causeTitle: string, amount: number, transactionId: string): Promise<any> {
    const formData = new FormData()
    formData.append('donor_email', donorEmail)
    formData.append('donor_name', donorName)
    formData.append('cause_title', causeTitle)
    formData.append('amount', amount.toString())
    formData.append('transaction_id', transactionId)
    const response = await this.client.post('/admin/send-donation-invoice', formData)
    return response.data
  }

  // File upload API methods
  async uploadLogo(file: File): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await this.client.post('/admin/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async uploadFavicon(file: File): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await this.client.post('/admin/upload-favicon', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
}

export const apiClient = new ApiClient()
export default apiClient
