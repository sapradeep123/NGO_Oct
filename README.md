# NGO Donations Platform

A multi-tenant NGO donations platform built with FastAPI (Python) and React (TypeScript).

## 🚀 Quick Start for Teammates

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Docker (for database)

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd ngo-platform
```

### 2. Start Database (Docker)
```bash
docker compose up -d
```

### 3. Setup Backend
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (IMPORTANT!)
copy .env.production.example .env

# Edit .env with your local settings
# Required: DATABASE_URL, SECRET_KEY, ALLOWED_ORIGINS

# Run migrations
alembic upgrade head

# Seed database (optional)
python seed.py
```

### 4. Setup Frontend
```bash
# Install dependencies
npm install

# Create .env.local (optional - auto-detects API)
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local
```

### 5. Start Development Servers

**Option 1: Using PowerShell Scripts (Recommended)**
```powershell
# Terminal 1: Start Backend
.\start_backend.ps1

# Terminal 2: Start Frontend
.\start_frontend.ps1
```

**Option 2: Manual Start**
```bash
# Terminal 1: Backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Frontend
npm run dev
```

### 6. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **pgAdmin**: http://localhost:5050 (admin@example.com / admin123)

## 🔑 Demo Login Credentials

After seeding the database:

| Role | Email | Password |
|------|-------|----------|
| Platform Admin | admin@example.com | Admin@123 |
| NGO Admin | ngo.hope.admin@example.com | Ngo@123 |
| NGO Staff | ngo.hope.staff@example.com | Staff@123 |
| Vendor | vendor.alpha@example.com | Vendor@123 |
| Donor | donor.arya@example.com | Donor@123 |

## ⚙️ Configuration

### Backend (.env)
**Required variables:**
```env
APP_ENV=dev
DATABASE_URL=postgresql://postgres:postgres%40123@localhost:5432/ngo_db
SECRET_KEY=your-secret-key-here
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
EXTERNAL_BASE_URL=http://localhost:8000
```

**Note:** Special characters in password must be URL-encoded! 
- `@` → `%40`
- `#` → `%23`

### Frontend (.env.local)
**Optional - auto-detects if not set:**
```env
VITE_API_BASE_URL=http://localhost:8000
```

## 📚 Documentation

### Setup & Development
- **`START_APP.md`** - Complete startup guide
- **`SETUP_COMPLETE.md`** - Detailed setup documentation
- **`RUN.md`** - Original run instructions

### Fixes & Solutions
- **`DASHBOARD_FIX.md`** - Database connection fix
- **`USER_ROLE_FIX.md`** - User role resolution fix
- **`DATA_SYNC_FIX.md`** - Admin endpoints fix
- **`MICROSITE_FIX.md`** - Microsite preview fix

### Deployment
- **`DEPLOYMENT_GUIDE.md`** - Complete Contabo deployment guide
- **`CONTABO_QUICK_DEPLOY.md`** - Quick deployment checklist
- **`NO_HARDCODED_VALUES.md`** - Production configuration guide

### Testing
- **`TEST_RESULTS.md`** - End-to-end test results

## 🏗️ Architecture

```
NGO Donations Platform
├── Backend (FastAPI - Python)
│   ├── app/
│   │   ├── routers/       # API endpoints
│   │   ├── models.py      # Database models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── core/          # Configuration & database
│   │   ├── middleware/    # Custom middleware
│   │   └── main.py        # FastAPI app
│   ├── alembic/           # Database migrations
│   └── requirements.txt   # Python dependencies
│
├── Frontend (React + TypeScript)
│   ├── src/
│   │   ├── pages/         # React pages
│   │   ├── components/    # Reusable components
│   │   ├── api/           # API client
│   │   └── main.tsx       # Entry point
│   ├── package.json       # Node dependencies
│   └── vite.config.ts     # Vite configuration
│
└── Database (PostgreSQL)
    └── docker-compose.yml # Docker setup
```

## 🔧 Common Issues & Solutions

### 1. Database Connection Failed
**Problem:** `could not translate host name "123@localhost"`

**Solution:** URL-encode the password in `.env`:
```env
# If password is: postgres@123
DATABASE_URL=postgresql://postgres:postgres%40123@localhost:5432/ngo_db
```

### 2. Dashboards Not Visible
**Problem:** User role showing as `undefined`

**Solution:** Already fixed! The `/auth/me` endpoint now returns user role from membership table.

### 3. No Data in Admin Console
**Problem:** Admin endpoints returning empty arrays

**Solution:** Already fixed! Real admin endpoints created in `app/routers/admin.py`

### 4. Microsite Preview 404
**Problem:** "Request failed with status code 404"

**Solution:** Already fixed! Frontend now calls `/public/tenants/{slug}` correctly

### 5. CORS Errors
**Problem:** Cross-origin request blocked

**Solution:** Update `ALLOWED_ORIGINS` in `.env`:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 6. Port Already in Use
**Problem:** `Address already in use`

**Solution:**
```bash
# Windows - Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or use different port
uvicorn app.main:app --port 8001
```

## 🧪 Testing

### Run Backend Tests
```bash
pytest
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:8000/healthz

# Get demo users
curl http://localhost:8000/demo/users

# Get categories
curl http://localhost:8000/public/categories
```

### Test Frontend
```bash
npm run test
```

## 📦 Building for Production

### Backend
```bash
# Already production-ready!
# Just set environment variables in .env
APP_ENV=prod
DEBUG=false
```

### Frontend
```bash
# Build
npm run build

# Output in dist/ folder
```

## 🔄 Git Workflow

### Pull Latest Changes
```bash
git pull origin master
```

### After Pulling
```bash
# Update backend dependencies
pip install -r requirements.txt

# Update frontend dependencies  
npm install

# Run any new migrations
alembic upgrade head

# Restart servers
```

## 🆘 Getting Help

### Check Documentation
1. Read `START_APP.md` for startup guide
2. Check fix documentation for specific issues
3. Review `DEPLOYMENT_GUIDE.md` for advanced setup

### Debug Mode
```bash
# Backend with debug logs
uvicorn app.main:app --log-level debug

# Frontend with source maps
npm run dev
```

### View Logs
```bash
# Backend logs (if using PM2)
pm2 logs ngo-backend

# Docker logs
docker logs ngo_postgres
```

## 👥 Team Collaboration

### Before Pushing Code
```bash
# Test locally
npm run build          # Test frontend build
python -m pytest       # Run backend tests

# Check for errors
npm run lint          # Frontend linting
black app/            # Backend formatting
```

### Commit Messages
Use clear, descriptive commit messages:
```bash
git commit -m "fix: resolve database connection issue with URL encoding"
git commit -m "feat: add admin endpoints for data synchronization"
git commit -m "docs: update setup guide with troubleshooting"
```

## 📋 Environment Variables Reference

### Backend Required
- `APP_ENV` - Environment (dev/prod)
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT secret key
- `ALLOWED_ORIGINS` - CORS allowed origins
- `EXTERNAL_BASE_URL` - API base URL

### Backend Optional
- `RAZORPAY_KEY_ID` - Payment gateway key
- `RAZORPAY_KEY_SECRET` - Payment gateway secret
- `S3_ENDPOINT` - File storage endpoint
- `S3_BUCKET` - S3 bucket name
- `S3_ACCESS_KEY` - S3 access key
- `S3_SECRET_KEY` - S3 secret key

### Frontend Optional
- `VITE_API_BASE_URL` - Backend API URL (auto-detects if not set)

## 🚀 Recent Major Fixes

### ✅ Database Connection (DASHBOARD_FIX.md)
- Fixed URL encoding for special characters in password
- Password `postgres@123` → `postgres%40123`

### ✅ User Role Resolution (USER_ROLE_FIX.md)
- Enhanced `/auth/me` to return user role from membership
- Dashboards now load correctly for all user types

### ✅ Data Synchronization (DATA_SYNC_FIX.md)
- Created complete admin router with real database queries
- NGO admins can see vendors, vendors can see NGOs
- All dashboard data now syncing correctly

### ✅ Microsite Preview (MICROSITE_FIX.md)
- Fixed API endpoint from `/tenant/{slug}` to `/public/tenants/{slug}`
- Microsite preview now working

### ✅ Production Ready (NO_HARDCODED_VALUES.md)
- Removed all hardcoded values
- 100% environment-based configuration
- Ready for Contabo deployment

## 📞 Support

For issues or questions:
1. Check documentation in repository
2. Review fix documentation for known issues
3. Contact team lead
4. Create GitHub issue with details

---

**Status:** ✅ Production Ready  
**Latest Update:** All major fixes applied  
**Deployment:** Ready for Contabo  

Happy Coding! 🎉
