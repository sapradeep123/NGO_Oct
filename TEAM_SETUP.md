# NGO Platform - Team Setup Guide

## Quick Start for Team Members

### Option 1: Docker Setup (Recommended)
```bash
# 1. Clone the repository
git clone https://github.com/sapradeep123/NGO_Oct.git
cd NGO_Oct

# 2. Copy environment file
cp .env.example .env

# 3. Start everything with Docker
docker-compose -f docker-compose.dev.yml up -d

# 4. Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8002
# Database Admin: http://localhost:5050 (admin@ngo.com / admin123)
```

### Option 2: Local Development Setup
```bash
# 1. Clone the repository
git clone https://github.com/sapradeep123/NGO_Oct.git
cd NGO_Oct

# 2. Start only the database
docker-compose up -d postgres

# 3. Create environment file
echo DATABASE_URL=postgresql+psycopg://ngo_user:postgres@123@localhost:5432/ngo_db > .env
echo SECRET_KEY=your-secret-key-here-change-in-production >> .env

# 4. Install Python dependencies
pip install -r requirements.txt

# 5. Seed the database
python seed.py

# 6. Start backend
python -m uvicorn app.main:app --reload --port 8002

# 7. In another terminal, start frontend
npm install
npm run dev
```

## Demo Login Credentials

- **Platform Admin**: admin@example.com / Admin@123
- **NGO Admin**: ngo.hope.admin@example.com / Ngo@123
- **NGO Staff**: ngo.hope.staff@example.com / Staff@123
- **Vendor**: vendor.alpha@example.com / Vendor@123
- **Donor**: donor.arya@example.com / Donor@123

## Troubleshooting

### Database Connection Issues
- Make sure Docker Desktop is running
- Check if PostgreSQL container is running: `docker ps`
- Restart database: `docker-compose restart postgres`

### Environment Variables
- Make sure `.env` file exists and has correct values
- Check SECRET_KEY is set
- Verify DATABASE_URL points to correct database

### Port Conflicts
- Backend runs on port 8002
- Frontend runs on port 5173
- Database runs on port 5432
- PgAdmin runs on port 5050
