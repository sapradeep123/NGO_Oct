# Changelog

All notable changes to the NGO Donations Platform.

## [1.0.0] - 2025-10-09

### 🎉 Major Release - Production Ready

### ✅ Fixed Issues

#### Database Connection Fix
- **Issue**: Database password with `@` symbol causing connection failures
- **Solution**: Properly URL-encoded password in DATABASE_URL
- **File**: `.env` configuration
- **Details**: `DASHBOARD_FIX.md`

#### User Role Resolution
- **Issue**: User role showing as `undefined`, dashboards not loading
- **Solution**: Enhanced `/auth/me` endpoint to include role from membership table
- **Files**: `app/routers/auth.py`, `app/schemas/__init__.py`
- **Details**: `USER_ROLE_FIX.md`

#### Data Synchronization
- **Issue**: Admin endpoints returning empty data, no vendor/NGO associations visible
- **Solution**: Created complete admin router with real database queries
- **File**: `app/routers/admin.py` (new)
- **Details**: `DATA_SYNC_FIX.md`

#### Microsite Preview
- **Issue**: 404 error when loading microsite preview
- **Solution**: Fixed API endpoint URL from `/tenant/{slug}` to `/public/tenants/{slug}`
- **File**: `src/api/client.ts`
- **Details**: `MICROSITE_FIX.md`

### 🚀 Features Added

#### Admin Endpoints
- `GET /admin/ngos` - Get NGOs (filtered by role)
- `GET /admin/vendors` - Get vendors (filtered by role)
- `GET /admin/donors` - Get donors
- `GET /admin/causes` - Get causes (filtered by role)
- `GET /admin/pending-causes` - Get pending approval causes
- `GET /admin/payments` - Get payment summary
- `GET /admin/ngo-vendor-associations` - Get NGO-Vendor links
- `GET /admin/users` - Get all users (Platform Admin only)
- `GET /ngo/orders` - Get NGO orders
- `GET /donor/donations` - Get donor donations
- `GET /donor/orders` - Get donor orders
- `GET /vendor/invoices` - Get vendor invoices

#### Role-Based Data Filtering
- Platform Admins see all data
- NGO Admins see only their NGO's data
- NGO Staff see their NGO's data (limited)
- Vendors see only their data
- Donors see only their donations

#### Dynamic Configuration
- Removed all hardcoded values
- 100% environment-based configuration
- Production-ready for any deployment

### 🔧 Configuration Changes

#### Backend Configuration
- **Modified**: `app/core/config.py`
  - Changed `ALLOWED_ORIGINS` default from hardcoded to wildcard
  - Removed hardcoded S3_ENDPOINT default
  - All values now from environment variables

#### Frontend Configuration
- **Modified**: `src/api/client.ts`
  - Added intelligent API URL detection
  - Development: Auto-detects `localhost:8000`
  - Production: Uses same origin (no hardcoded port)
  - Environment variable priority

#### Middleware
- **Modified**: `app/middleware/__init__.py`
  - Moved `ModeResolutionMiddleware` to package init
  - Fixed import issues

### 📁 Files Added

#### Documentation
- `README.md` - Comprehensive project documentation
- `CHANGELOG.md` - This file
- `START_APP.md` - Application startup guide
- `SETUP_COMPLETE.md` - Complete setup documentation
- `DEPLOYMENT_GUIDE.md` - Contabo deployment guide
- `CONTABO_QUICK_DEPLOY.md` - Quick deployment checklist
- `NO_HARDCODED_VALUES.md` - Configuration reference
- `DASHBOARD_FIX.md` - Database connection fix details
- `USER_ROLE_FIX.md` - Role resolution fix details
- `DATA_SYNC_FIX.md` - Admin endpoints fix details
- `MICROSITE_FIX.md` - Microsite preview fix details
- `TEST_RESULTS.md` - End-to-end test results

#### Scripts
- `start_backend.ps1` - PowerShell script to start backend
- `start_frontend.ps1` - PowerShell script to start frontend

#### Configuration Templates
- `.env.production.example` - Backend production environment template
- `.env.frontend.production` - Frontend production environment template

#### Backend
- `app/routers/admin.py` - Complete admin router with real endpoints

### 🔄 Files Modified

#### Backend
- `app/__init__.py` - Removed duplicate Settings class
- `app/core/__init__.py` - Removed duplicate Settings class
- `app/core/config.py` - Made all configs environment-based
- `app/main.py` - Added admin router
- `app/middleware/__init__.py` - Fixed middleware imports
- `app/routers/auth.py` - Enhanced to return user role
- `app/schemas/__init__.py` - Added role fields to User schema

#### Frontend
- `src/api/client.ts` - Fixed API URLs, made dynamic, added admin methods

### 🐛 Bug Fixes

1. **Database Connection**
   - Fixed URL encoding for special characters in passwords
   - Proper handling of `@`, `#`, `$` in credentials

2. **User Authentication**
   - User role now properly resolved from membership table
   - Dashboard routing works for all user types

3. **Admin Console**
   - Real data now loads from database
   - NGO-Vendor associations visible
   - Orders and invoices showing correctly

4. **Microsite**
   - Preview now loads without 404 errors
   - Public NGO pages working correctly

5. **CORS**
   - Properly configured for development and production
   - No hardcoded origins

### 🔒 Security Enhancements

- All secrets from environment variables
- No credentials in codebase
- URL encoding for special characters
- Proper CORS configuration
- Role-based access control
- JWT-based authentication

### 📊 Testing

- ✅ Database connection verified
- ✅ All user roles tested
- ✅ Admin endpoints verified
- ✅ Microsite preview working
- ✅ CORS configured correctly
- ✅ API documentation updated

### 🚀 Deployment

- ✅ No hardcoded values
- ✅ Environment-based configuration
- ✅ Production-ready
- ✅ Contabo deployment guide included
- ✅ Nginx configuration examples provided
- ✅ SSL/HTTPS setup documented

### 📝 Breaking Changes

**None** - All changes are backward compatible

### 🔄 Migration Guide

#### For Existing Deployments

1. **Update Backend `.env`**:
   ```env
   # Ensure password is URL-encoded
   DATABASE_URL=postgresql://user:password%40123@host:5432/db
   
   # Add if missing
   ALLOWED_ORIGINS=https://your-domain.com
   EXTERNAL_BASE_URL=https://your-domain.com
   ```

2. **Pull latest code**:
   ```bash
   git pull origin master
   ```

3. **Update dependencies**:
   ```bash
   pip install -r requirements.txt
   npm install
   ```

4. **Restart services**:
   ```bash
   pm2 restart all
   ```

#### For New Team Members

1. Clone repository
2. Copy `.env.production.example` to `.env`
3. Update with local database credentials
4. Follow `START_APP.md` guide

### 👥 Contributors

- Complete backend/frontend integration
- Database architecture
- Admin endpoints implementation
- Security enhancements
- Documentation

### 📚 Documentation

All documentation is now in the repository:
- Setup guides
- Deployment guides  
- Troubleshooting guides
- API documentation
- Configuration reference

### 🎯 Next Steps

Recommended improvements for future releases:
1. Email notifications
2. Payment gateway integration testing
3. S3/MinIO file upload implementation
4. Advanced reporting features
5. Multi-language support
6. Mobile app API

---

## How to Use This Changelog

When pulling updates:
1. Read the changelog for your version
2. Check "Migration Guide" for required changes
3. Update environment variables if needed
4. Run migrations: `alembic upgrade head`
5. Restart services

---

**Version**: 1.0.0  
**Release Date**: 2025-10-09  
**Status**: Production Ready ✅

