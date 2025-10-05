# In-memory storage for demo purposes
from fastapi import FastAPI, Form, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime

# Helper function to get current user from request
async def get_current_user_from_request(request: Request):
    """Extract current user information from the request token"""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return {
            "id": 1,
            "email": "admin@example.com",
            "first_name": "Admin",
            "last_name": "User",
            "role": "PLATFORM_ADMIN",
            "is_active": True,
            "created_at": "2024-01-01T00:00:00Z"
        }
    
    token = auth_header[7:]  # Remove "Bearer " prefix
    
    if token.startswith("demo_token_"):
        email = token[11:]  # Remove "demo_token_" prefix
        
        if email == "admin@example.com":
            return {
                "id": 1,
                "email": "admin@example.com",
                "first_name": "Admin",
                "last_name": "User",
                "role": "PLATFORM_ADMIN",
                "is_active": True,
                "created_at": "2024-01-01T00:00:00Z"
            }
        
        # Check NGO users
        for ngo in ngos_storage:
            ngo_admin_email = f"ngo.{ngo['slug']}.admin@example.com"
            ngo_staff_email = f"ngo.{ngo['slug']}.staff@example.com"
            
            if email == ngo_admin_email:
                return {
                    "id": len(ngos_storage) * 2 + 1,
                    "email": email,
                    "first_name": ngo['name'].split()[0],
                    "last_name": "Admin",
                    "role": "NGO_ADMIN",
                    "is_active": True,
                    "created_at": ngo['created_at'],
                    "ngo_id": ngo['id'],
                    "ngo_name": ngo['name']
                }
            elif email == ngo_staff_email:
                return {
                    "id": len(ngos_storage) * 2 + 2,
                    "email": email,
                    "first_name": ngo['name'].split()[0],
                    "last_name": "Staff",
                    "role": "NGO_STAFF",
                    "is_active": True,
                    "created_at": ngo['created_at'],
                    "ngo_id": ngo['id'],
                    "ngo_name": ngo['name']
                }
        
        # Check Vendor users
        for vendor in vendors_storage:
            vendor_email = f"vendor.{vendor['name'].lower().replace(' ', '.')}@example.com"
            if email == vendor_email:
                return {
                    "id": len(ngos_storage) * 2 + len(vendors_storage) + 1,
                    "email": email,
                    "first_name": vendor['name'].split()[0],
                    "last_name": "Vendor",
                    "role": "VENDOR",
                    "is_active": True,
                    "created_at": vendor['created_at'],
                    "vendor_id": vendor['id'],
                    "vendor_name": vendor['name']
                }
        
        # Check Donor users
        for donor in donors_storage:
            if email == donor['email']:
                return {
                    "id": len(ngos_storage) * 2 + len(vendors_storage) + len(donors_storage) + 1,
                    "email": email,
                    "first_name": donor['name'].split()[0],
                    "last_name": donor['name'].split()[-1] if len(donor['name'].split()) > 1 else "",
                    "role": "DONOR",
                    "is_active": True,
                    "created_at": "2024-01-01T00:00:00Z"
                }
    
    # Default to admin if token not recognized
    return {
        "id": 1,
        "email": "admin@example.com",
        "first_name": "Admin",
        "last_name": "User",
        "role": "PLATFORM_ADMIN",
        "is_active": True,
        "created_at": "2024-01-01T00:00:00Z"
    }

categories_storage = [
    {
        "id": 1,
        "name": "Food & Nutrition",
        "description": "Providing meals and nutritional support to those in need",
        "created_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": 2,
        "name": "Education",
        "description": "Supporting educational programs and school infrastructure",
        "created_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": 3,
        "name": "Healthcare",
        "description": "Medical care, medicines, and health awareness programs",
        "created_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": 4,
        "name": "Emergency Relief",
        "description": "Disaster response and emergency assistance",
        "created_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": 5,
        "name": "Women & Children",
        "description": "Programs supporting women and children welfare",
        "created_at": "2024-01-01T00:00:00Z"
    }
]

ngos_storage = [
    {
        "id": 1, "name": "Hope Trust", "slug": "hope-trust",
        "description": "Dedicated to providing hope and support to communities in need through education, healthcare, and emergency relief programs.",
        "logo_url": "https://picsum.photos/200/200?random=1",
        "contact_email": "contact@hopetrust.org", "website_url": "https://hopetrust.org",
        "phone": "+91-9876543210", "address": "123 Hope Street, Mumbai, Maharashtra 400001",
        "status": "ACTIVE", "created_at": "2024-01-01T00:00:00Z",
        "total_donations": 125000, "total_causes": 3, "verified": True,
        "photo_gallery": [
            "https://picsum.photos/400/300?random=11",
            "https://picsum.photos/400/300?random=12",
            "https://picsum.photos/400/300?random=13",
            "https://picsum.photos/400/300?random=14"
        ],
        "contact_person": "Dr. Sarah Johnson",
        "contact_phone": "+91-9876543210",
        "contact_email": "sarah@hopetrust.org",
        "registration_number": "NGO/2024/001",
        "pan_number": "AAACH1234H",
        "bank_details": {
            "account_number": "1234567890",
            "bank_name": "State Bank of India",
            "ifsc_code": "SBIN0001234",
            "branch": "Mumbai Main Branch"
        }
    },
    {
        "id": 2, "name": "Care Works", "slug": "care-works",
        "description": "Committed to improving healthcare access and quality through mobile clinics, health awareness programs, and medical equipment distribution.",
        "logo_url": "https://picsum.photos/200/200?random=2",
        "contact_email": "info@careworks.org", "website_url": "https://careworks.org",
        "phone": "+91-9876543211", "address": "456 Care Avenue, Delhi, Delhi 110001",
        "status": "ACTIVE", "created_at": "2024-01-02T00:00:00Z",
        "total_donations": 300000, "total_causes": 5, "verified": True,
        "photo_gallery": [
            "https://picsum.photos/400/300?random=21",
            "https://picsum.photos/400/300?random=22",
            "https://picsum.photos/400/300?random=23",
            "https://picsum.photos/400/300?random=24"
        ],
        "contact_person": "Dr. Rajesh Kumar",
        "contact_phone": "+91-9876543211",
        "contact_email": "rajesh@careworks.org",
        "registration_number": "NGO/2024/002",
        "pan_number": "AAACH1235H",
        "bank_details": {
            "account_number": "2345678901",
            "bank_name": "HDFC Bank",
            "ifsc_code": "HDFC0001234",
            "branch": "Delhi Central Branch"
        }
    },
    {
        "id": 3, "name": "Health First Foundation", "slug": "health-first",
        "description": "Promoting health and wellness in underserved communities through preventive healthcare, nutrition programs, and health education initiatives.",
        "logo_url": "https://picsum.photos/200/200?random=3",
        "contact_email": "contact@healthfirst.org", "website_url": "https://healthfirst.org",
        "phone": "+91-9876543212", "address": "789 Health Road, Bangalore, Karnataka 560001",
        "status": "ACTIVE", "created_at": "2024-01-03T00:00:00Z",
        "total_donations": 200000, "total_causes": 4, "verified": True,
        "photo_gallery": [
            "https://picsum.photos/400/300?random=31",
            "https://picsum.photos/400/300?random=32",
            "https://picsum.photos/400/300?random=33",
            "https://picsum.photos/400/300?random=34"
        ],
        "contact_person": "Dr. Priya Sharma",
        "contact_phone": "+91-9876543212",
        "contact_email": "priya@healthfirst.org",
        "registration_number": "NGO/2024/003",
        "pan_number": "AAACH1236H",
        "bank_details": {
            "account_number": "3456789012",
            "bank_name": "ICICI Bank",
            "ifsc_code": "ICIC0001234",
            "branch": "Bangalore Main Branch"
        }
    }
]

# Donor storage for detailed donor information
donors_storage = [
    {
        "id": 1,
        "name": "John Smith",
        "email": "john.smith@email.com",
        "phone": "+91-9876543210",
        "address": "123 Main Street, Mumbai, Maharashtra 400001",
        "total_donations": 50000,
        "donation_count": 12,
        "last_donation_date": "2024-01-15T00:00:00Z",
        "preferred_categories": ["Education", "Healthcare"],
        "donation_history": [
            {
                "id": 1,
                "cause_id": 1,
                "cause_title": "Emergency Food Relief",
                "ngo_name": "Hope Trust",
                "amount": 5000,
                "date": "2024-01-15T00:00:00Z",
                "status": "COMPLETED"
            },
            {
                "id": 2,
                "cause_id": 2,
                "cause_title": "School Supplies Drive",
                "ngo_name": "Hope Trust",
                "amount": 10000,
                "date": "2024-01-10T00:00:00Z",
                "status": "COMPLETED"
            }
        ],
        "payment_methods": ["Credit Card", "UPI"],
        "tax_exemption": True,
        "pan_number": "ABCDE1234F"
    },
    {
        "id": 2,
        "name": "Sarah Johnson",
        "email": "sarah.johnson@email.com",
        "phone": "+91-9876543211",
        "address": "456 Park Avenue, Delhi, Delhi 110001",
        "total_donations": 75000,
        "donation_count": 8,
        "last_donation_date": "2024-01-12T00:00:00Z",
        "preferred_categories": ["Healthcare", "Emergency Relief"],
        "donation_history": [
            {
                "id": 3,
                "cause_id": 3,
                "cause_title": "Medical Equipment Fund",
                "ngo_name": "Care Works",
                "amount": 15000,
                "date": "2024-01-12T00:00:00Z",
                "status": "COMPLETED"
            },
            {
                "id": 4,
                "cause_id": 4,
                "cause_title": "Emergency Relief Fund",
                "ngo_name": "Care Works",
                "amount": 20000,
                "date": "2024-01-08T00:00:00Z",
                "status": "COMPLETED"
            }
        ],
        "payment_methods": ["Bank Transfer", "UPI"],
        "tax_exemption": True,
        "pan_number": "FGHIJ5678K"
    },
    {
        "id": 3,
        "name": "Michael Brown",
        "email": "michael.brown@email.com",
        "phone": "+91-9876543212",
        "address": "789 Garden Road, Bangalore, Karnataka 560001",
        "total_donations": 100000,
        "donation_count": 15,
        "last_donation_date": "2024-01-18T00:00:00Z",
        "preferred_categories": ["Education", "Women & Children"],
        "donation_history": [
            {
                "id": 5,
                "cause_id": 5,
                "cause_title": "Educational Materials Fund",
                "ngo_name": "Health First Foundation",
                "amount": 25000,
                "date": "2024-01-18T00:00:00Z",
                "status": "COMPLETED"
            },
            {
                "id": 6,
                "cause_id": 6,
                "cause_title": "Women Empowerment Program",
                "ngo_name": "Health First Foundation",
                "amount": 30000,
                "date": "2024-01-14T00:00:00Z",
                "status": "COMPLETED"
            }
        ],
        "payment_methods": ["Credit Card", "Bank Transfer"],
        "tax_exemption": True,
        "pan_number": "KLMNO9012P"
    }
]

vendors_storage = [
    {
        "id": 1, "name": "Alpha Supplies", "gstin": "29ABCDE1234F1Z5",
        "contact_email": "contact@alphasupplies.com", "phone": "+91-9876543210",
        "address": "123 Business Park, Mumbai, Maharashtra",
        "kyc_status": "VERIFIED", "tenant_name": "Hope Trust",
        "created_at": "2024-01-01T00:00:00Z", "total_invoices": 12, "total_amount": 45000
    },
    {
        "id": 2, "name": "Beta Medical", "gstin": "29FGHIJ5678K2L6",
        "contact_email": "info@betamedical.com", "phone": "+91-9876543211",
        "address": "456 Medical Complex, Delhi, Delhi",
        "kyc_status": "PENDING", "tenant_name": "Care Works",
        "created_at": "2024-01-05T00:00:00Z", "total_invoices": 8, "total_amount": 25000
    },
    {
        "id": 3, "name": "Gamma Educational", "gstin": "29MNOPQ9012R3S7",
        "contact_email": "sales@gammaedu.com", "phone": "+91-9876543212",
        "address": "789 Education Hub, Bangalore, Karnataka",
        "kyc_status": "VERIFIED", "tenant_name": "Health First Foundation",
        "created_at": "2024-01-08T00:00:00Z", "total_invoices": 15, "total_amount": 75000
    }
]

causes_storage = [
    {
        "id": 1,
        "title": "Daily Meals for Children",
        "description": "Providing nutritious meals to 500 children daily in rural schools",
        "target_amount": 150000,
        "current_amount": 75000,
        "status": "LIVE",
        "category_id": 1,
        "ngo_ids": [1],  # Hope Trust
        "category_name": "Food & Nutrition",
        "ngo_names": ["Hope Trust"],
        "image_url": "https://picsum.photos/400/300?random=101",
        "created_at": "2024-01-05T00:00:00Z",
        "donation_count": 45
    },
    {
        "id": 2,
        "title": "School Infrastructure Development",
        "description": "Building new classrooms and library for underprivileged students",
        "target_amount": 300000,
        "current_amount": 180000,
        "status": "LIVE",
        "category_id": 2,
        "ngo_ids": [2],  # Care Works
        "category_name": "Education",
        "ngo_names": ["Care Works"],
        "image_url": "https://picsum.photos/400/300?random=102",
        "created_at": "2024-01-08T00:00:00Z",
        "donation_count": 32
    },
    {
        "id": 3,
        "title": "Mobile Health Clinic",
        "description": "Providing free medical checkups and medicines in remote villages",
        "target_amount": 200000,
        "current_amount": 120000,
        "status": "LIVE",
        "category_id": 3,
        "ngo_ids": [3],  # Health First Foundation
        "category_name": "Healthcare",
        "ngo_names": ["Health First Foundation"],
        "image_url": "https://picsum.photos/400/300?random=103",
        "created_at": "2024-01-10T00:00:00Z",
        "donation_count": 28
    },
    {
        "id": 4,
        "title": "Flood Relief Fund",
        "description": "Emergency assistance for families affected by recent floods",
        "target_amount": 250000,
        "current_amount": 95000,
        "status": "LIVE",
        "category_id": 4,
        "ngo_ids": [1],  # Hope Trust
        "category_name": "Emergency Relief",
        "ngo_names": ["Hope Trust"],
        "image_url": "https://picsum.photos/400/300?random=104",
        "created_at": "2024-01-12T00:00:00Z",
        "donation_count": 18
    },
    {
        "id": 5,
        "title": "Women Empowerment Program",
        "description": "Skill development and microfinance support for women entrepreneurs",
        "target_amount": 180000,
        "current_amount": 65000,
        "status": "LIVE",
        "category_id": 5,
        "ngo_ids": [2],  # Care Works
        "category_name": "Women & Children",
        "ngo_names": ["Care Works"],
        "image_url": "https://picsum.photos/400/300?random=105",
        "created_at": datetime.now().isoformat() + "Z",
        "donation_count": 22
    }
]

pending_causes_storage = [
    {
        "id": 6,
        "title": "Emergency Relief Fund",
        "description": "Urgent support for disaster victims",
        "target_amount": 100000,
        "current_amount": 0,
        "status": "PENDING_APPROVAL",
        "ngo_ids": [1],  # Hope Trust
        "category_name": "Emergency Relief",
        "ngo_names": ["Hope Trust"],
        "category_id": 4
    },
    {
        "id": 7,
        "title": "School Infrastructure",
        "description": "Building new classrooms for rural schools",
        "target_amount": 200000,
        "current_amount": 0,
        "status": "PENDING_APPROVAL",
        "ngo_ids": [2],  # Care Works
        "category_name": "Education",
        "ngo_names": ["Care Works"],
        "category_id": 2
    }
]

# NGO-Vendor associations (many-to-many with categories)
ngo_vendor_associations = [
    {
        "id": 1,
        "ngo_id": 1,  # Hope Trust
        "vendor_id": 1,  # Alpha Supplies
        "category_id": 1,  # Food & Nutrition
        "status": "ACTIVE",
        "created_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": 2,
        "ngo_id": 1,  # Hope Trust
        "vendor_id": 2,  # Beta Medical
        "category_id": 3,  # Healthcare
        "status": "ACTIVE",
        "created_at": "2024-01-02T00:00:00Z"
    },
    {
        "id": 3,
        "ngo_id": 2,  # Care Works
        "vendor_id": 3,  # Gamma Educational
        "category_id": 2,  # Education
        "status": "ACTIVE",
        "created_at": "2024-01-03T00:00:00Z"
    },
    {
        "id": 4,
        "ngo_id": 2,  # Care Works
        "vendor_id": 1,  # Alpha Supplies
        "category_id": 4,  # Emergency Relief
        "status": "ACTIVE",
        "created_at": "2024-01-04T00:00:00Z"
    },
    {
        "id": 5,
        "ngo_id": 3,  # Health First Foundation
        "vendor_id": 2,  # Beta Medical
        "category_id": 3,  # Healthcare
        "status": "ACTIVE",
        "created_at": "2024-01-05T00:00:00Z"
    }
]

# Invoice storage for detailed vendor views
invoices_storage = [
    {
        "id": 1,
        "vendor_id": 1,
        "ngo_id": 1,
        "cause_id": 1,
        "invoice_number": "INV-2024-001",
        "amount": 15000,
        "description": "Emergency food supplies for flood victims",
        "status": "PAID",
        "created_at": "2024-01-05T00:00:00Z",
        "paid_at": "2024-01-10T00:00:00Z"
    },
    {
        "id": 2,
        "vendor_id": 1,
        "ngo_id": 1,
        "cause_id": 2,
        "invoice_number": "INV-2024-002",
        "amount": 10000,
        "description": "Nutritional supplements for children",
        "status": "PENDING",
        "created_at": "2024-01-12T00:00:00Z",
        "paid_at": None
    },
    {
        "id": 3,
        "vendor_id": 2,
        "ngo_id": 2,
        "cause_id": 3,
        "invoice_number": "INV-2024-003",
        "amount": 25000,
        "description": "Medical equipment for rural clinic",
        "status": "PAID",
        "created_at": "2024-01-08T00:00:00Z",
        "paid_at": "2024-01-15T00:00:00Z"
    },
    {
        "id": 4,
        "vendor_id": 2,
        "ngo_id": 2,
        "cause_id": 4,
        "invoice_number": "INV-2024-004",
        "amount": 8000,
        "description": "Medicines for emergency relief",
        "status": "PENDING",
        "created_at": "2024-01-18T00:00:00Z",
        "paid_at": None
    },
    {
        "id": 5,
        "vendor_id": 3,
        "ngo_id": 3,
        "cause_id": 5,
        "invoice_number": "INV-2024-005",
        "amount": 30000,
        "description": "Educational materials and books",
        "status": "PAID",
        "created_at": "2024-01-10T00:00:00Z",
        "paid_at": "2024-01-20T00:00:00Z"
    },
    {
        "id": 6,
        "vendor_id": 3,
        "ngo_id": 3,
        "cause_id": 6,
        "invoice_number": "INV-2024-006",
        "amount": 12000,
        "description": "School supplies for rural students",
        "status": "PENDING",
        "created_at": "2024-01-22T00:00:00Z",
        "paid_at": None
    }
]

app = FastAPI(title="NGO Donations Platform", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "NGO Donations Platform API"}

@app.get("/healthz")
async def health_check():
    return {"status": "healthy"}

@app.get("/public/tenants/by-host")
async def get_tenant_by_host(host: str = "localhost"):
    return {
        "mode": "MARKETPLACE",
        "tenant": None,
        "theme": None
    }

@app.get("/demo/users")
async def get_demo_users():
    return {
        "users": [
            {
                "email": "admin@example.com",
                "password": "Admin@123",
                "role": "PLATFORM_ADMIN",
                "tenant": None
            },
            {
                "email": "ngo.hope.admin@example.com",
                "password": "Ngo@123",
                "role": "NGO_ADMIN",
                "tenant": "hope-trust"
            },
            {
                "email": "ngo.hope.staff@example.com",
                "password": "Staff@123",
                "role": "NGO_STAFF",
                "tenant": "hope-trust"
            },
            {
                "email": "vendor.alpha@example.com",
                "password": "Vendor@123",
                "role": "VENDOR",
                "tenant": "hope-trust"
            },
            {
                "email": "donor.arya@example.com",
                "password": "Donor@123",
                "role": "DONOR",
                "tenant": None
            }
        ]
    }

# Admin endpoints
@app.get("/admin/ngos")
async def get_admin_ngos(request: Request):
    """Get NGOs based on user role"""
    current_user = await get_current_user_from_request(request)
    
    if current_user["role"] == "PLATFORM_ADMIN":
        # Platform admin sees all NGOs
        return {
            "value": ngos_storage,
            "Count": len(ngos_storage)
        }
    elif current_user["role"] in ["NGO_ADMIN", "NGO_STAFF"]:
        # NGO users see only their own NGO
        user_ngo = next((ngo for ngo in ngos_storage if ngo["id"] == current_user.get("ngo_id")), None)
        if user_ngo:
            return {
                "value": [user_ngo],
                "Count": 1
            }
        else:
            return {
                "value": [],
                "Count": 0
            }
    else:
        # Other roles see no NGOs
        return {
            "value": [],
            "Count": 0
        }

@app.get("/admin/vendors")
async def get_admin_vendors(request: Request):
    """Get vendors based on user role"""
    current_user = await get_current_user_from_request(request)
    
    if current_user["role"] == "PLATFORM_ADMIN":
        # Platform admin sees all vendors
        return {
            "value": vendors_storage,
            "Count": len(vendors_storage)
        }
    elif current_user["role"] == "VENDOR":
        # Vendor users see only their own vendor info
        user_vendor = next((vendor for vendor in vendors_storage if vendor["id"] == current_user.get("vendor_id")), None)
        if user_vendor:
            return {
                "value": [user_vendor],
                "Count": 1
            }
        else:
            return {
                "value": [],
                "Count": 0
            }
    elif current_user["role"] in ["NGO_ADMIN", "NGO_STAFF"]:
        # NGO users see only vendors associated with their NGO
        user_ngo_id = current_user.get("ngo_id")
        if user_ngo_id:
            # Get vendors associated with this NGO
            associated_vendors = []
            for association in ngo_vendor_associations:
                if association["ngo_id"] == user_ngo_id and association["status"] == "ACTIVE":
                    vendor = next((v for v in vendors_storage if v["id"] == association["vendor_id"]), None)
                    if vendor:
                        associated_vendors.append(vendor)
            return {
                "value": associated_vendors,
                "Count": len(associated_vendors)
            }
        else:
            return {
                "value": [],
                "Count": 0
            }
    else:
        # Other roles see no vendors
        return {
            "value": [],
            "Count": 0
        }

@app.get("/admin/donors")
async def get_admin_donors(request: Request):
    """Get donors based on user role"""
    current_user = await get_current_user_from_request(request)
    
    if current_user["role"] == "PLATFORM_ADMIN":
        # Platform admin sees all donors
        return {
            "value": donors_storage,
            "Count": len(donors_storage)
        }
    elif current_user["role"] in ["NGO_ADMIN", "NGO_STAFF"]:
        # NGO users see only donors who donated to their NGO
        user_ngo_id = current_user.get("ngo_id")
        if user_ngo_id:
            # Filter donors who donated to this NGO (simplified logic)
            ngo_donors = []
            for donor in donors_storage:
                # Check if donor has donation history (simplified for demo)
                if donor.get("last_donation_date"):  # If they have donation history
                    ngo_donors.append(donor)
            return {
                "value": ngo_donors,
                "Count": len(ngo_donors)
            }
        else:
            return {
                "value": [],
                "Count": 0
            }
    else:
        # Other roles see no donors
        return {
            "value": [],
            "Count": 0
        }

@app.get("/admin/payments")
async def get_admin_payments():
    """Get payment summary for admin console with reconciliation data"""
    return {
        "total_donations": 625000,
        "total_payouts": 580000,
        "pending_payouts": 45000,
        "platform_fees": 6250,
        "monthly_stats": {
            "current_month": 125000,
            "last_month": 110000,
            "growth_percentage": 13.6
        },
        "payment_methods": {
            "razorpay": 450000,
            "upi": 100000,
            "card": 75000
        },
        "reconciliation": {
            "total_received": 625000,
            "total_disbursed": 580000,
            "platform_commission": 6250,
            "pending_disbursements": 45000,
            "account_balance": 38750,
            "last_reconciliation": "2024-01-15T10:30:00Z"
        },
        "category_breakdown": {
            "Food & Nutrition": 150000,
            "Education": 300000,
            "Healthcare": 200000,
            "Emergency Relief": 250000,
            "Women & Children": 180000
        },
        "ngo_breakdown": {
            "Hope Trust": 200000,
            "Care Works": 300000,
            "Health First Foundation": 125000
        }
    }

# Admin Management Endpoints
@app.post("/admin/ngos")
async def create_ngo(
    name: str = Form(...),
    description: str = Form(...),
    contact_email: str = Form(...),
    website_url: str = Form(...),
    logo_url: str = Form(None)
):
    """Create a new NGO"""
    new_id = max([ngo["id"] for ngo in ngos_storage], default=0) + 1
    new_ngo = {
        "id": new_id,
        "name": name,
        "slug": name.lower().replace(" ", "-"),
        "description": description,
        "logo_url": logo_url or f"https://picsum.photos/200/200?random={hash(name) % 1000}",
        "contact_email": contact_email,
        "website_url": website_url,
        "status": "ACTIVE",
        "created_at": datetime.now().isoformat() + "Z",
        "total_donations": 0,
        "total_causes": 0,
        "verified": False
    }
    ngos_storage.append(new_ngo)
    return new_ngo

@app.post("/admin/vendors")
async def create_vendor(
    name: str = Form(...),
    gstin: str = Form(...),
    contact_email: str = Form(...),
    phone: str = Form(...),
    address: str = Form(...)
):
    """Create a new vendor"""
    new_id = max([vendor["id"] for vendor in vendors_storage], default=0) + 1
    new_vendor = {
        "id": new_id,
        "name": name,
        "gstin": gstin,
        "contact_email": contact_email,
        "phone": phone,
        "address": address,
        "kyc_status": "PENDING",
        "tenant_name": None,
        "created_at": datetime.now().isoformat() + "Z",
        "total_invoices": 0,
        "total_amount": 0
    }
    vendors_storage.append(new_vendor)
    return new_vendor

@app.post("/admin/categories")
async def create_category(
    name: str = Form(...),
    description: str = Form(...)
):
    """Create a new category"""
    new_id = max([cat["id"] for cat in categories_storage], default=0) + 1
    new_category = {
        "id": new_id,
        "name": name,
        "description": description,
        "created_at": datetime.now().isoformat() + "Z"
    }
    categories_storage.append(new_category)
    return new_category

@app.post("/admin/causes")
async def create_cause(
    title: str = Form(...),
    description: str = Form(...),
    target_amount: int = Form(...),
    category_id: int = Form(...),
    ngo_ids: str = Form(...),  # Comma-separated list of NGO IDs
    image_url: str = Form(None)
):
    """Create a new cause that can be associated with multiple NGOs"""
    new_id = max([cause["id"] for cause in causes_storage + pending_causes_storage], default=0) + 1
    
    # Parse NGO IDs
    ngo_id_list = [int(id.strip()) for id in ngo_ids.split(',') if id.strip()]
    
    # Find category name
    category = next((cat for cat in categories_storage if cat["id"] == category_id), None)
    
    # Find NGO names
    ngo_names = []
    for ngo_id in ngo_id_list:
        ngo = next((ngo for ngo in ngos_storage if ngo["id"] == ngo_id), None)
        if ngo:
            ngo_names.append(ngo["name"])
    
    new_cause = {
        "id": new_id,
        "title": title,
        "description": description,
        "target_amount": target_amount,
        "current_amount": 0,
        "status": "PENDING_APPROVAL",
        "category_id": category_id,
        "ngo_ids": ngo_id_list,  # List of NGO IDs
        "image_url": image_url or f"https://picsum.photos/400/300?random={hash(title) % 1000}",
        "created_at": datetime.now().isoformat() + "Z",
        "ngo_names": ngo_names,  # List of NGO names
        "category_name": category["name"] if category else "Unknown Category",
        "donation_count": 0
    }
    pending_causes_storage.append(new_cause)
    return new_cause

@app.post("/admin/causes/{cause_id}/approve")
async def approve_cause(cause_id: int):
    """Approve a cause to make it visible to donors"""
    # Find the cause in pending_causes_storage
    cause_index = next((i for i, cause in enumerate(pending_causes_storage) if cause["id"] == cause_id), None)
    
    if cause_index is not None:
        # Move cause from pending to live
        approved_cause = pending_causes_storage.pop(cause_index)
        approved_cause["status"] = "LIVE"
        approved_cause["approved_at"] = "2024-01-15T00:00:00Z"
        causes_storage.append(approved_cause)
        
        return {
            "id": cause_id,
            "status": "LIVE",
            "approved_at": "2024-01-15T00:00:00Z",
            "message": "Cause approved successfully"
        }
    else:
        return {"error": "Cause not found"}

@app.post("/admin/causes/{cause_id}/reject")
async def reject_cause(cause_id: int, reason: str = Form(...)):
    """Reject a cause"""
    return {
        "id": cause_id,
        "status": "REJECTED",
        "rejected_at": "2024-01-15T00:00:00Z",
        "reason": reason,
        "message": "Cause rejected"
    }

@app.post("/ngo/causes")
async def create_ngo_cause(
    title: str = Form(...),
    description: str = Form(...),
    target_amount: int = Form(...),
    category_id: int = Form(...),
    ngo_id: int = Form(...),  # Single NGO ID for NGO admin
    image_url: str = Form(None),
    type: str = Form("NGO_MANAGED")
):
    """Create a new cause for NGO admin (single NGO)"""
    new_id = max([cause["id"] for cause in causes_storage + pending_causes_storage], default=0) + 1
    
    # Find category name
    category = next((cat for cat in categories_storage if cat["id"] == category_id), None)
    
    # Find NGO name
    ngo = next((ngo for ngo in ngos_storage if ngo["id"] == ngo_id), None)
    
    new_cause = {
        "id": new_id,
        "title": title,
        "description": description,
        "target_amount": target_amount,
        "current_amount": 0,
        "status": "PENDING_APPROVAL",
        "category_id": category_id,
        "ngo_ids": [ngo_id],  # Single NGO for NGO admin
        "image_url": image_url or f"https://picsum.photos/400/300?random={hash(title) % 1000}",
        "created_at": datetime.now().isoformat() + "Z",
        "ngo_names": [ngo["name"]] if ngo else ["Unknown NGO"],
        "category_name": category["name"] if category else "Unknown Category",
        "donation_count": 0,
        "type": type
    }
    pending_causes_storage.append(new_cause)
    return new_cause

@app.get("/admin/pending-causes")
async def get_pending_causes():
    """Get all causes pending approval"""
    return {
        "value": pending_causes_storage,
        "Count": len(pending_causes_storage)
    }

@app.post("/auth/login")
async def login(username: str = Form(...), password: str = Form(...)):
    # Dynamic login system that works with all users
    demo_passwords = {
        "admin@example.com": "Admin@123",
        "donor.arya@example.com": "Donor@123"
    }
    
    # Check if it's a known demo user
    if username in demo_passwords and demo_passwords[username] == password:
        return {
            "access_token": f"demo_token_{username}",
            "refresh_token": f"demo_refresh_{username}",
            "token_type": "bearer"
        }
    
    # Check NGO users
    for ngo in ngos_storage:
        ngo_admin_email = f"ngo.{ngo['slug']}.admin@example.com"
        ngo_staff_email = f"ngo.{ngo['slug']}.staff@example.com"
        
        if username == ngo_admin_email and password == "Ngo@123":
            return {
                "access_token": f"demo_token_{username}",
                "refresh_token": f"demo_refresh_{username}",
                "token_type": "bearer"
            }
        elif username == ngo_staff_email and password == "Staff@123":
            return {
                "access_token": f"demo_token_{username}",
                "refresh_token": f"demo_refresh_{username}",
                "token_type": "bearer"
            }
    
    # Check Vendor users
    for vendor in vendors_storage:
        vendor_email = f"vendor.{vendor['name'].lower().replace(' ', '.')}@example.com"
        if username == vendor_email and password == "Vendor@123":
            return {
                "access_token": f"demo_token_{username}",
                "refresh_token": f"demo_refresh_{username}",
                "token_type": "bearer"
            }
    
    # Check Donor users
    for donor in donors_storage:
        if username == donor['email'] and password == "Donor@123":
            return {
                "access_token": f"demo_token_{username}",
                "refresh_token": f"demo_refresh_{username}",
                "token_type": "bearer"
            }
    
    return {"error": "Invalid credentials"}

@app.get("/auth/me")
async def get_current_user(request: Request):
    # Get the authorization header
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        # Default to admin if no token
        return {
            "id": 1,
            "email": "admin@example.com",
            "first_name": "Admin",
            "last_name": "User",
            "role": "PLATFORM_ADMIN",
            "is_active": True,
            "created_at": "2024-01-01T00:00:00Z"
        }
    
    token = auth_header[7:]  # Remove "Bearer " prefix
    
    # Extract email from token (format: demo_token_email@example.com)
    if token.startswith("demo_token_"):
        email = token[11:]  # Remove "demo_token_" prefix
        
        # Check if it's admin
        if email == "admin@example.com":
            return {
                "id": 1,
                "email": "admin@example.com",
                "first_name": "Admin",
                "last_name": "User",
                "role": "PLATFORM_ADMIN",
                "is_active": True,
                "created_at": "2024-01-01T00:00:00Z"
            }
        
        # Check NGO users
        for ngo in ngos_storage:
            ngo_admin_email = f"ngo.{ngo['slug']}.admin@example.com"
            ngo_staff_email = f"ngo.{ngo['slug']}.staff@example.com"
            
            if email == ngo_admin_email:
                return {
                    "id": len(ngos_storage) * 2 + 1,  # Dynamic ID
                    "email": email,
                    "first_name": ngo['name'].split()[0],
                    "last_name": "Admin",
                    "role": "NGO_ADMIN",
                    "is_active": True,
                    "created_at": ngo['created_at'],
                    "ngo_name": ngo['name'],
                    "ngo_id": ngo['id']
                }
            elif email == ngo_staff_email:
                return {
                    "id": len(ngos_storage) * 2 + 2,  # Dynamic ID
                    "email": email,
                    "first_name": ngo['name'].split()[0],
                    "last_name": "Staff",
                    "role": "NGO_STAFF",
                    "is_active": True,
                    "created_at": ngo['created_at'],
                    "ngo_name": ngo['name'],
                    "ngo_id": ngo['id']
                }
        
        # Check Vendor users
        for vendor in vendors_storage:
            vendor_email = f"vendor.{vendor['name'].lower().replace(' ', '.')}@example.com"
            if email == vendor_email:
                return {
                    "id": len(ngos_storage) * 2 + len(vendors_storage) + 1,  # Dynamic ID
                    "email": email,
                    "first_name": vendor['name'].split()[0],
                    "last_name": "Vendor",
                    "role": "VENDOR",
                    "is_active": True,
                    "created_at": vendor['created_at'],
                    "vendor_name": vendor['name'],
                    "vendor_id": vendor['id']
                }
        
        # Check Donor users
        for donor in donors_storage:
            if email == donor['email']:
                return {
                    "id": len(ngos_storage) * 2 + len(vendors_storage) + len(donors_storage) + 1,  # Dynamic ID
                    "email": email,
                    "first_name": donor['name'].split()[0],
                    "last_name": donor['name'].split()[-1] if len(donor['name'].split()) > 1 else "",
                    "role": "DONOR",
                    "is_active": True,
                    "created_at": "2024-01-01T00:00:00Z"
                }
    
    # Default to admin if token not recognized
    return {
        "id": 1,
        "email": "admin@example.com",
        "first_name": "Admin",
        "last_name": "User",
        "role": "PLATFORM_ADMIN",
        "is_active": True,
        "created_at": "2024-01-01T00:00:00Z"
    }

@app.get("/public/categories")
async def get_categories():
    """Get all cause categories"""
    return {
        "value": categories_storage,
        "Count": len(categories_storage)
    }

@app.get("/public/ngos")
async def get_ngos():
    """Get all NGOs"""
    return {
        "value": ngos_storage,
        "Count": len(ngos_storage)
    }

@app.get("/public/causes")
async def get_causes():
    """Get all causes with proper category and NGO relationships"""
    return {
        "value": causes_storage,
        "Count": len(causes_storage)
    }

# NGO-Vendor Association Management Endpoints
@app.get("/admin/ngo-vendor-associations")
async def get_ngo_vendor_associations():
    """Get all NGO-Vendor associations"""
    # Enrich with names
    enriched_associations = []
    for assoc in ngo_vendor_associations:
        ngo = next((n for n in ngos_storage if n["id"] == assoc["ngo_id"]), None)
        vendor = next((v for v in vendors_storage if v["id"] == assoc["vendor_id"]), None)
        category = next((c for c in categories_storage if c["id"] == assoc["category_id"]), None)
        
        enriched_associations.append({
            **assoc,
            "ngo_name": ngo["name"] if ngo else "Unknown NGO",
            "vendor_name": vendor["name"] if vendor else "Unknown Vendor",
            "category_name": category["name"] if category else "Unknown Category"
        })
    
    return {
        "value": enriched_associations,
        "Count": len(enriched_associations)
    }

@app.post("/admin/ngo-vendor-associations")
async def create_ngo_vendor_association(
    ngo_id: int = Form(...),
    vendor_id: int = Form(...),
    category_id: int = Form(...)
):
    """Create a new NGO-Vendor association"""
    # Check if association already exists
    existing = next((a for a in ngo_vendor_associations 
                   if a["ngo_id"] == ngo_id and a["vendor_id"] == vendor_id and a["category_id"] == category_id), None)
    
    if existing:
        # Get names for better error message
        ngo = next((n for n in ngos_storage if n["id"] == ngo_id), None)
        vendor = next((v for v in vendors_storage if v["id"] == vendor_id), None)
        category = next((c for c in categories_storage if c["id"] == category_id), None)
        
        ngo_name = ngo["name"] if ngo else "Unknown NGO"
        vendor_name = vendor["name"] if vendor else "Unknown Vendor"
        category_name = category["name"] if category else "Unknown Category"
        
        raise HTTPException(
            status_code=400,
            detail=f"Association already exists: {ngo_name} ↔ {vendor_name} for {category_name}"
        )
    
    new_id = max([a["id"] for a in ngo_vendor_associations], default=0) + 1
    new_association = {
        "id": new_id,
        "ngo_id": ngo_id,
        "vendor_id": vendor_id,
        "category_id": category_id,
        "status": "ACTIVE",
        "created_at": datetime.now().isoformat() + "Z"
    }
    ngo_vendor_associations.append(new_association)
    return new_association

@app.delete("/admin/ngo-vendor-associations/{association_id}")
async def delete_ngo_vendor_association(association_id: int):
    """Delete an NGO-Vendor association"""
    global ngo_vendor_associations
    ngo_vendor_associations = [a for a in ngo_vendor_associations if a["id"] != association_id]
    return {"message": "Association deleted successfully"}

# Password reset endpoints for admin
@app.post("/admin/users/{user_id}/reset-password")
async def reset_user_password(user_id: int, new_password: str = Form(...)):
    """Reset password for a user (admin only)"""
    # In a real application, this would update the database
    # For demo purposes, we'll return a success message
    return {
        "user_id": user_id,
        "message": f"Password reset successfully for user {user_id}",
        "new_password": new_password,
        "reset_at": datetime.now().isoformat() + "Z"
    }

@app.get("/admin/users")
async def get_admin_users():
    """Get all users for admin management - dynamically generated from NGOs, Vendors, and demo users"""
    users = []
    
    # Add Platform Admin
    users.append({
        "id": 1,
        "email": "admin@example.com",
        "first_name": "Admin",
        "last_name": "User",
        "role": "PLATFORM_ADMIN",
        "is_active": True,
        "created_at": "2024-01-01T00:00:00Z",
        "last_login": "2024-01-20T10:30:00Z"
    })
    
    # Add NGO users from existing NGO data
    for ngo in ngos_storage:
        # NGO Admin user
        users.append({
            "id": len(users) + 1,
            "email": f"ngo.{ngo['slug']}.admin@example.com",
            "first_name": ngo['name'].split()[0],
            "last_name": "Admin",
            "role": "NGO_ADMIN",
            "is_active": True,
            "created_at": ngo['created_at'],
            "last_login": "2024-01-19T14:20:00Z",
            "ngo_name": ngo['name']
        })
        
        # NGO Staff user
        users.append({
            "id": len(users) + 1,
            "email": f"ngo.{ngo['slug']}.staff@example.com",
            "first_name": ngo['name'].split()[0],
            "last_name": "Staff",
            "role": "NGO_STAFF",
            "is_active": True,
            "created_at": ngo['created_at'],
            "last_login": "2024-01-18T09:15:00Z",
            "ngo_name": ngo['name']
        })
    
    # Add Vendor users from existing Vendor data
    for vendor in vendors_storage:
        users.append({
            "id": len(users) + 1,
            "email": f"vendor.{vendor['name'].lower().replace(' ', '.')}@example.com",
            "first_name": vendor['name'].split()[0],
            "last_name": "Vendor",
            "role": "VENDOR",
            "is_active": True,
            "created_at": vendor['created_at'],
            "last_login": "2024-01-17T16:45:00Z",
            "vendor_name": vendor['name']
        })
    
    # Add Donor users
    for donor in donors_storage:
        users.append({
            "id": len(users) + 1,
            "email": donor['email'],
            "first_name": donor['name'].split()[0],
            "last_name": donor['name'].split()[-1] if len(donor['name'].split()) > 1 else "",
            "role": "DONOR",
            "is_active": True,
            "created_at": "2024-01-01T00:00:00Z",
            "last_login": donor['last_donation_date']
        })
    
    return {
        "value": users,
        "Count": len(users)
    }

@app.post("/admin/users")
async def create_user(
    email: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    role: str = Form(...),
    password: str = Form(...),
    ngo_id: str = Form(None),
    vendor_id: str = Form(None)
):
    """Create a new user"""
    # In a real application, this would save to database
    # For demo purposes, we'll return a success message
    return {
        "id": 999,  # Demo ID
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "role": role,
        "is_active": True,
        "created_at": datetime.now().isoformat() + "Z",
        "last_login": None,
        "ngo_name": ngo_id if role in ["NGO_ADMIN", "NGO_STAFF"] else None,
        "vendor_name": vendor_id if role == "VENDOR" else None,
        "message": f"User {email} created successfully"
    }

@app.put("/admin/users/{user_id}")
async def update_user(
    user_id: int,
    email: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    role: str = Form(...),
    ngo_id: str = Form(None),
    vendor_id: str = Form(None)
):
    """Update an existing user"""
    # In a real application, this would update the database
    # For demo purposes, we'll return a success message
    return {
        "id": user_id,
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "role": role,
        "is_active": True,
        "created_at": datetime.now().isoformat() + "Z",
        "last_login": None,
        "ngo_name": ngo_id if role in ["NGO_ADMIN", "NGO_STAFF"] else None,
        "vendor_name": vendor_id if role == "VENDOR" else None,
        "message": f"User {email} updated successfully"
    }

@app.get("/admin/ngos/{ngo_id}/vendors")
async def get_ngo_vendors(ngo_id: int):
    """Get all vendors associated with an NGO"""
    associations = [a for a in ngo_vendor_associations if a["ngo_id"] == ngo_id and a["status"] == "ACTIVE"]
    
    enriched_vendors = []
    for assoc in associations:
        vendor = next((v for v in vendors_storage if v["id"] == assoc["vendor_id"]), None)
        category = next((c for c in categories_storage if c["id"] == assoc["category_id"]), None)
        
        if vendor:
            enriched_vendors.append({
                **vendor,
                "category_name": category["name"] if category else "Unknown Category",
                "association_id": assoc["id"],
                "association_created_at": assoc["created_at"]
            })
    
    return {
        "value": enriched_vendors,
        "Count": len(enriched_vendors)
    }

@app.get("/admin/vendors/{vendor_id}/ngos")
async def get_vendor_ngos(vendor_id: int):
    """Get all NGOs associated with a vendor"""
    associations = [a for a in ngo_vendor_associations if a["vendor_id"] == vendor_id and a["status"] == "ACTIVE"]
    
    enriched_ngos = []
    for assoc in associations:
        ngo = next((n for n in ngos_storage if n["id"] == assoc["ngo_id"]), None)
        category = next((c for c in categories_storage if c["id"] == assoc["category_id"]), None)
        
        if ngo:
            enriched_ngos.append({
                **ngo,
                "category_name": category["name"] if category else "Unknown Category",
                "association_id": assoc["id"],
                "association_created_at": assoc["created_at"]
            })
    
    return {
        "value": enriched_ngos,
        "Count": len(enriched_ngos)
    }

@app.get("/admin/categories/{category_id}/ngo-vendor-associations")
async def get_category_associations(category_id: int):
    """Get all NGO-Vendor associations for a specific category"""
    associations = [a for a in ngo_vendor_associations if a["category_id"] == category_id and a["status"] == "ACTIVE"]
    
    enriched_associations = []
    for assoc in associations:
        ngo = next((n for n in ngos_storage if n["id"] == assoc["ngo_id"]), None)
        vendor = next((v for v in vendors_storage if v["id"] == assoc["vendor_id"]), None)
        category = next((c for c in categories_storage if c["id"] == assoc["category_id"]), None)
        
        enriched_associations.append({
            **assoc,
            "ngo_name": ngo["name"] if ngo else "Unknown NGO",
            "vendor_name": vendor["name"] if vendor else "Unknown Vendor",
            "category_name": category["name"] if category else "Unknown Category"
        })
    
    return {
        "value": enriched_associations,
        "Count": len(enriched_associations)
    }

# Detailed Vendor and NGO View Endpoints
@app.get("/admin/vendors/{vendor_id}/details")
async def get_vendor_details(vendor_id: int):
    """Get detailed vendor information including associations, invoices, and payment history"""
    vendor = next((v for v in vendors_storage if v["id"] == vendor_id), None)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Get associated NGOs
    associations = [a for a in ngo_vendor_associations if a["vendor_id"] == vendor_id and a["status"] == "ACTIVE"]
    associated_ngos = []
    for assoc in associations:
        ngo = next((n for n in ngos_storage if n["id"] == assoc["ngo_id"]), None)
        category = next((c for c in categories_storage if c["id"] == assoc["category_id"]), None)
        if ngo:
            associated_ngos.append({
                "ngo_id": ngo["id"],
                "ngo_name": ngo["name"],
                "category_id": assoc["category_id"],
                "category_name": category["name"] if category else "Unknown Category",
                "association_created_at": assoc["created_at"]
            })
    
    # Get invoices
    vendor_invoices = [inv for inv in invoices_storage if inv["vendor_id"] == vendor_id]
    enriched_invoices = []
    for invoice in vendor_invoices:
        ngo = next((n for n in ngos_storage if n["id"] == invoice["ngo_id"]), None)
        cause = next((c for c in causes_storage if c["id"] == invoice["cause_id"]), None)
        enriched_invoices.append({
            **invoice,
            "ngo_name": ngo["name"] if ngo else "Unknown NGO",
            "cause_title": cause["title"] if cause else "Unknown Cause"
        })
    
    # Calculate financial summary
    total_invoiced = sum(inv["amount"] for inv in vendor_invoices)
    total_paid = sum(inv["amount"] for inv in vendor_invoices if inv["status"] == "PAID")
    total_pending = sum(inv["amount"] for inv in vendor_invoices if inv["status"] == "PENDING")
    
    return {
        "vendor": vendor,
        "associated_ngos": associated_ngos,
        "invoices": enriched_invoices,
        "financial_summary": {
            "total_invoiced": total_invoiced,
            "total_paid": total_paid,
            "total_pending": total_pending,
            "invoice_count": len(vendor_invoices),
            "paid_count": len([inv for inv in vendor_invoices if inv["status"] == "PAID"]),
            "pending_count": len([inv for inv in vendor_invoices if inv["status"] == "PENDING"])
        }
    }

@app.get("/admin/ngos/{ngo_id}/details")
async def get_ngo_details(ngo_id: int):
    """Get detailed NGO information including vendor associations, causes, and financial data"""
    ngo = next((n for n in ngos_storage if n["id"] == ngo_id), None)
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
    
    # Get associated vendors
    associations = [a for a in ngo_vendor_associations if a["ngo_id"] == ngo_id and a["status"] == "ACTIVE"]
    associated_vendors = []
    for assoc in associations:
        vendor = next((v for v in vendors_storage if v["id"] == assoc["vendor_id"]), None)
        category = next((c for c in categories_storage if c["id"] == assoc["category_id"]), None)
        if vendor:
            associated_vendors.append({
                "vendor_id": vendor["id"],
                "vendor_name": vendor["name"],
                "category_id": assoc["category_id"],
                "category_name": category["name"] if category else "Unknown Category",
                "association_created_at": assoc["created_at"]
            })
    
    # Get causes
    ngo_causes = [c for c in causes_storage if ngo_id in c.get("ngo_ids", [])]
    enriched_causes = []
    for cause in ngo_causes:
        category = next((c for c in categories_storage if c["id"] == cause["category_id"]), None)
        enriched_causes.append({
            **cause,
            "category_name": category["name"] if category else "Unknown Category"
        })
    
    # Get invoices related to this NGO
    ngo_invoices = [inv for inv in invoices_storage if inv["ngo_id"] == ngo_id]
    enriched_invoices = []
    for invoice in ngo_invoices:
        vendor = next((v for v in vendors_storage if v["id"] == invoice["vendor_id"]), None)
        cause = next((c for c in causes_storage if c["id"] == invoice["cause_id"]), None)
        enriched_invoices.append({
            **invoice,
            "vendor_name": vendor["name"] if vendor else "Unknown Vendor",
            "cause_title": cause["title"] if cause else "Unknown Cause"
        })
    
    # Calculate financial summary
    total_donations = sum(cause["current_amount"] for cause in ngo_causes)
    total_target = sum(cause["target_amount"] for cause in ngo_causes)
    total_invoiced = sum(inv["amount"] for inv in ngo_invoices)
    total_paid = sum(inv["amount"] for inv in ngo_invoices if inv["status"] == "PAID")
    total_pending = sum(inv["amount"] for inv in ngo_invoices if inv["status"] == "PENDING")
    
    return {
        "ngo": ngo,
        "associated_vendors": associated_vendors,
        "causes": enriched_causes,
        "invoices": enriched_invoices,
        "financial_summary": {
            "total_donations_received": total_donations,
            "total_target_amount": total_target,
            "funding_progress_percentage": (total_donations / total_target * 100) if total_target > 0 else 0,
            "total_invoiced": total_invoiced,
            "total_paid": total_paid,
            "total_pending": total_pending,
            "cause_count": len(ngo_causes),
            "active_causes": len([c for c in ngo_causes if c["status"] == "LIVE"]),
            "completed_causes": len([c for c in ngo_causes if c["status"] == "FUNDED"])
        }
    }

@app.get("/admin/donors/{donor_id}/details")
async def get_donor_details(donor_id: int):
    """Get detailed donor information including donation history and preferences"""
    donor = next((d for d in donors_storage if d["id"] == donor_id), None)
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")
    
    return {
        "donor": donor,
        "donation_summary": {
            "total_donations": donor["total_donations"],
            "donation_count": donor["donation_count"],
            "last_donation_date": donor["last_donation_date"],
            "preferred_categories": donor["preferred_categories"],
            "payment_methods": donor["payment_methods"],
            "tax_exemption": donor["tax_exemption"]
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
