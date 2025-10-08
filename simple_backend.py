# In-memory storage for demo purposes
from fastapi import FastAPI, Form, Request, HTTPException, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime
import razorpay
import json
import hashlib
import hmac
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

# Email Template Functions
def get_password_reset_template(user_name: str, reset_link: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - NGO Platform</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #2563EB, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: #2563EB; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset Request</h1>
                <p>NGO Platform</p>
            </div>
            <div class="content">
                <h2>Hello {user_name},</h2>
                <p>We received a request to reset your password for your NGO Platform account.</p>
                <p>Click the button below to reset your password:</p>
                <a href="{reset_link}" class="button">Reset Password</a>
                <p>If you didn't request this password reset, please ignore this email.</p>
                <p>This link will expire in 24 hours for security reasons.</p>
            </div>
            <div class="footer">
                <p>© 2024 NGO Platform. All rights reserved.</p>
                <p>This email was sent from info@bheeshmaa.in</p>
            </div>
        </div>
    </body>
    </html>
    """

def get_welcome_template(user_name: str, user_role: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to NGO Platform</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #2563EB, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: #2563EB; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome to NGO Platform!</h1>
                <p>Making a Difference Together</p>
            </div>
            <div class="content">
                <h2>Hello {user_name},</h2>
                <p>Welcome to the NGO Platform! We're excited to have you join our community of changemakers.</p>
                <p>Your account has been created with the role: <strong>{user_role.replace('_', ' ')}</strong></p>
                <p>You can now:</p>
                <ul>
                    <li>Access your personalized dashboard</li>
                    <li>Manage your profile and settings</li>
                    <li>Connect with NGOs and causes</li>
                    <li>Make a positive impact in your community</li>
                </ul>
                <a href="{FRONTEND_URL}/login" class="button">Get Started</a>
                <p>If you have any questions, feel free to contact our support team.</p>
            </div>
            <div class="footer">
                <p>© 2024 NGO Platform. All rights reserved.</p>
                <p>Contact us: info@bheeshmaa.in</p>
            </div>
        </div>
    </body>
    </html>
    """

def get_donation_invoice_template(donor_name: str, cause_title: str, amount: float, transaction_id: str, date: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Donation Receipt - NGO Platform</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #2563EB, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }}
            .receipt {{ background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2563EB; }}
            .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💰 Donation Receipt</h1>
                <p>Thank you for your generosity!</p>
            </div>
            <div class="content">
                <h2>Hello {donor_name},</h2>
                <p>Thank you for your generous donation! Your contribution is making a real difference.</p>
                <div class="receipt">
                    <h3>Donation Details</h3>
                    <p><strong>Cause:</strong> {cause_title}</p>
                    <p><strong>Amount:</strong> ₹{amount:,.2f}</p>
                    <p><strong>Transaction ID:</strong> {transaction_id}</p>
                    <p><strong>Date:</strong> {date}</p>
                    <p><strong>Status:</strong> Completed</p>
                </div>
                <p>Your donation is tax-deductible. Please keep this receipt for your records.</p>
                <p>Thank you for supporting our mission to create positive change!</p>
            </div>
            <div class="footer">
                <p>© 2024 NGO Platform. All rights reserved.</p>
                <p>Contact us: info@bheeshmaa.in</p>
            </div>
        </div>
    </body>
    </html>
    """

def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send email using SMTP settings"""
    try:
        settings = email_settings_storage
        
        print(f"Attempting to send email to: {to_email}")
        print(f"Using SMTP settings: {settings['smtp_host']}:{settings['smtp_port']}")
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{settings['from_name']} <{settings['from_email']}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add HTML content
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Connect to SMTP server
        print("Connecting to SMTP server...")
        server = smtplib.SMTP_SSL(settings['smtp_host'], settings['smtp_port'])
        
        print("Logging in to SMTP server...")
        server.login(settings['smtp_username'], settings['smtp_password'])
        
        # Send email
        print("Sending email...")
        text = msg.as_string()
        server.sendmail(settings['from_email'], to_email, text)
        server.quit()
        
        print("Email sent successfully!")
        return True
    except Exception as e:
        print(f"Email sending failed: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        return False

# Environment Configuration
BACKEND_HOST = os.getenv("BACKEND_HOST", "0.0.0.0")
BACKEND_PORT = int(os.getenv("BACKEND_PORT", "8002"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_1DP5mmOlF5G5ag")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "thisisjustademokey")

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
    
    # Return None if token not recognized - this will cause authentication to fail
    return None

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
        "name": "Arya Sharma",
        "email": "donor.arya@example.com",
        "phone": "+91-9876543210",
        "address": "123 Main Street, Mumbai, Maharashtra 400001",
        "total_donations": 50500,
        "donation_count": 13,
        "last_donation_date": "2025-10-07T14:38:30Z",
        "preferred_categories": ["Education", "Healthcare"],
        "donation_history": [
            {
                "id": 1,
                "cause_id": 1,
                "cause_title": "Daily Meals for Children",
                "ngo_name": "Hope Trust",
                "amount": 500,
                "date": "2025-10-07T14:38:30Z",
                "status": "COMPLETED"
            },
            {
                "id": 2,
                "cause_id": 1,
                "cause_title": "Emergency Food Relief",
                "ngo_name": "Hope Trust",
                "amount": 5000,
                "date": "2024-01-15T00:00:00Z",
                "status": "COMPLETED"
            },
            {
                "id": 3,
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
        "current_amount": 75500,
        "status": "LIVE",
        "category_id": 1,
        "ngo_ids": [1],  # Hope Trust
        "category_name": "Food & Nutrition",
        "ngo_names": ["Hope Trust"],
        "ngo_name": "Hope Trust",
        "image_url": "https://picsum.photos/400/300?random=1",
        "created_at": "2024-01-05T00:00:00Z",
        "donation_count": 46
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
        "ngo_name": "Care Works",
        "image_url": "https://picsum.photos/400/300?random=2",
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
        "ngo_name": "Health First Foundation",
        "image_url": "https://picsum.photos/400/300?random=3",
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
        "ngo_name": "Hope Trust",
        "image_url": "https://picsum.photos/400/300?random=4",
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
        "ngo_name": "Care Works",
        "image_url": "https://picsum.photos/400/300?random=5",
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

# Domain storage for custom domains
domains_storage = []

# Order management system
orders_storage = [
    {
        "id": 1,
        "order_number": "ORD-001",
        "cause_id": 1,
        "cause_title": "Emergency Food Relief",
        "ngo_id": 1,
        "ngo_name": "Hope Trust",
        "vendor_id": 1,
        "vendor_name": "Alpha Supplies",
        "category_id": 1,
        "category_name": "Food & Nutrition",
        "order_amount": 15000,
        "order_details": "500 meal packets, 200 water bottles, 100 blankets",
        "delivery_address": "123 Hope Street, Mumbai, Maharashtra 400001",
        "contact_person": "John Doe",
        "contact_phone": "+91-9876543210",
        "status": "ORDER_RECEIVED",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "delivery_date": None,
        "delivered_at": None,
        "ngo_confirmed_at": None,
        "notes": "Urgent delivery required"
    },
    {
        "id": 2,
        "order_number": "ORD-002",
        "cause_id": 2,
        "cause_title": "School Supplies Drive",
        "ngo_id": 1,
        "ngo_name": "Hope Trust",
        "vendor_id": 2,
        "vendor_name": "Beta Medical",
        "category_id": 2,
        "category_name": "Education",
        "order_amount": 25000,
        "order_details": "100 textbooks, 50 notebooks, 200 pens, 50 pencils",
        "delivery_address": "456 Education Center, Mumbai, Maharashtra 400002",
        "contact_person": "Jane Smith",
        "contact_phone": "+91-9876543211",
        "status": "ORDER_IN_PROCESS",
        "created_at": "2024-01-12T14:20:00Z",
        "updated_at": "2024-01-16T09:15:00Z",
        "delivery_date": None,
        "delivered_at": None,
        "ngo_confirmed_at": None,
        "notes": "Standard delivery"
    },
    {
        "id": 3,
        "order_number": "ORD-003",
        "cause_id": 3,
        "cause_title": "Medical Equipment Fund",
        "ngo_id": 2,
        "ngo_name": "Care Works",
        "vendor_id": 2,
        "vendor_name": "Beta Medical",
        "category_id": 3,
        "category_name": "Healthcare",
        "order_amount": 35000,
        "order_details": "5 oxygen concentrators, 10 blood pressure monitors, 50 first aid kits",
        "delivery_address": "789 Medical Center, Delhi, Delhi 110001",
        "contact_person": "Dr. Rajesh Kumar",
        "contact_phone": "+91-9876543212",
        "status": "ORDER_IN_TRANSIT",
        "created_at": "2024-01-10T08:45:00Z",
        "updated_at": "2024-01-17T11:30:00Z",
        "delivery_date": "2024-01-20T00:00:00Z",
        "delivered_at": None,
        "ngo_confirmed_at": None,
        "notes": "Fragile medical equipment - handle with care"
    },
    {
        "id": 4,
        "order_number": "ORD-004",
        "cause_id": 4,
        "cause_title": "Women Empowerment Program",
        "ngo_id": 3,
        "ngo_name": "Health First Foundation",
        "vendor_id": 3,
        "vendor_name": "Gamma Educational",
        "category_id": 5,
        "category_name": "Women & Children",
        "order_amount": 20000,
        "order_details": "50 sewing machines, 100 fabric rolls, 200 thread spools",
        "delivery_address": "321 Women Center, Bangalore, Karnataka 560001",
        "contact_person": "Priya Sharma",
        "contact_phone": "+91-9876543213",
        "status": "ORDER_DELIVERED",
        "created_at": "2024-01-08T12:00:00Z",
        "updated_at": "2024-01-18T16:45:00Z",
        "delivery_date": "2024-01-18T00:00:00Z",
        "delivered_at": "2024-01-18T16:45:00Z",
        "ngo_confirmed_at": None,
        "notes": "Waiting for NGO confirmation"
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

# Donations storage for tracking donations
donations_storage = [
    {
        "id": 1,
        "cause_id": 1,
        "cause_title": "Daily Meals for Children",
        "ngo_id": 1,
        "ngo_name": "Hope Trust",
        "amount": 500,
        "donor_name": "Arya Sharma",
        "donor_email": "donor.arya@example.com",
        "donor_phone": "+91-9876543210",
        "status": "COMPLETED",
        "created_at": "2024-01-15T00:00:00Z",
        "completed_at": "2025-10-07T14:38:30Z",
        "razorpay_order_id": "order_RQWnbKvimo7HMt",
        "razorpay_payment_id": "pay_RQWnbKvimo7HMt",
        "razorpay_signature": "verified_signature"
    }
]

# Email and Website Settings Storage
email_settings_storage = {
    "smtp_host": "smtp.hostinger.com",
    "smtp_port": 465,
    "smtp_username": "info@bheeshmaa.in",
    "smtp_password": "Info@2024",
    "smtp_encryption": "SSL",
    "from_email": "info@bheeshmaa.in",
    "from_name": "NGO Platform"
}

website_settings_storage = {
    "app_name": "NGO Platform",
    "app_title": "NGO Donations Platform",
    "logo_url": "/logo.png",
    "favicon_url": "/favicon.ico",
    "primary_color": "#2563EB",
    "secondary_color": "#059669",
    "footer_text": "Making a Difference Together",
    "contact_email": "info@bheeshmaa.in",
    "contact_phone": "+91-9876543210",
    "address": "123 NGO Street, City, State, Country"
}

app = FastAPI(title="NGO Donations Platform", version="1.0.0")

# Razorpay Configuration (using environment variables)
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
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

@app.get("/tenant/{slug}")
async def get_tenant_by_slug(slug: str):
    """Get tenant (NGO) details by slug"""
    # Find NGO by slug
    ngo = next((n for n in ngos_storage if n["slug"] == slug), None)
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
    
    return ngo

@app.get("/tenant/{slug}/about")
async def get_tenant_about_page(slug: str):
    """Get NGO About Us page content"""
    ngo = next((n for n in ngos_storage if n["slug"] == slug), None)
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
    
    # Return About Us page content
    return {
        "ngo_id": ngo["id"],
        "ngo_name": ngo["name"],
        "content": ngo.get("about_content", f"Learn more about {ngo['name']} and our mission to make a difference in communities worldwide."),
        "mission": ngo.get("mission", "To create positive change through verified, transparent operations."),
        "vision": ngo.get("vision", "A world where every community has access to the support they need."),
        "values": ngo.get("values", ["Transparency", "Impact", "Community", "Trust"]),
        "team": ngo.get("team", [
            {"name": "Dr. Sarah Johnson", "role": "Founder & CEO", "bio": "Passionate about community development"},
            {"name": "Michael Chen", "role": "Program Director", "bio": "Expert in social impact programs"}
        ]),
        "updated_at": ngo.get("about_updated_at", ngo["created_at"])
    }

@app.get("/tenant/{slug}/contact")
async def get_tenant_contact_page(slug: str):
    """Get NGO Contact page content"""
    ngo = next((n for n in ngos_storage if n["slug"] == slug), None)
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
    
    return {
        "ngo_id": ngo["id"],
        "ngo_name": ngo["name"],
        "contact_info": {
            "email": ngo["contact_email"],
            "phone": ngo.get("phone", ""),
            "address": ngo["address"],
            "website": ngo.get("website_url", ""),
            "office_hours": ngo.get("office_hours", "Monday - Friday: 9:00 AM - 6:00 PM")
        },
        "departments": ngo.get("departments", [
            {"name": "General Inquiries", "email": ngo["contact_email"], "phone": ngo.get("phone", "")},
            {"name": "Donations", "email": f"donations@{ngo['slug']}.org", "phone": ngo.get("phone", "")},
            {"name": "Volunteer", "email": f"volunteer@{ngo['slug']}.org", "phone": ngo.get("phone", "")}
        ]),
        "social_media": ngo.get("social_media", {
            "facebook": f"https://facebook.com/{ngo['slug']}",
            "twitter": f"https://twitter.com/{ngo['slug']}",
            "instagram": f"https://instagram.com/{ngo['slug']}"
        }),
        "updated_at": ngo.get("contact_updated_at", ngo["created_at"])
    }

@app.put("/admin/ngo/{ngo_id}/about")
async def update_ngo_about_page(ngo_id: int, request: Request, about_data: dict):
    """Update NGO About Us page content"""
    current_user = await get_current_user_from_request(request)
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Check if user has permission to update this NGO
    if current_user["role"] not in ["PLATFORM_ADMIN", "NGO_ADMIN"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if current_user["role"] == "NGO_ADMIN" and current_user.get("ngo_id") != ngo_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Find and update NGO
    ngo = next((n for n in ngos_storage if n["id"] == ngo_id), None)
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
    
    # Update about page data
    ngo["about_content"] = about_data.get("content", ngo.get("about_content", ""))
    ngo["mission"] = about_data.get("mission", ngo.get("mission", ""))
    ngo["vision"] = about_data.get("vision", ngo.get("vision", ""))
    ngo["values"] = about_data.get("values", ngo.get("values", []))
    ngo["team"] = about_data.get("team", ngo.get("team", []))
    ngo["about_updated_at"] = datetime.now().isoformat() + "Z"
    
    return {"message": "About page updated successfully", "updated_at": ngo["about_updated_at"]}

@app.put("/admin/ngo/{ngo_id}/contact")
async def update_ngo_contact_page(ngo_id: int, request: Request, contact_data: dict):
    """Update NGO Contact page content"""
    current_user = await get_current_user_from_request(request)
    
    # Check if user has permission to update this NGO
    if current_user["role"] not in ["PLATFORM_ADMIN", "NGO_ADMIN"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if current_user["role"] == "NGO_ADMIN" and current_user.get("ngo_id") != ngo_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Find and update NGO
    ngo = next((n for n in ngos_storage if n["id"] == ngo_id), None)
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
    
    # Update contact page data
    ngo["phone"] = contact_data.get("phone", ngo.get("phone", ""))
    ngo["office_hours"] = contact_data.get("office_hours", ngo.get("office_hours", ""))
    ngo["departments"] = contact_data.get("departments", ngo.get("departments", []))
    ngo["social_media"] = contact_data.get("social_media", ngo.get("social_media", {}))
    ngo["contact_updated_at"] = datetime.now().isoformat() + "Z"
    
    return {"message": "Contact page updated successfully", "updated_at": ngo["contact_updated_at"]}

@app.post("/donations")
async def create_donation(donation_data: dict):
    """Create a new donation"""
    # Validate required fields
    required_fields = ["cause_id", "donor_name", "donor_email", "amount", "payment_method"]
    for field in required_fields:
        if field not in donation_data:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    # Generate donation ID
    donation_id = len(donations_storage) + 1
    
    # Create donation record
    donation = {
        "id": donation_id,
        "cause_id": donation_data["cause_id"],
        "donor_name": donation_data["donor_name"],
        "donor_email": donation_data["donor_email"],
        "amount": donation_data["amount"],
        "payment_method": donation_data["payment_method"],
        "status": "PENDING",
        "transaction_id": f"TXN_{donation_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "created_at": datetime.now().isoformat() + "Z",
        "updated_at": datetime.now().isoformat() + "Z"
    }
    
    # Add to storage
    donations_storage.append(donation)
    
    # Update cause raised amount
    cause = next((c for c in causes_storage if c["id"] == donation_data["cause_id"]), None)
    if cause:
        cause["current_amount"] = (cause.get("current_amount", 0) or 0) + donation_data["amount"]
        cause["donation_count"] = (cause.get("donation_count", 0) or 0) + 1
    
    return {
        "success": True,
        "donation_id": donation_id,
        "transaction_id": donation["transaction_id"],
        "message": "Donation created successfully. Payment processing..."
    }

@app.get("/donations/{donation_id}")
async def get_donation_status(donation_id: int):
    """Get donation status"""
    donation = next((d for d in donations_storage if d["id"] == donation_id), None)
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    
    return donation

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
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
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
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
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
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Helper function to format donor data with first_name and last_name
    def format_donor_data(donor):
        name_parts = donor["name"].split()
        return {
            **donor,
            "first_name": name_parts[0] if name_parts else "",
            "last_name": " ".join(name_parts[1:]) if len(name_parts) > 1 else "",
            "total_causes_supported": len(donor.get("donation_history", [])),
        }
    
    if current_user["role"] == "PLATFORM_ADMIN":
        # Platform admin sees all donors
        formatted_donors = [format_donor_data(donor) for donor in donors_storage]
        return {
            "value": formatted_donors,
            "Count": len(formatted_donors)
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
                    ngo_donors.append(format_donor_data(donor))
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
        "ngo_name": ngo_names[0] if ngo_names else "Unknown NGO",  # Single NGO name for frontend
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
        "ngo_name": ngo["name"] if ngo else "Unknown NGO",  # Single NGO name for frontend
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
                    "ngo_id": ngo['id'],
                    "ngo_name": ngo['name']
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
                    "ngo_id": ngo['id'],
                    "ngo_name": ngo['name']
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
                    "vendor_id": vendor['id'],
                    "vendor_name": vendor['name']
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
    
    # Return None if token not recognized - this will cause authentication to fail
    return None

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

@app.get("/admin/causes")
async def get_admin_causes(request: Request):
    """Get causes based on user role"""
    current_user = await get_current_user_from_request(request)
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if current_user["role"] == "PLATFORM_ADMIN":
        # Platform admin sees all causes
        return {
            "value": causes_storage + pending_causes_storage,
            "Count": len(causes_storage) + len(pending_causes_storage)
        }
    elif current_user["role"] in ["NGO_ADMIN", "NGO_STAFF"]:
        # NGO users see only their NGO's causes
        user_ngo_id = current_user.get("ngo_id")
        if user_ngo_id:
            ngo_causes = []
            # Get live causes
            for cause in causes_storage:
                if user_ngo_id in cause.get("ngo_ids", []):
                    ngo_causes.append(cause)
            # Get pending causes
            for cause in pending_causes_storage:
                if user_ngo_id in cause.get("ngo_ids", []):
                    ngo_causes.append(cause)
            
            return {
                "value": ngo_causes,
                "Count": len(ngo_causes)
            }
        else:
            return {
                "value": [],
                "Count": 0
            }
    else:
        # Other roles see no causes
        return {
            "value": [],
            "Count": 0
        }

@app.get("/public/causes")
async def get_causes():
    """Get all live causes with proper category and NGO relationships"""
    return {
        "value": causes_storage,
        "Count": len(causes_storage)
    }

# Donation Management Endpoints
@app.post("/donations/init")
async def init_donation(
    cause_id: int = Form(...),
    amount: int = Form(...),
    donor_name: str = Form(...),
    donor_email: str = Form(...),
    donor_phone: str = Form(None)
):
    """Initialize a donation and create Razorpay order"""
    try:
        # Find the cause
        cause = next((c for c in causes_storage if c["id"] == cause_id), None)
        if not cause:
            raise HTTPException(status_code=404, detail="Cause not found")
        
        # Create donation record
        donation_id = len(donations_storage) + 1
        donation = {
            "id": donation_id,
            "cause_id": cause_id,
            "cause_title": cause["title"],
            "ngo_id": cause["ngo_ids"][0] if cause["ngo_ids"] else None,
            "ngo_name": cause["ngo_names"][0] if cause["ngo_names"] else "Unknown NGO",
            "amount": amount,
            "donor_name": donor_name,
            "donor_email": donor_email,
            "donor_phone": donor_phone,
            "status": "PENDING",
            "created_at": datetime.now().isoformat() + "Z",
            "razorpay_order_id": None,
            "razorpay_payment_id": None,
            "razorpay_signature": None
        }
        
        # Create Razorpay order
        order_data = {
            "amount": amount * 100,  # Convert to paise
            "currency": "INR",
            "receipt": f"donation_{donation_id}",
            "notes": {
                "cause_id": str(cause_id),
                "cause_title": cause["title"],
                "donor_name": donor_name,
                "donor_email": donor_email
            }
        }
        
        razorpay_order = razorpay_client.order.create(data=order_data)
        
        # Update donation with order ID
        donation["razorpay_order_id"] = razorpay_order["id"]
        donations_storage.append(donation)
        
        return {
            "donation_id": donation_id,
            "order_id": razorpay_order["id"],
            "amount": amount,
            "currency": "INR",
            "key": RAZORPAY_KEY_ID,
            "name": "NGO Platform",
            "description": f"Donation for {cause['title']}",
            "prefill": {
                "name": donor_name,
                "email": donor_email,
                "contact": donor_phone
            },
            "notes": {
                "cause_id": str(cause_id),
                "donation_id": str(donation_id)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize donation: {str(e)}")

@app.post("/donations/verify")
async def verify_donation(
    razorpay_order_id: str = Form(...),
    razorpay_payment_id: str = Form(...),
    razorpay_signature: str = Form(...)
):
    """Verify Razorpay payment and update donation status"""
    try:
        # Find donation by order ID
        donation = next((d for d in donations_storage if d["razorpay_order_id"] == razorpay_order_id), None)
        if not donation:
            raise HTTPException(status_code=404, detail="Donation not found")
        
        # Verify signature
        body = f"{razorpay_order_id}|{razorpay_payment_id}"
        expected_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            body.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if expected_signature != razorpay_signature:
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Update donation
        donation["razorpay_payment_id"] = razorpay_payment_id
        donation["razorpay_signature"] = razorpay_signature
        donation["status"] = "COMPLETED"
        donation["completed_at"] = datetime.now().isoformat() + "Z"
        
        # Update cause amount
        cause = next((c for c in causes_storage if c["id"] == donation["cause_id"]), None)
        if cause:
            cause["current_amount"] += donation["amount"]
            cause["donation_count"] += 1
        
        return {
            "success": True,
            "donation_id": donation["id"],
            "payment_id": razorpay_payment_id,
            "message": "Payment verified successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment verification failed: {str(e)}")

@app.get("/donations/{donation_id}")
async def get_donation(donation_id: int):
    """Get donation details"""
    donation = next((d for d in donations_storage if d["id"] == donation_id), None)
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    
    return donation

@app.get("/donations/{donation_id}/receipt")
async def get_donation_receipt(donation_id: int):
    """Get donation receipt"""
    donation = next((d for d in donations_storage if d["id"] == donation_id), None)
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    
    if donation["status"] != "COMPLETED":
        raise HTTPException(status_code=400, detail="Donation not completed")
    
    return {
        "receipt_id": f"RCP-{donation_id:06d}",
        "donation_id": donation_id,
        "cause_title": donation["cause_title"],
        "ngo_name": donation["ngo_name"],
        "amount": donation["amount"],
        "donor_name": donation["donor_name"],
        "donor_email": donation["donor_email"],
        "payment_id": donation["razorpay_payment_id"],
        "date": donation["completed_at"],
        "tax_exempt": True,
        "pan_number": "NGO-PLATFORM-001"
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

@app.post("/admin/ngo/photo")
async def upload_ngo_photo(
    photo: UploadFile = File(...),
    ngo_id: int = Form(...)
):
    """Upload photo for NGO gallery"""
    # In a real application, this would save the file and return the URL
    # For demo purposes, we'll return a mock URL
    return {
        "success": True,
        "photo_url": f"https://picsum.photos/400/300?random={ngo_id}_{datetime.now().timestamp()}",
        "message": "Photo uploaded successfully"
    }

@app.get("/admin/vendors/{vendor_id}")
async def get_vendor_details(vendor_id: int, request: Request):
    """Get detailed vendor information"""
    current_user = await get_current_user_from_request(request)
    
    # Find the vendor
    vendor = next((v for v in vendors_storage if v["id"] == vendor_id), None)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Check if user has access to this vendor
    if current_user["role"] == "PLATFORM_ADMIN":
        # Platform admin can see all vendors
        pass
    elif current_user["role"] in ["NGO_ADMIN", "NGO_STAFF"]:
        # NGO users can only see vendors associated with their NGO
        user_ngo_id = current_user.get("ngo_id")
        if user_ngo_id:
            # Check if vendor is associated with this NGO
            is_associated = any(
                a["ngo_id"] == user_ngo_id and a["vendor_id"] == vendor_id and a["status"] == "ACTIVE"
                for a in ngo_vendor_associations
            )
            if not is_associated:
                raise HTTPException(status_code=403, detail="Access denied")
        else:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user["role"] == "VENDOR":
        # Vendor users can only see their own vendor info
        if current_user.get("vendor_id") != vendor_id:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return vendor
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

# Domain Management Endpoints
@app.get("/admin/domains")
async def get_admin_domains(request: Request):
    """Get domains for the current user's NGO"""
    current_user = await get_current_user_from_request(request)
    
    if current_user["role"] not in ["NGO_ADMIN", "NGO_STAFF"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    user_ngo_id = current_user.get("ngo_id")
    if not user_ngo_id:
        raise HTTPException(status_code=400, detail="NGO ID not found")
    
    # Mock domain data - in real implementation, this would come from database
    domains = [
        {
            "id": 1,
            "tenant_id": user_ngo_id,
            "host": f"{current_user.get('ngo_name', 'hope-trust').lower().replace(' ', '-')}.org",
            "status": "PENDING_DNS",
            "is_primary": True,
            "created_at": "2024-01-01T00:00:00Z",
            "dns_instructions": {
                "cname_record": {
                    "name": "www",
                    "value": "microsites.yourplatform.com",
                    "ttl": 300
                },
                "a_record": {
                    "name": "@",
                    "value": "192.168.1.100",
                    "ttl": 300
                }
            }
        }
    ]
    
    return {
        "value": domains,
        "Count": len(domains)
    }

@app.post("/admin/domains")
async def create_domain(
    request: Request,
    host: str = Form(...),
    is_primary: bool = Form(False)
):
    """Create a new domain for the NGO"""
    current_user = await get_current_user_from_request(request)
    
    if current_user["role"] not in ["NGO_ADMIN", "NGO_STAFF"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    user_ngo_id = current_user.get("ngo_id")
    if not user_ngo_id:
        raise HTTPException(status_code=400, detail="NGO ID not found")
    
    # Validate domain format
    if not host or '.' not in host:
        raise HTTPException(status_code=400, detail="Invalid domain format")
    
    # Clean domain name
    clean_host = host.lower().strip().replace('http://', '').replace('https://', '').replace('www.', '')
    
    # Get NGO data
    ngo = next((n for n in ngos_storage if n["id"] == user_ngo_id), None)
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
    
    # Create domain entry
    new_domain = {
        "id": len(domains_storage) + 1,
        "tenant_id": user_ngo_id,
        "host": clean_host,
        "status": "PENDING_DNS",
        "is_primary": is_primary,
        "created_at": datetime.now().isoformat() + "Z",
        "ngo_slug": ngo["slug"],
        "dns_instructions": {
            "cname_record": {
                "name": "www",
                "value": "microsites.yourplatform.com",
                "ttl": 300
            },
            "a_record": {
                "name": "@",
                "value": "192.168.1.100",
                "ttl": 300
            }
        }
    }
    
    # Store domain (in real implementation, this would be in database)
    domains_storage.append(new_domain)
    
    return {
        "id": new_domain["id"],
        "host": new_domain["host"],
        "status": new_domain["status"],
        "ngo_slug": new_domain["ngo_slug"],
        "message": "Domain created successfully. Configure DNS and verify to activate.",
        "next_steps": [
            "1. Configure DNS records as shown in instructions",
            "2. Wait 24-48 hours for DNS propagation",
            "3. Click 'Verify Domain' to activate",
            f"4. Your microsite will be available at: https://{clean_host}"
        ]
    }

@app.post("/admin/domains/{domain_id}/verify")
async def verify_domain(domain_id: int, request: Request):
    """Verify domain DNS configuration and activate if valid"""
    current_user = await get_current_user_from_request(request)
    
    if current_user["role"] not in ["NGO_ADMIN", "NGO_STAFF"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Find domain
    domain = next((d for d in domains_storage if d["id"] == domain_id), None)
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    # Check if user owns this domain
    if domain["tenant_id"] != current_user.get("ngo_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Mock DNS verification - in real implementation, this would check actual DNS
    import random
    import socket
    
    try:
        # Simulate DNS check
        host = domain["host"]
        
        # For demo purposes, simulate different outcomes
        if "localhost" in host or "127.0.0.1" in host:
            # Local domains always work for demo
            is_verified = True
        else:
            # For real domains, simulate DNS check
            try:
                socket.gethostbyname(host)
                is_verified = random.choice([True, False])  # 50% chance for demo
            except:
                is_verified = False
        
        if is_verified:
            # Update domain status
            domain["status"] = "LIVE"
            domain["verified_at"] = datetime.now().isoformat() + "Z"
            
            return {
                "id": domain_id,
                "host": domain["host"],
                "status": "LIVE",
                "verified_at": domain["verified_at"],
                "message": "Domain verified successfully! Your microsite is now live.",
                "microsite_url": f"https://{domain['host']}",
                "next_steps": [
                    "Your microsite is now accessible at your custom domain",
                    "Share your domain with donors and supporters",
                    "Update your marketing materials with the new domain",
                    "Consider setting up SSL certificate for security"
                ]
            }
        else:
            return {
                "id": domain_id,
                "status": "PENDING_DNS",
                "message": "DNS configuration not found. Please check your DNS settings and try again.",
                "troubleshooting": [
                    "Verify DNS records are correctly configured",
                    "Wait 24-48 hours for DNS propagation",
                    "Check with your domain provider",
                    "Ensure CNAME/A records point to microsites.yourplatform.com"
                ]
            }
            
    except Exception as e:
        return {
            "id": domain_id,
            "status": "ERROR",
            "message": f"DNS verification failed: {str(e)}",
            "troubleshooting": [
                "Check domain format and spelling",
                "Verify DNS records are configured",
                "Contact support if issue persists"
            ]
        }

@app.delete("/admin/domains/{domain_id}")
async def delete_domain(domain_id: int, request: Request):
    """Delete a domain"""
    current_user = await get_current_user_from_request(request)
    
    if current_user["role"] not in ["NGO_ADMIN", "NGO_STAFF"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Find and remove domain
    domain_index = next((i for i, d in enumerate(domains_storage) if d["id"] == domain_id), None)
    if domain_index is not None:
        domains_storage.pop(domain_index)
        return {
            "id": domain_id,
            "message": "Domain deleted successfully"
        }
    else:
        raise HTTPException(status_code=404, detail="Domain not found")

# Domain routing endpoint - serves microsite for custom domains
@app.get("/domain/{host}")
async def serve_domain_microsite(host: str):
    """Serve NGO microsite for custom domain"""
    # Find domain in storage
    domain = next((d for d in domains_storage if d["host"] == host), None)
    
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    if domain["status"] != "LIVE":
        raise HTTPException(status_code=503, detail="Domain not active")
    
    # Get NGO data
    ngo = next((n for n in ngos_storage if n["id"] == domain["tenant_id"]), None)
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
    
    # Return microsite data
    return {
        "domain": domain["host"],
        "ngo": ngo,
        "microsite_url": f"/microsite/{ngo['slug']}",
        "status": "active",
        "message": f"Microsite is live at {domain['host']}"
    }

# Health check for domain
@app.get("/domain/{host}/health")
async def domain_health_check(host: str):
    """Health check for custom domain"""
    domain = next((d for d in domains_storage if d["host"] == host), None)
    
    if not domain:
        return {"status": "not_found", "message": "Domain not configured"}
    
    return {
        "status": domain["status"],
        "host": domain["host"],
        "ngo_id": domain["tenant_id"],
        "is_active": domain["status"] == "LIVE"
    }

# Order Management Endpoints
@app.get("/vendor/orders")
async def get_vendor_orders(request: Request):
    """Get orders for the current vendor"""
    current_user = await get_current_user_from_request(request)
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if current_user["role"] != "VENDOR":
        raise HTTPException(status_code=403, detail="Access denied")
    
    vendor_id = current_user.get("vendor_id")
    if not vendor_id:
        raise HTTPException(status_code=400, detail="Vendor ID not found")
    
    # Filter orders for this vendor
    vendor_orders = [order for order in orders_storage if order["vendor_id"] == vendor_id]
    
    return {
        "value": vendor_orders,
        "Count": len(vendor_orders)
    }

@app.get("/vendor/orders/{order_id}")
async def get_order_details(order_id: int, request: Request):
    """Get detailed order information"""
    current_user = await get_current_user_from_request(request)
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if current_user["role"] != "VENDOR":
        raise HTTPException(status_code=403, detail="Access denied")
    
    vendor_id = current_user.get("vendor_id")
    if not vendor_id:
        raise HTTPException(status_code=400, detail="Vendor ID not found")
    
    # Find the order
    order = next((o for o in orders_storage if o["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if vendor has access to this order
    if order["vendor_id"] != vendor_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return order

@app.put("/vendor/orders/{order_id}/status")
async def update_order_status(order_id: int, request: Request, status_data: dict):
    """Update order status"""
    current_user = await get_current_user_from_request(request)
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if current_user["role"] != "VENDOR":
        raise HTTPException(status_code=403, detail="Access denied")
    
    vendor_id = current_user.get("vendor_id")
    if not vendor_id:
        raise HTTPException(status_code=400, detail="Vendor ID not found")
    
    # Find the order
    order = next((o for o in orders_storage if o["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if vendor has access to this order
    if order["vendor_id"] != vendor_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    new_status = status_data.get("status")
    delivery_date = status_data.get("delivery_date")
    
    # Validate status transition
    valid_transitions = {
        "ORDER_RECEIVED": ["ORDER_IN_PROCESS"],
        "ORDER_IN_PROCESS": ["ORDER_IN_TRANSIT"],
        "ORDER_IN_TRANSIT": ["ORDER_DELIVERED"],
        "ORDER_DELIVERED": []  # Final state
    }
    
    if new_status not in valid_transitions.get(order["status"], []):
        raise HTTPException(status_code=400, detail=f"Invalid status transition from {order['status']} to {new_status}")
    
    # Update order
    order["status"] = new_status
    order["updated_at"] = datetime.now().isoformat() + "Z"
    
    if new_status == "ORDER_IN_TRANSIT" and delivery_date:
        order["delivery_date"] = delivery_date
    elif new_status == "ORDER_DELIVERED":
        order["delivered_at"] = datetime.now().isoformat() + "Z"
    
    return {
        "id": order_id,
        "status": new_status,
        "updated_at": order["updated_at"],
        "message": f"Order status updated to {new_status}"
    }

@app.get("/ngo/orders")
async def get_ngo_orders(request: Request):
    """Get orders for the current NGO"""
    current_user = await get_current_user_from_request(request)
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if current_user["role"] not in ["NGO_ADMIN", "NGO_STAFF"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    ngo_id = current_user.get("ngo_id")
    if not ngo_id:
        raise HTTPException(status_code=400, detail="NGO ID not found")
    
    # Filter orders for this NGO
    ngo_orders = [order for order in orders_storage if order["ngo_id"] == ngo_id]
    
    return {
        "value": ngo_orders,
        "Count": len(ngo_orders)
    }

@app.put("/ngo/orders/{order_id}/confirm")
async def confirm_order_delivery(order_id: int, request: Request):
    """Confirm order delivery by NGO"""
    current_user = await get_current_user_from_request(request)
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if current_user["role"] not in ["NGO_ADMIN", "NGO_STAFF"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    ngo_id = current_user.get("ngo_id")
    if not ngo_id:
        raise HTTPException(status_code=400, detail="NGO ID not found")
    
    # Find the order
    order = next((o for o in orders_storage if o["id"] == order_id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if NGO has access to this order
    if order["ngo_id"] != ngo_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if order is delivered
    if order["status"] != "ORDER_DELIVERED":
        raise HTTPException(status_code=400, detail="Order must be delivered before confirmation")
    
    # Update order
    order["ngo_confirmed_at"] = datetime.now().isoformat() + "Z"
    order["updated_at"] = datetime.now().isoformat() + "Z"
    
    return {
        "id": order_id,
        "ngo_confirmed_at": order["ngo_confirmed_at"],
        "message": "Order delivery confirmed by NGO"
    }

# Ticket Management System
tickets_storage = [
    {
        "id": 1,
        "donor_email": "donor.arya@example.com",
        "cause_id": 1,
        "cause_title": "Emergency Food Relief",
        "ngo_name": "Hope Trust",
        "subject": "Delivery Status Inquiry",
        "description": "I donated to Emergency Food Relief but haven't received any updates on delivery status.",
        "status": "OPEN",
        "priority": "MEDIUM",
        "created_at": "2024-01-20T10:30:00Z",
        "updated_at": "2024-01-20T10:30:00Z",
        "admin_response": None,
        "resolved_at": None
    },
    {
        "id": 2,
        "donor_email": "donor.arya@example.com",
        "cause_id": 2,
        "cause_title": "School Supplies Drive",
        "ngo_name": "Hope Trust",
        "subject": "Tax Receipt Request",
        "description": "I need a proper tax receipt for my donation to School Supplies Drive.",
        "status": "RESOLVED",
        "priority": "LOW",
        "created_at": "2024-01-18T14:20:00Z",
        "updated_at": "2024-01-19T09:15:00Z",
        "admin_response": "Tax receipt has been generated and sent to your email.",
        "resolved_at": "2024-01-19T09:15:00Z"
    }
]

# Donor-specific endpoints
@app.get("/donor/donations")
async def get_donor_donations(request: Request):
    """Get donations for the current donor"""
    current_user = await get_current_user_from_request(request)
    if not current_user: raise HTTPException(status_code=401, detail="Authentication required")
    if current_user["role"] != "DONOR": raise HTTPException(status_code=403, detail="Access denied")
    
    # Get donor's donation history
    donor_email = current_user["email"]
    donor = next((d for d in donors_storage if d["email"] == donor_email), None)
    if not donor: raise HTTPException(status_code=404, detail="Donor not found")
    
    return {"value": donor.get("donation_history", []), "Count": len(donor.get("donation_history", []))}

@app.get("/donor/causes/{cause_id}/status")
async def get_cause_delivery_status(cause_id: int, request: Request):
    """Get delivery status for a specific cause"""
    current_user = await get_current_user_from_request(request)
    if not current_user: raise HTTPException(status_code=401, detail="Authentication required")
    if current_user["role"] != "DONOR": raise HTTPException(status_code=403, detail="Access denied")
    
    # Find orders related to this cause
    cause_orders = [order for order in orders_storage if order["cause_id"] == cause_id]
    
    if not cause_orders:
        return {"status": "NO_ORDERS", "message": "No orders found for this cause"}
    
    # Get the latest order status
    latest_order = max(cause_orders, key=lambda x: x["updated_at"])
    
    return {
        "cause_id": cause_id,
        "cause_title": latest_order["cause_title"],
        "ngo_name": latest_order["ngo_name"],
        "order_status": latest_order["status"],
        "delivery_date": latest_order.get("delivery_date"),
        "delivered_at": latest_order.get("delivered_at"),
        "ngo_confirmed_at": latest_order.get("ngo_confirmed_at"),
        "last_updated": latest_order["updated_at"]
    }

@app.get("/donor/tax-documents")
async def get_donor_tax_documents(request: Request):
    """Get tax documents for the current donor"""
    current_user = await get_current_user_from_request(request)
    if not current_user: raise HTTPException(status_code=401, detail="Authentication required")
    if current_user["role"] != "DONOR": raise HTTPException(status_code=403, detail="Access denied")
    
    # Get donor's donation history for tax documents
    donor_email = current_user["email"]
    donor = next((d for d in donors_storage if d["email"] == donor_email), None)
    if not donor: raise HTTPException(status_code=404, detail="Donor not found")
    
    # Generate tax documents based on donation history
    tax_documents = []
    for donation in donor.get("donation_history", []):
        tax_documents.append({
            "id": donation["id"],
            "cause_title": donation["cause_title"],
            "ngo_name": donation["ngo_name"],
            "amount": donation["amount"],
            "date": donation["date"],
            "receipt_url": f"/receipts/{donation['id']}.pdf",
            "tax_exempt": True,
            "pan_number": donor.get("pan_number", ""),
            "donor_name": donor["name"]
        })
    
    return {"value": tax_documents, "Count": len(tax_documents)}

@app.get("/donor/tickets")
async def get_donor_tickets(request: Request):
    """Get tickets for the current donor"""
    current_user = await get_current_user_from_request(request)
    if not current_user: raise HTTPException(status_code=401, detail="Authentication required")
    if current_user["role"] != "DONOR": raise HTTPException(status_code=403, detail="Access denied")
    
    donor_email = current_user["email"]
    donor_tickets = [ticket for ticket in tickets_storage if ticket["donor_email"] == donor_email]
    
    return {"value": donor_tickets, "Count": len(donor_tickets)}

@app.post("/donor/tickets")
async def create_donor_ticket(request: Request, ticket_data: dict):
    """Create a new ticket for the current donor"""
    current_user = await get_current_user_from_request(request)
    if not current_user: raise HTTPException(status_code=401, detail="Authentication required")
    if current_user["role"] != "DONOR": raise HTTPException(status_code=403, detail="Access denied")
    
    new_ticket = {
        "id": len(tickets_storage) + 1,
        "donor_email": current_user["email"],
        "cause_id": ticket_data.get("cause_id"),
        "cause_title": ticket_data.get("cause_title"),
        "ngo_name": ticket_data.get("ngo_name"),
        "subject": ticket_data.get("subject"),
        "description": ticket_data.get("description"),
        "status": "OPEN",
        "priority": ticket_data.get("priority", "MEDIUM"),
        "created_at": datetime.now().isoformat() + "Z",
        "updated_at": datetime.now().isoformat() + "Z",
        "admin_response": None,
        "resolved_at": None
    }
    
    tickets_storage.append(new_ticket)
    return {"id": new_ticket["id"], "message": "Ticket created successfully"}

@app.get("/admin/tickets")
async def get_admin_tickets(request: Request):
    """Get all tickets for admin management"""
    current_user = await get_current_user_from_request(request)
    if not current_user: raise HTTPException(status_code=401, detail="Authentication required")
    if current_user["role"] != "PLATFORM_ADMIN": raise HTTPException(status_code=403, detail="Access denied")
    
    return {"value": tickets_storage, "Count": len(tickets_storage)}

@app.put("/admin/tickets/{ticket_id}")
async def update_ticket(ticket_id: int, request: Request, update_data: dict):
    """Update ticket status and response"""
    current_user = await get_current_user_from_request(request)
    if not current_user: raise HTTPException(status_code=401, detail="Authentication required")
    if current_user["role"] != "PLATFORM_ADMIN": raise HTTPException(status_code=403, detail="Access denied")
    
    ticket = next((t for t in tickets_storage if t["id"] == ticket_id), None)
    if not ticket: raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket["status"] = update_data.get("status", ticket["status"])
    ticket["admin_response"] = update_data.get("admin_response", ticket["admin_response"])
    ticket["updated_at"] = datetime.now().isoformat() + "Z"
    
    if ticket["status"] == "RESOLVED":
        ticket["resolved_at"] = datetime.now().isoformat() + "Z"
    
    return {"id": ticket_id, "message": "Ticket updated successfully"}

@app.get("/donor/donations")
async def get_donor_donations(request: Request):
    """Get donation history for the current donor"""
    current_user = await get_current_user_from_request(request)
    if not current_user: raise HTTPException(status_code=401, detail="Authentication required")
    if current_user["role"] != "DONOR": raise HTTPException(status_code=403, detail="Access denied")
    
    # Get donor's donation history
    donor_email = current_user["email"]
    donor = next((d for d in donors_storage if d["email"] == donor_email), None)
    if not donor: raise HTTPException(status_code=404, detail="Donor not found")
    
    # Get all donations for this donor
    donor_donations = [d for d in donations_storage if d["donor_email"] == donor_email]
    
    # Sort by date (most recent first)
    donor_donations.sort(key=lambda x: x["created_at"], reverse=True)
    
    return {
        "donations": donor_donations,
        "total_donations": len(donor_donations),
        "total_amount": sum(d["amount"] for d in donor_donations)
    }

@app.get("/donor/donations/{ngo_slug}")
async def get_donor_donations_by_ngo(ngo_slug: str, request: Request):
    """Get donation history for a specific NGO by the current donor"""
    current_user = await get_current_user_from_request(request)
    if not current_user: raise HTTPException(status_code=401, detail="Authentication required")
    if current_user["role"] != "DONOR": raise HTTPException(status_code=403, detail="Access denied")
    
    # Find the NGO
    ngo = next((n for n in ngos_storage if n["slug"] == ngo_slug), None)
    if not ngo: raise HTTPException(status_code=404, detail="NGO not found")
    
    # Get donations for this NGO by this donor
    donor_email = current_user["email"]
    ngo_donations = [
        d for d in donations_storage 
        if d["donor_email"] == donor_email and d["ngo_slug"] == ngo_slug
    ]
    
    # Sort by date (most recent first)
    ngo_donations.sort(key=lambda x: x["created_at"], reverse=True)
    
    return {
        "ngo_name": ngo["name"],
        "ngo_slug": ngo_slug,
        "donations": ngo_donations,
        "total_donations": len(ngo_donations),
        "total_amount": sum(d["amount"] for d in ngo_donations)
    }

@app.get("/donor/donations/cause/{cause_id}")
async def get_donor_donations_by_cause(cause_id: int, request: Request):
    """Get donation history for a specific cause by the current donor"""
    current_user = await get_current_user_from_request(request)
    if not current_user: raise HTTPException(status_code=401, detail="Authentication required")
    if current_user["role"] != "DONOR": raise HTTPException(status_code=403, detail="Access denied")
    
    # Find the cause
    cause = next((c for c in causes_storage if c["id"] == cause_id), None)
    if not cause: raise HTTPException(status_code=404, detail="Cause not found")
    
    # Get donations for this cause by this donor
    donor_email = current_user["email"]
    cause_donations = [
        d for d in donations_storage 
        if d["donor_email"] == donor_email and d["cause_id"] == cause_id
    ]
    
    # Sort by date (most recent first)
    cause_donations.sort(key=lambda x: x["created_at"], reverse=True)
    
    return {
        "cause_id": cause_id,
        "cause_title": cause["title"],
        "ngo_name": cause["ngo_name"],
        "donations": cause_donations,
        "total_donations": len(cause_donations),
        "total_amount": sum(d["amount"] for d in cause_donations)
    }

# Email and Website Settings Endpoints
@app.get("/admin/email-settings")
async def get_email_settings(request: Request):
    """Get email settings"""
    current_user = await get_current_user_from_request(request)
    if not current_user: raise HTTPException(status_code=401, detail="Authentication required")
    if current_user["role"] != "PLATFORM_ADMIN": raise HTTPException(status_code=403, detail="Access denied")
    
    return email_settings_storage

@app.put("/admin/email-settings")
async def update_email_settings(
    smtp_host: str = Form(...),
    smtp_port: int = Form(...),
    smtp_username: str = Form(...),
    smtp_password: str = Form(...),
    smtp_encryption: str = Form(...),
    from_email: str = Form(...),
    from_name: str = Form(...),
    request: Request = None
):
    """Update email settings"""
    current_user = await get_current_user_from_request(request)
    if not current_user: raise HTTPException(status_code=401, detail="Authentication required")
    if current_user["role"] != "PLATFORM_ADMIN": raise HTTPException(status_code=403, detail="Access denied")
    
    email_settings_storage.update({
        "smtp_host": smtp_host,
        "smtp_port": smtp_port,
        "smtp_username": smtp_username,
        "smtp_password": smtp_password,
        "smtp_encryption": smtp_encryption,
        "from_email": from_email,
        "from_name": from_name
    })
    
    return {"message": "Email settings updated successfully"}

@app.get("/admin/website-settings")
async def get_website_settings(request: Request):
    """Get website settings"""
    current_user = await get_current_user_from_request(request)
    if not current_user: raise HTTPException(status_code=401, detail="Authentication required")
    if current_user["role"] != "PLATFORM_ADMIN": raise HTTPException(status_code=403, detail="Access denied")
    
    return website_settings_storage

@app.put("/admin/website-settings")
async def update_website_settings(
    app_name: str = Form(...),
    app_title: str = Form(...),
    logo_url: str = Form(...),
    favicon_url: str = Form(...),
    primary_color: str = Form(...),
    secondary_color: str = Form(...),
    footer_text: str = Form(...),
    contact_email: str = Form(...),
    contact_phone: str = Form(...),
    address: str = Form(...),
    request: Request = None
):
    """Update website settings"""
    current_user = await get_current_user_from_request(request)
    if not current_user: raise HTTPException(status_code=401, detail="Authentication required")
    if current_user["role"] != "PLATFORM_ADMIN": raise HTTPException(status_code=403, detail="Access denied")
    
    website_settings_storage.update({
        "app_name": app_name,
        "app_title": app_title,
        "logo_url": logo_url,
        "favicon_url": favicon_url,
        "primary_color": primary_color,
        "secondary_color": secondary_color,
        "footer_text": footer_text,
        "contact_email": contact_email,
        "contact_phone": contact_phone,
        "address": address
    })
    
    return {"message": "Website settings updated successfully"}

@app.post("/admin/send-password-reset")
async def send_password_reset_email(
    user_email: str = Form(...),
    request: Request = None
):
    """Send password reset email"""
    current_user = await get_current_user_from_request(request)
    if not current_user: raise HTTPException(status_code=401, detail="Authentication required")
    if current_user["role"] != "PLATFORM_ADMIN": raise HTTPException(status_code=403, detail="Access denied")
    
    # Generate reset link (in real app, this would be a secure token)
    reset_link = f"{FRONTEND_URL}/reset-password?email={user_email}&token=demo_token"
    
    # Get user name (simplified for demo)
    user_name = user_email.split('@')[0].replace('.', ' ').title()
    
    # Generate email content
    html_content = get_password_reset_template(user_name, reset_link)
    
    # Send email
    success = send_email(user_email, "Password Reset Request - NGO Platform", html_content)
    
    if success:
        return {"message": f"Password reset email sent to {user_email}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email")

@app.post("/admin/send-welcome-email")
async def send_welcome_email(
    user_email: str = Form(...),
    user_role: str = Form(...),
    request: Request = None
):
    """Send welcome email"""
    current_user = await get_current_user_from_request(request)
    if not current_user: raise HTTPException(status_code=401, detail="Authentication required")
    if current_user["role"] != "PLATFORM_ADMIN": raise HTTPException(status_code=403, detail="Access denied")
    
    # Get user name (simplified for demo)
    user_name = user_email.split('@')[0].replace('.', ' ').title()
    
    # Generate email content
    html_content = get_welcome_template(user_name, user_role)
    
    # Send email
    success = send_email(user_email, "Welcome to NGO Platform!", html_content)
    
    if success:
        return {"message": f"Welcome email sent to {user_email}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email")

@app.post("/admin/send-donation-invoice")
async def send_donation_invoice(
    donor_email: str = Form(...),
    donor_name: str = Form(...),
    cause_title: str = Form(...),
    amount: float = Form(...),
    transaction_id: str = Form(...),
    request: Request = None
):
    """Send donation invoice email"""
    current_user = await get_current_user_from_request(request)
    if not current_user: raise HTTPException(status_code=401, detail="Authentication required")
    if current_user["role"] != "PLATFORM_ADMIN": raise HTTPException(status_code=403, detail="Access denied")
    
    # Generate email content
    date = datetime.now().strftime("%B %d, %Y")
    html_content = get_donation_invoice_template(donor_name, cause_title, amount, transaction_id, date)
    
    # Send email
    success = send_email(donor_email, f"Donation Receipt - {cause_title}", html_content)
    
    if success:
        return {"message": f"Donation invoice sent to {donor_email}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email")

@app.post("/admin/upload-logo")
async def upload_logo(file: UploadFile = File(...), request: Request = None):
    """Upload logo file"""
    current_user = await get_current_user_from_request(request)
    if not current_user: raise HTTPException(status_code=401, detail="Authentication required")
    if current_user["role"] != "PLATFORM_ADMIN": raise HTTPException(status_code=403, detail="Access denied")
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    
    # Validate file size (2MB limit)
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:  # 2MB
        raise HTTPException(status_code=400, detail="File size must be less than 2MB")
    
    # In a real application, you would save the file to a storage service
    # For demo purposes, we'll just return the filename
    filename = f"logo_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file.filename.split('.')[-1]}"
    
    # Update website settings with the new logo path
    website_settings_storage["logo_url"] = f"/uploads/{filename}"
    
    return {
        "message": "Logo uploaded successfully",
        "filename": filename,
        "url": f"/uploads/{filename}"
    }

@app.post("/admin/upload-favicon")
async def upload_favicon(file: UploadFile = File(...), request: Request = None):
    """Upload favicon file"""
    current_user = await get_current_user_from_request(request)
    if not current_user: raise HTTPException(status_code=401, detail="Authentication required")
    if current_user["role"] != "PLATFORM_ADMIN": raise HTTPException(status_code=403, detail="Access denied")
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    
    # Validate file size (1MB limit for favicon)
    content = await file.read()
    if len(content) > 1 * 1024 * 1024:  # 1MB
        raise HTTPException(status_code=400, detail="File size must be less than 1MB")
    
    # In a real application, you would save the file to a storage service
    # For demo purposes, we'll just return the filename
    filename = f"favicon_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file.filename.split('.')[-1]}"
    
    # Update website settings with the new favicon path
    website_settings_storage["favicon_url"] = f"/uploads/{filename}"
    
    return {
        "message": "Favicon uploaded successfully",
        "filename": filename,
        "url": f"/uploads/{filename}"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=BACKEND_HOST, port=BACKEND_PORT)
