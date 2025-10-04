#!/usr/bin/env python3
"""
Seed script for NGO Donations Platform
Creates initial data for development and testing
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models import *
from app.core.security import get_password_hash
from decimal import Decimal

def create_seed_data():
    db = SessionLocal()
    
    try:
        # Create categories
        categories = [
            Category(name="Food", description="Food and nutrition related causes"),
            Category(name="Health", description="Healthcare and medical causes"),
            Category(name="Education", description="Educational and learning causes")
        ]
        
        for category in categories:
            db.add(category)
        db.commit()
        
        print("✓ Created categories")
        
        # Create users with exact credentials
        users = [
            User(
                email="admin@example.com",
                hashed_password=get_password_hash("Admin@123"),
                first_name="Platform",
                last_name="Admin",
                phone="+1234567890"
            ),
            User(
                email="ngo.hope.admin@example.com",
                hashed_password=get_password_hash("Ngo@123"),
                first_name="Hope",
                last_name="Admin",
                phone="+1234567891"
            ),
            User(
                email="ngo.hope.staff@example.com",
                hashed_password=get_password_hash("Staff@123"),
                first_name="Hope",
                last_name="Staff",
                phone="+1234567892"
            ),
            User(
                email="vendor.alpha@example.com",
                hashed_password=get_password_hash("Vendor@123"),
                first_name="Alpha",
                last_name="Supplies",
                phone="+1234567893"
            ),
            User(
                email="donor.arya@example.com",
                hashed_password=get_password_hash("Donor@123"),
                first_name="Arya",
                last_name="Donor",
                phone="+1234567894"
            )
        ]
        
        for user in users:
            db.add(user)
        db.commit()
        
        print("✓ Created users")
        
        # Create tenants (NGOs) with exact slugs
        from app.core.config import settings
        base_url = settings.EXTERNAL_BASE_URL or "https://example.com"
        
        tenants = [
            Tenant(
                name="Hope Trust",
                slug="hope-trust",
                description="Providing hope and support to communities in need",
                logo_url=f"{base_url}/logos/hope-trust.png",
                website_url="https://hopetrust.org",
                contact_email="contact@hopetrust.org",
                contact_phone="+1-555-HOPE",
                address="123 Hope Street, Hope City, HC 12345"
            ),
            Tenant(
                name="Care Works",
                slug="care-works",
                description="Caring for the community through various initiatives",
                logo_url=f"{base_url}/logos/care-works.png",
                website_url="https://careworks.org",
                contact_email="contact@careworks.org",
                contact_phone="+1-555-CARE",
                address="456 Care Avenue, Care City, CC 67890"
            )
        ]
        
        for tenant in tenants:
            db.add(tenant)
        db.commit()
        
        print("✓ Created tenants")
        
        # Create tenant domains
        tenant_domains = [
            TenantDomain(
                tenant_id=tenants[0].id,
                host="hopetrust.local",
                status="LIVE",
                is_primary=True
            ),
            TenantDomain(
                tenant_id=tenants[1].id,
                host="careworks.local",
                status="LIVE",
                is_primary=True
            )
        ]
        
        for domain in tenant_domains:
            db.add(domain)
        db.commit()
        
        print("✓ Created tenant domains")
        
        # Create memberships with exact roles
        memberships = [
            # Platform admin membership
            Membership(
                user_id=users[0].id,  # admin@example.com
                tenant_id=tenants[0].id,
                role=MembershipRole.PLATFORM_ADMIN
            ),
            # NGO admin membership (hope-trust)
            Membership(
                user_id=users[1].id,  # ngo.hope.admin@example.com
                tenant_id=tenants[0].id,
                role=MembershipRole.NGO_ADMIN
            ),
            # NGO staff membership (hope-trust)
            Membership(
                user_id=users[2].id,  # ngo.hope.staff@example.com
                tenant_id=tenants[0].id,
                role=MembershipRole.NGO_STAFF
            ),
            # Vendor membership (hope-trust)
            Membership(
                user_id=users[3].id,  # vendor.alpha@example.com
                tenant_id=tenants[0].id,
                role=MembershipRole.VENDOR
            ),
            # Donor membership
            Membership(
                user_id=users[4].id,  # donor.arya@example.com
                tenant_id=tenants[0].id,
                role=MembershipRole.DONOR
            ),
            Membership(
                user_id=users[4].id,  # donor.arya@example.com
                tenant_id=tenants[1].id,
                role=MembershipRole.DONOR
            )
        ]
        
        for membership in memberships:
            db.add(membership)
        db.commit()
        
        print("✓ Created memberships")
        
        # Create vendor "Alpha Supplies" linked to vendor user
        vendor = Vendor(
            tenant_id=tenants[0].id,
            name="Alpha Supplies",
            gstin="29ABCDE1234F1Z5",
            bank_json={
                "account_number": "1234567890",
                "ifsc_code": "HDFC0001234",
                "account_holder": "Alpha Supplies"
            },
            kyc_status="VERIFIED"
        )
        db.add(vendor)
        db.commit()
        
        print("✓ Created vendor")
        
        # Create at least one LIVE cause for hope-trust
        cause = Cause(
            tenant_id=tenants[0].id,
            category_id=categories[0].id,  # Food
            title="Emergency Food Relief",
            description="Providing emergency food supplies to families affected by natural disasters",
            goal_amount=Decimal("50000.00"),
            raised_amount=Decimal("0.00"),
            type=CauseType.VENDOR,
            status=CauseStatus.LIVE,
            policy_flags_json={"requires_approval": True, "max_amount_per_donation": 10000}
        )
        db.add(cause)
        db.commit()
        
        print("✓ Created cause")
        
        # Link vendor to cause via VendorLinks
        vendor_link = VendorLink(
            cause_id=cause.id,
            vendor_id=vendor.id,
            terms_json={
                "delivery_time": "7 days",
                "warranty": "1 year",
                "payment_terms": "Net 30"
            }
        )
        db.add(vendor_link)
        db.commit()
        
        print("✓ Created vendor link")
        
        # Create tenant policies
        tenant_policies = [
            TenantPolicy(
                tenant_id=tenants[0].id,
                allow_ngo_managed=False,
                ngo_managed_monthly_cap_percent=10
            ),
            TenantPolicy(
                tenant_id=tenants[1].id,
                allow_ngo_managed=False,
                ngo_managed_monthly_cap_percent=10
            )
        ]
        
        for policy in tenant_policies:
            db.add(policy)
        db.commit()
        
        print("✓ Created tenant policies")
        
        print("\n🎉 Seed data created successfully!")
        print("\nDemo login credentials:")
        print("1) PLATFORM_ADMIN: admin@example.com / Admin@123")
        print("2) NGO_ADMIN (hope-trust): ngo.hope.admin@example.com / Ngo@123")
        print("3) NGO_STAFF (hope-trust): ngo.hope.staff@example.com / Staff@123")
        print("4) VENDOR (hope-trust): vendor.alpha@example.com / Vendor@123")
        print("5) DONOR: donor.arya@example.com / Donor@123")
        
    except Exception as e:
        print(f"❌ Error creating seed data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_seed_data()
