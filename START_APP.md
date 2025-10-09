# NGO Donations Platform - Quick Start Guide

This guide provides step-by-step instructions to start the NGO Donations Platform with proper configuration.

## Prerequisites

1. Docker Desktop running
2. PostgreSQL database running in Docker
3. Python virtual environment activated
4. Node.js and npm installed

## Quick Start (Recommended)

### 1. Start Backend

Open a PowerShell terminal and run:

```powershell
.\start_backend.ps1
```

This will:
- Create `.env` file if it doesn't exist
- Start the FastAPI backend on `http://localhost:8000`
- Enable hot reload for development

### 2. Start Frontend (In a NEW terminal)

Open a **new** PowerShell terminal and run:

```powershell
.\start_frontend.ps1
```

This will:
- Create `.env.local` file if it doesn't exist
- Start the Vite dev server on `http://localhost:5173`
- Enable hot module replacement

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **pgAdmin**: http://localhost:5050 (admin@example.com / admin123)

## Manual Start (Alternative)

### Backend

```powershell
# Ensure .env file exists with:
# APP_ENV=dev
# DATABASE_URL=postgresql://postgres:postgres%40123@localhost:5432/ngo_db
# SECRET_KEY=your-secret-key-here-change-in-production
# ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
# EXTERNAL_BASE_URL=http://localhost:8000

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```powershell
# Ensure .env.local file exists with:
# VITE_API_BASE_URL=http://localhost:8000

npm run dev
```

## Demo Login Credentials

After the database is seeded, use these credentials:

1. **Platform Admin**: admin@example.com / Admin@123
2. **NGO Admin**: ngo.hope.admin@example.com / Ngo@123
3. **NGO Staff**: ngo.hope.staff@example.com / Staff@123
4. **Vendor**: vendor.alpha@example.com / Vendor@123
5. **Donor**: donor.arya@example.com / Donor@123

## Troubleshooting

### Backend won't start

1. Check if Docker is running: `docker ps`
2. Check if PostgreSQL is running: `docker ps | Select-String postgres`
3. Verify `.env` file exists and has correct configuration
4. Check if port 8000 is available: `netstat -ano | Select-String ":8000"`

### Frontend won't start

1. Verify `.env.local` file exists with `VITE_API_BASE_URL=http://localhost:8000`
2. Check if port 5173 is available: `netstat -ano | Select-String ":5173"`
3. Clear npm cache: `npm cache clean --force`
4. Reinstall dependencies: `npm install`

### Database connection errors

1. Check Docker containers: `docker ps`
2. Restart PostgreSQL: `docker restart ngo_postgres`
3. Verify database exists: Connect to pgAdmin at http://localhost:5050

### CORS errors

1. Ensure `ALLOWED_ORIGINS` in `.env` includes the frontend URL
2. Restart the backend after changing `.env`
3. Clear browser cache and reload

## Configuration Files

### Backend (.env)

```env
APP_ENV=dev
DATABASE_URL=postgresql://postgres:postgres%40123@localhost:5432/ngo_db
SECRET_KEY=your-secret-key-here-change-in-production
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
EXTERNAL_BASE_URL=http://localhost:8000
```

### Frontend (.env.local)

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Dynamic Configuration

The application is designed to work with minimal changes between localhost and production:

- **Backend**: Uses `EXTERNAL_BASE_URL` from environment
- **Frontend**: Uses `VITE_API_BASE_URL` from environment
- **CORS**: Configured via `ALLOWED_ORIGINS` environment variable
- **Database**: Configured via `DATABASE_URL` environment variable

## Production Deployment

For production deployment:

1. Update `EXTERNAL_BASE_URL` to your production API URL
2. Update `VITE_API_BASE_URL` to your production API URL
3. Update `ALLOWED_ORIGINS` to include your production frontend URL
4. Change `SECRET_KEY` to a strong, random value
5. Set `APP_ENV=prod`
6. Configure proper database URL
7. Set up proper S3/MinIO configuration for file uploads
8. Configure Razorpay keys for payments

## Architecture

- **Backend**: FastAPI (Python) on port 8000
- **Frontend**: React + Vite on port 5173
- **Database**: PostgreSQL on port 5432 (Docker)
- **Admin Tool**: pgAdmin on port 5050 (Docker)

## API Endpoints

- Health Check: `GET /healthz`
- API Docs: `GET /docs`
- Demo Users: `GET /demo/users` (dev only)
- Public Categories: `GET /public/categories`
- Public NGOs: `GET /public/ngos`
- Public Causes: `GET /public/causes`
- Auth Login: `POST /auth/login`
- Auth Register: `POST /auth/register`

## Support

For issues or questions, please check the troubleshooting section above or review the application logs.

