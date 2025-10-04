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
    this.baseURL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000'
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

  async getTenantBySlug(slug: string): Promise<Tenant> {
    const response: AxiosResponse<Tenant> = await this.client.get(`/public/tenants/${slug}`)
    return response.data
  }

  async getTenantByHost(host: string): Promise<TenantByHostResponse> {
    const response: AxiosResponse<TenantByHostResponse> = await this.client.get('/public/tenants/by-host', {
      params: { host }
    })
    return response.data
  }

  // Donation endpoints
  async initDonation(donation: DonationInitRequest): Promise<DonationInitResponse> {
    const response: AxiosResponse<DonationInitResponse> = await this.client.post('/donations/init', donation)
    return response.data
  }

  async getDonationReceipt(donationId: number): Promise<any> {
    const response = await this.client.get(`/donations/${donationId}/receipt`)
    return response.data
  }

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

  // Runtime config
  async getRuntimeConfig(): Promise<{ apiBaseUrl: string }> {
    const response = await this.client.get('/.well-known/runtime-config')
    return response.data
  }
}

export const apiClient = new ApiClient()
export default apiClient
