# In-memory storage for demo purposes
from fastapi import FastAPI, Form, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

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
        "description": "Dedicated to providing hope and support to communities in need",
        "logo_url": "https://via.placeholder.com/200x200/2563EB/FFFFFF?text=Hope+Trust",
        "contact_email": "contact@hopetrust.org", "website_url": "https://hopetrust.org",
        "status": "ACTIVE", "created_at": "2024-01-01T00:00:00Z",
        "total_donations": 125000, "total_causes": 3, "verified": True
    },
    {
        "id": 2, "name": "Care Works", "slug": "care-works",
        "description": "Working together to create positive change in communities",
        "logo_url": "https://via.placeholder.com/200x200/059669/FFFFFF?text=Care+Works",
        "contact_email": "info@careworks.org", "website_url": "https://careworks.org",
        "status": "ACTIVE", "created_at": "2024-01-02T00:00:00Z",
        "total_donations": 300000, "total_causes": 5, "verified": True
    },
    {
        "id": 3, "name": "Health First Foundation", "slug": "health-first",
        "description": "Promoting healthcare access and medical support",
        "logo_url": "https://via.placeholder.com/200x200/DC2626/FFFFFF?text=Health+First",
        "contact_email": "contact@healthfirst.org", "website_url": "https://healthfirst.org",
        "status": "ACTIVE", "created_at": "2024-01-03T00:00:00Z",
        "total_donations": 200000, "total_causes": 4, "verified": True
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
        "ngo_id": 1,
        "category_name": "Food & Nutrition",
        "ngo_name": "Hope Trust",
        "image_url": "https://via.placeholder.com/400x300/2563EB/FFFFFF?text=Daily+Meals",
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
        "ngo_id": 2,
        "category_name": "Education",
        "ngo_name": "Care Works",
        "image_url": "https://via.placeholder.com/400x300/059669/FFFFFF?text=School+Infrastructure",
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
        "ngo_id": 3,
        "category_name": "Healthcare",
        "ngo_name": "Health First Foundation",
        "image_url": "https://via.placeholder.com/400x300/DC2626/FFFFFF?text=Mobile+Clinic",
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
        "ngo_id": 1,
        "category_name": "Emergency Relief",
        "ngo_name": "Hope Trust",
        "image_url": "https://via.placeholder.com/400x300/7C3AED/FFFFFF?text=Flood+Relief",
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
        "ngo_id": 2,
        "category_name": "Women & Children",
        "ngo_name": "Care Works",
        "image_url": "https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Women+Empowerment",
        "created_at": "2024-01-15T00:00:00Z",
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
        "ngo_name": "Hope Trust",
        "category_name": "Emergency Relief",
        "created_at": "2024-01-15T00:00:00Z",
        "ngo_id": 1,
        "category_id": 4
    },
    {
        "id": 7,
        "title": "School Infrastructure",
        "description": "Building new classrooms for rural schools",
        "target_amount": 200000,
        "current_amount": 0,
        "status": "PENDING_APPROVAL",
        "ngo_name": "Care Works",
        "category_name": "Education",
        "created_at": "2024-01-14T00:00:00Z",
        "ngo_id": 2,
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
async def get_admin_ngos():
    """Get all NGOs for admin console"""
    return {
        "value": ngos_storage,
        "Count": len(ngos_storage)
    }

@app.get("/admin/vendors")
async def get_admin_vendors():
    """Get all vendors for admin console"""
    return {
        "value": vendors_storage,
        "Count": len(vendors_storage)
    }

@app.get("/admin/donors")
async def get_admin_donors():
    """Get all donors for admin console"""
    return {
        "value": [
            {
                "id": 1,
                "first_name": "Arya",
                "last_name": "Donor",
                "email": "donor.arya@example.com",
                "phone": "+1234567894",
                "created_at": "2024-01-01T00:00:00Z",
                "total_donations": 15000,
                "total_causes_supported": 3,
                "last_donation_date": "2024-01-15T10:30:00Z"
            },
            {
                "id": 2,
                "first_name": "John",
                "last_name": "Smith",
                "email": "john.smith@example.com",
                "phone": "+1234567895",
                "created_at": "2024-01-03T00:00:00Z",
                "total_donations": 25000,
                "total_causes_supported": 5,
                "last_donation_date": "2024-01-20T14:20:00Z"
            }
        ],
        "Count": 2
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
        "logo_url": logo_url or f"https://via.placeholder.com/200x200/2563EB/FFFFFF?text={name.replace(' ', '+')}",
        "contact_email": contact_email,
        "website_url": website_url,
        "status": "ACTIVE",
        "created_at": "2024-01-15T00:00:00Z",
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
        "created_at": "2024-01-15T00:00:00Z",
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
        "created_at": "2024-01-15T00:00:00Z"
    }
    categories_storage.append(new_category)
    return new_category

@app.post("/admin/causes")
async def create_cause(
    title: str = Form(...),
    description: str = Form(...),
    target_amount: int = Form(...),
    category_id: int = Form(...),
    ngo_id: int = Form(...),
    image_url: str = Form(None)
):
    """Create a new cause"""
    new_id = max([cause["id"] for cause in causes_storage + pending_causes_storage], default=0) + 1
    
    # Find category and NGO names
    category = next((cat for cat in categories_storage if cat["id"] == category_id), None)
    ngo = next((ngo for ngo in ngos_storage if ngo["id"] == ngo_id), None)
    
    new_cause = {
        "id": new_id,
        "title": title,
        "description": description,
        "target_amount": target_amount,
        "current_amount": 0,
        "status": "PENDING_APPROVAL",
        "category_id": category_id,
        "ngo_id": ngo_id,
        "image_url": image_url or "https://via.placeholder.com/400x300/2563EB/FFFFFF?text=Cause+Image",
        "created_at": "2024-01-15T00:00:00Z",
        "ngo_name": ngo["name"] if ngo else "Unknown NGO",
        "category_name": category["name"] if category else "Unknown Category"
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

@app.get("/admin/pending-causes")
async def get_pending_causes():
    """Get all causes pending approval"""
    return {
        "value": pending_causes_storage,
        "Count": len(pending_causes_storage)
    }

@app.post("/auth/login")
async def login(username: str = Form(...), password: str = Form(...)):
    # Simple demo login - in production, verify against database
    demo_users = {
        "admin@example.com": {"password": "Admin@123", "role": "PLATFORM_ADMIN", "id": 1, "first_name": "Admin", "last_name": "User"},
        "ngo.hope.admin@example.com": {"password": "Ngo@123", "role": "NGO_ADMIN", "id": 2, "first_name": "Hope", "last_name": "Admin"},
        "ngo.hope.staff@example.com": {"password": "Staff@123", "role": "NGO_STAFF", "id": 3, "first_name": "Hope", "last_name": "Staff"},
        "vendor.alpha@example.com": {"password": "Vendor@123", "role": "VENDOR", "id": 4, "first_name": "Alpha", "last_name": "Vendor"},
        "donor.arya@example.com": {"password": "Donor@123", "role": "DONOR", "id": 5, "first_name": "Arya", "last_name": "Donor"}
    }
    
    if username in demo_users and demo_users[username]["password"] == password:
        return {
            "access_token": f"demo_token_{username}",
            "refresh_token": f"demo_refresh_{username}",
            "token_type": "bearer"
        }
    else:
        return {"error": "Invalid credentials"}

@app.get("/auth/me")
async def get_current_user(request: Request):
    # This would normally get user from JWT token
    # For demo purposes, we'll return different users based on the token
    # In production, you'd decode the JWT token to get user info
    
    # Demo users data
    demo_users = {
        "demo_token_admin@example.com": {
        "id": 1,
        "email": "admin@example.com",
        "first_name": "Admin",
        "last_name": "User",
        "role": "PLATFORM_ADMIN",
        "is_active": True,
        "created_at": "2024-01-01T00:00:00Z"
        },
        "demo_token_ngo.hope.admin@example.com": {
            "id": 2,
            "email": "ngo.hope.admin@example.com",
            "first_name": "Hope",
            "last_name": "Admin",
            "role": "NGO_ADMIN",
            "is_active": True,
            "created_at": "2024-01-01T00:00:00Z"
        },
        "demo_token_ngo.hope.staff@example.com": {
            "id": 3,
            "email": "ngo.hope.staff@example.com",
            "first_name": "Hope",
            "last_name": "Staff",
            "role": "NGO_STAFF",
            "is_active": True,
            "created_at": "2024-01-01T00:00:00Z"
        },
        "demo_token_vendor.alpha@example.com": {
            "id": 4,
            "email": "vendor.alpha@example.com",
            "first_name": "Alpha",
            "last_name": "Vendor",
            "role": "VENDOR",
            "is_active": True,
            "created_at": "2024-01-01T00:00:00Z"
        },
        "demo_token_donor.arya@example.com": {
            "id": 5,
            "email": "donor.arya@example.com",
            "first_name": "Arya",
            "last_name": "Donor",
            "role": "DONOR",
            "is_active": True,
            "created_at": "2024-01-01T00:00:00Z"
        }
    }
    
    # Get the authorization header
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]  # Remove "Bearer " prefix
        return demo_users.get(token, demo_users["demo_token_admin@example.com"])
    
    # Default to admin if no token
    return demo_users["demo_token_admin@example.com"]

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
        "created_at": "2024-01-15T00:00:00Z"
    }
    ngo_vendor_associations.append(new_association)
    return new_association

@app.delete("/admin/ngo-vendor-associations/{association_id}")
async def delete_ngo_vendor_association(association_id: int):
    """Delete an NGO-Vendor association"""
    global ngo_vendor_associations
    ngo_vendor_associations = [a for a in ngo_vendor_associations if a["id"] != association_id]
    return {"message": "Association deleted successfully"}

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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
