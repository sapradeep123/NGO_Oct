# NGO Donations Platform - Setup and Run Guide

## Quick Start

### 1. Setup Environment
```bash
cp .env.sample .env
```

### 2. Start Database
```bash
docker compose up -d
```

### 3. Run Migrations
```bash
alembic upgrade head
```

### 4. Seed Data
```bash
python seed.py
```

### 5. Start Application
```bash
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

## Access Points

- **OpenAPI Documentation**: {EXTERNAL_BASE_URL}/docs
- **OpenAPI Schema**: {EXTERNAL_BASE_URL}/openapi.json
- **Health Check**: {EXTERNAL_BASE_URL}/healthz
- **Runtime Config**: {EXTERNAL_BASE_URL}/.well-known/runtime-config
- **Demo Users**: {EXTERNAL_BASE_URL}/demo/users (dev only)
- **pgAdmin**: {EXTERNAL_BASE_URL}:8080 (admin@example.com / admin123)

*Note: Replace {EXTERNAL_BASE_URL} with your configured EXTERNAL_BASE_URL or use relative URLs when frontend and API share the same host.*

## Demo Login Credentials

After running `python seed.py`, use these exact credentials:

1. **PLATFORM_ADMIN**: admin@example.com / Admin@123
2. **NGO_ADMIN (hope-trust)**: ngo.hope.admin@example.com / Ngo@123
3. **NGO_STAFF (hope-trust)**: ngo.hope.staff@example.com / Staff@123
4. **VENDOR (hope-trust)**: vendor.alpha@example.com / Vendor@123
5. **DONOR**: donor.arya@example.com / Donor@123

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get tokens
- `GET /auth/me` - Get current user profile

### Public (No Auth Required)
- `GET /public/categories` - List all categories
- `GET /public/ngos` - List all NGOs
- `GET /public/causes` - List causes (with optional filters)
- `GET /public/tenants/{slug}` - Get NGO by slug
- `GET /public/tenants/by-host` - Get tenant by host (microsite/marketplace mode)

### Donations
- `POST /donations/init` - Initialize donation
- `POST /donations/webhook` - Payment webhook
- `GET /donations/{id}/receipt` - Get donation receipt

### Vendors
- `POST /vendors` - Create vendor (NGO_ADMIN)
- `POST /causes/{id}/vendors` - Link vendor to cause (NGO_ADMIN)
- `POST /vendor-invoices` - Submit invoice (VENDOR)
- `PATCH /vendor-invoices/{id}/approve` - Approve invoice (NGO_ADMIN)

### NGO Receipts
- `POST /ngo-receipts` - Submit receipt (NGO_ADMIN)
- `PATCH /ngo-receipts/{id}/approve` - Approve receipt (PLATFORM_ADMIN)

### Payouts
- `GET /payouts/{id}` - Get payout details

### File Uploads
- `POST /uploads/presign` - Get pre-signed upload URL
- `POST /uploads/verify` - Verify file upload

### Demo (Dev Only)
- `GET /demo/users` - Get demo user credentials
