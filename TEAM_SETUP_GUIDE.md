# Team Setup Guide - For New Developers

## 🎯 Quick Setup (15 Minutes)

This guide will get you up and running FAST with zero errors.

---

## ✅ Step 1: Pull Latest Code

```bash
git pull origin master
```

**What you'll get:**
- All bug fixes applied
- Complete documentation
- Production-ready configuration
- Helper scripts

---

## ✅ Step 2: Install Dependencies

### Backend (Python)
```bash
# Create virtual environment
python -m venv venv

# Activate it
# Windows PowerShell:
venv\Scripts\Activate.ps1

# Windows CMD:
venv\Scripts\activate.bat

# Linux/Mac:
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

### Frontend (Node.js)
```bash
npm install
```

---

## ✅ Step 3: Setup Database

### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL
docker compose up -d

# Check it's running
docker ps
```

### Option B: Local PostgreSQL
```bash
# Install PostgreSQL 15
# Create database
createdb ngo_db
```

---

## ✅ Step 4: Configure Environment

### Copy Template
```bash
# Windows
copy .env.production.example .env

# Linux/Mac
cp .env.production.example .env
```

### Edit `.env` File

**⚠️ IMPORTANT: URL-encode special characters in password!**

```env
APP_ENV=dev
DEBUG=true

# If password is postgres@123, encode @ as %40:
DATABASE_URL=postgresql://postgres:postgres%40123@localhost:5432/ngo_db

# Generate with: openssl rand -hex 32
SECRET_KEY=your-secret-key-here

# For local development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
EXTERNAL_BASE_URL=http://localhost:8000
```

### Special Characters Encoding:
| Character | Encoded | Example |
|-----------|---------|---------|
| `@` | `%40` | `pass@123` → `pass%40123` |
| `#` | `%23` | `pass#123` → `pass%23123` |
| `$` | `%24` | `pass$123` → `pass%24123` |

---

## ✅ Step 5: Initialize Database

```bash
# Run migrations
alembic upgrade head

# Seed demo data (IMPORTANT!)
python seed.py
```

**Verify seeding:**
```bash
# Should show 5 users
python -c "from app.core.database import engine; from sqlalchemy import text; conn = engine.connect(); print(f'Users: {conn.execute(text(\"SELECT COUNT(*) FROM users\")).scalar()}'); conn.close()"
```

---

## ✅ Step 6: Start Development Servers

### Option 1: PowerShell Scripts (Easiest!)

```powershell
# Terminal 1 - Backend
.\start_backend.ps1

# Terminal 2 - Frontend  
.\start_frontend.ps1
```

### Option 2: Manual Start

```bash
# Terminal 1 - Backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend
npm run dev
```

---

## ✅ Step 7: Verify Everything Works

### Test Backend
```bash
# Should return: {"status": "healthy"}
curl http://localhost:8000/healthz
```

### Test Frontend
Open browser: http://localhost:5173

### Login
Use these credentials:
- **Admin**: admin@example.com / Admin@123
- **NGO Admin**: ngo.hope.admin@example.com / Ngo@123
- **Donor**: donor.arya@example.com / Donor@123

---

## 🐛 Common Issues (And Quick Fixes!)

### Issue 1: "Database connection failed"

**Error:**
```
could not translate host name "123@localhost"
```

**Fix:**
Your password has `@` symbol - URL-encode it!
```env
# Wrong
DATABASE_URL=postgresql://postgres:postgres@123@localhost:5432/ngo_db

# Correct
DATABASE_URL=postgresql://postgres:postgres%40123@localhost:5432/ngo_db
```

---

### Issue 2: "Port already in use"

**Error:**
```
Address already in use: 8000
```

**Fix:**
```bash
# Windows - Find and kill process
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

---

### Issue 3: "Module not found: psycopg2"

**Error:**
```
ModuleNotFoundError: No module named 'psycopg2'
```

**Fix:**
```bash
# Make sure virtual environment is activated!
# You should see (venv) in your prompt

# If not activated:
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies again
pip install -r requirements.txt
```

---

### Issue 4: "Docker not running"

**Error:**
```
Cannot connect to the Docker daemon
```

**Fix:**
```bash
# Start Docker Desktop
# Wait for it to fully start (whale icon should be steady)

# Then try again
docker compose up -d
```

---

### Issue 5: "Dashboard not loading / No data"

**Fix:**
Already fixed in latest code! Just pull and it works.

**Verify:**
```bash
# Should return user role
curl http://localhost:8000/auth/me -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Issue 6: "CORS error in browser"

**Error:**
```
Access-Control-Allow-Origin error
```

**Fix:**
Check `.env` file:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Restart backend after changing `.env`!

---

## 📋 Daily Development Workflow

### Start Work
```bash
# 1. Pull latest code
git pull origin master

# 2. Update dependencies if needed
pip install -r requirements.txt
npm install

# 3. Run migrations
alembic upgrade head

# 4. Start servers
.\start_backend.ps1  # Terminal 1
.\start_frontend.ps1  # Terminal 2
```

### End Work
```bash
# Just close terminals or Ctrl+C

# Optional: Stop Docker
docker compose down
```

---

## 🔧 Development Tools

### View API Documentation
http://localhost:8000/docs

### View Database (pgAdmin)
http://localhost:5050
- Email: admin@example.com
- Password: admin123

### Check Backend Logs
Just look at the terminal where backend is running

### Check Frontend Errors
Open browser DevTools (F12) → Console tab

---

## 📚 Helpful Documentation

In the repository, you'll find:

| File | What It's For |
|------|---------------|
| `README.md` | Project overview |
| `START_APP.md` | Detailed startup guide |
| `CHANGELOG.md` | What changed in latest version |
| `DASHBOARD_FIX.md` | Database connection fix |
| `USER_ROLE_FIX.md` | Role resolution fix |
| `DATA_SYNC_FIX.md` | Admin endpoints fix |
| `DEPLOYMENT_GUIDE.md` | Production deployment |

---

## ✅ Checklist for Success

Before starting development, verify:

- [ ] Docker is running
- [ ] Virtual environment is activated (`(venv)` in prompt)
- [ ] `.env` file exists with correct DATABASE_URL
- [ ] Password in DATABASE_URL is URL-encoded
- [ ] Migrations ran successfully (`alembic upgrade head`)
- [ ] Database seeded (`python seed.py`)
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can login at http://localhost:5173
- [ ] Dashboard loads with data

---

## 🆘 Still Having Issues?

### 1. Check Documentation
- Read `START_APP.md` for detailed guide
- Check specific fix docs (DASHBOARD_FIX.md, etc.)

### 2. Verify Environment
```bash
# Check Python version (should be 3.11+)
python --version

# Check Node version (should be 18+)
node --version

# Check Docker is running
docker ps
```

### 3. Clean Restart
```bash
# Stop everything
docker compose down
# Kill all processes on ports 8000 and 5173

# Start fresh
docker compose up -d
alembic upgrade head
.\start_backend.ps1
.\start_frontend.ps1
```

### 4. Ask Team Lead
Provide:
- Error message (full text)
- What you were doing
- Your `.env` file (WITHOUT passwords!)
- Python/Node versions

---

## 🎉 You're All Set!

If you:
- Can access http://localhost:5173
- Can login as admin@example.com
- See the dashboard with data

**You're ready to develop!** 🚀

---

**Need Help?** Check the documentation or ask the team!

**Found a Bug?** Create a GitHub issue with details.

**Have a Suggestion?** We'd love to hear it!

Happy Coding! 💻

