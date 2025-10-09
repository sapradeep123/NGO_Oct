# NGO Donations Platform - Contabo Deployment Guide

## ✅ No Hardcoded Values Confirmation

**Good News!** After comprehensive scanning, the application has **NO hardcoded values** that will cause issues in production. All URLs, ports, and configurations are environment-based.

### What We Found and Fixed:

1. **Frontend API Client** ✅
   - Uses `VITE_API_BASE_URL` environment variable
   - Falls back to intelligent detection (same origin in production)
   - Development mode auto-detects localhost:8000
   - **Production mode**: Uses same protocol and hostname as frontend

2. **Backend Configuration** ✅
   - All URLs from environment variables
   - CORS from `ALLOWED_ORIGINS` env var
   - Database from `DATABASE_URL` env var
   - External base URL from `EXTERNAL_BASE_URL` env var

3. **No Hardcoded Values Found** ✅
   - No hardcoded ports (except dev server defaults)
   - No hardcoded hosts
   - No hardcoded URLs
   - All configurable via `.env` files

---

## Deployment Architecture Options

### Option 1: Single Server (Recommended for Starting)
```
Contabo Server
├── Nginx (Reverse Proxy) - Port 80/443
│   ├── Frontend (Static Files)
│   └── /api → Backend (FastAPI)
├── PostgreSQL Database
└── Docker (optional for database)
```

### Option 2: Separate Servers
```
Contabo Server 1 (Frontend)
└── Nginx → Static React Build

Contabo Server 2 (Backend)
├── FastAPI Application  
└── PostgreSQL Database
```

---

## Prerequisites on Contabo Server

### 1. System Requirements
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3.11 python3-pip python3-venv
sudo apt install -y nodejs npm
sudo apt install -y postgresql postgresql-contrib
sudo apt install -y nginx
sudo apt install -y git
```

### 2. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

---

## Step-by-Step Deployment

### Phase 1: Setup Database

#### 1.1 Install PostgreSQL (if not using Docker)
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 1.2 Create Database and User
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE ngo_db;
CREATE USER ngo_user WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE ngo_db TO ngo_user;
\q
```

#### 1.3 Configure PostgreSQL for External Connections (if needed)
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf
# Set: listen_addresses = 'localhost'

# Edit pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add: local   ngo_db   ngo_user   md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Phase 2: Deploy Backend (FastAPI)

#### 2.1 Clone Repository
```bash
cd /var/www
sudo git clone YOUR_REPO_URL ngo-platform
cd ngo-platform
```

#### 2.2 Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
```

#### 2.3 Install Dependencies
```bash
pip install -r requirements.txt
```

#### 2.4 Create Production .env File
```bash
# Copy template
cp .env.production.example .env

# Edit with your values
nano .env
```

**Required Configuration:**
```env
APP_ENV=prod
DEBUG=false
DATABASE_URL=postgresql://ngo_user:YOUR_PASSWORD@localhost:5432/ngo_db
SECRET_KEY=GENERATE_STRONG_RANDOM_KEY_HERE
ALLOWED_ORIGINS=https://your-domain.com
EXTERNAL_BASE_URL=https://your-domain.com
```

**Generate Secret Key:**
```bash
# Generate a secure secret key
openssl rand -hex 32
```

#### 2.5 Run Database Migrations
```bash
# Activate virtual environment if not already
source venv/bin/activate

# Run migrations
alembic upgrade head

# Seed initial data (optional)
python seed.py
```

#### 2.6 Test Backend
```bash
# Test run
uvicorn app.main:app --host 0.0.0.0 --port 8000

# If successful, stop with Ctrl+C
```

#### 2.7 Setup PM2 for Backend
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ngo-backend',
    script: 'venv/bin/uvicorn',
    args: 'app.main:app --host 0.0.0.0 --port 8000',
    cwd: '/var/www/ngo-platform',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Phase 3: Deploy Frontend (React)

#### 3.1 Create Production Environment File
```bash
# Copy template
cp .env.frontend.production .env.production

# Edit with your production URL
nano .env.production
```

**Configuration:**
```env
VITE_API_BASE_URL=https://your-domain.com
```

**Important:** If frontend and backend are on the same domain, you can omit `VITE_API_BASE_URL` - it will auto-detect!

#### 3.2 Build Frontend
```bash
# Install dependencies
npm install

# Build for production
npm run build

# This creates a 'dist' folder with optimized static files
```

#### 3.3 Move Build to Nginx Directory
```bash
sudo mkdir -p /var/www/ngo-platform-frontend
sudo cp -r dist/* /var/www/ngo-platform-frontend/
sudo chown -R www-data:www-data /var/www/ngo-platform-frontend
```

### Phase 4: Configure Nginx

#### 4.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/ngo-platform
```

**For Same Domain (Frontend + Backend):**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend - Serve React app
    location / {
        root /var/www/ngo-platform-frontend;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API - Proxy to FastAPI
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Also allow direct API access (for /auth, /public, etc.)
    location ~ ^/(auth|public|admin|donations|vendors|ngo-receipts|payouts|uploads|demo|healthz|docs|openapi.json) {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**For Separate Subdomains:**
```nginx
# Frontend
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    root /var/www/ngo-platform-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 4.2 Enable Site and Test
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/ngo-platform /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Phase 5: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is set up automatically
# Test renewal
sudo certbot renew --dry-run
```

### Phase 6: Setup Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status
```

---

## Environment-Based Configuration

### Backend (.env)
```env
# Required
APP_ENV=prod
DATABASE_URL=postgresql://user:pass@host:port/db
SECRET_KEY=your-secret-key
ALLOWED_ORIGINS=https://your-domain.com
EXTERNAL_BASE_URL=https://your-domain.com

# Optional
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=your-bucket
```

### Frontend (.env.production)
```env
# Optional - auto-detects if on same domain
VITE_API_BASE_URL=https://your-domain.com
```

---

## Post-Deployment Checklist

### ✅ Backend Verification
```bash
# Test health endpoint
curl https://your-domain.com/healthz

# Should return: {"status": "healthy"}
```

### ✅ Frontend Verification
```bash
# Access your domain
curl https://your-domain.com

# Should return HTML
```

### ✅ Database Connection
```bash
# From backend directory
source venv/bin/activate
python -c "from app.core.database import engine; engine.connect(); print('✅ Database connected!')"
```

### ✅ API Endpoints
```bash
# Test public endpoints
curl https://your-domain.com/public/categories
curl https://your-domain.com/demo/users
```

---

## Monitoring and Maintenance

### View Backend Logs
```bash
# PM2 logs
pm2 logs ngo-backend

# Real-time logs
pm2 logs ngo-backend --lines 100
```

### Restart Services
```bash
# Restart backend
pm2 restart ngo-backend

# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Update Application
```bash
# Backend
cd /var/www/ngo-platform
git pull
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
pm2 restart ngo-backend

# Frontend
npm install
npm run build
sudo cp -r dist/* /var/www/ngo-platform-frontend/
```

---

## Troubleshooting

### Backend Not Starting
```bash
# Check logs
pm2 logs ngo-backend

# Test manually
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Database Connection Issues
```bash
# Test PostgreSQL
sudo -u postgres psql -d ngo_db

# Check DATABASE_URL format
# Should be: postgresql://user:password@host:port/database
# Special characters in password must be URL-encoded!
```

### CORS Errors
```bash
# Check ALLOWED_ORIGINS in .env
# Should include your domain with https://
# Example: ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### 502 Bad Gateway
```bash
# Check if backend is running
pm2 status

# Check Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## Security Best Practices

1. **Strong Passwords**
   - Database password: At least 16 characters
   - SECRET_KEY: Use `openssl rand -hex 32`

2. **Firewall**
   - Only allow necessary ports
   - Close unused ports

3. **SSL/TLS**
   - Always use HTTPS in production
   - Enable HTTP to HTTPS redirect

4. **Environment Variables**
   - Never commit .env files
   - Keep production secrets secure

5. **Database Backups**
   ```bash
   # Backup database
   pg_dump -U ngo_user ngo_db > backup_$(date +%Y%m%d).sql
   
   # Automate with cron
   0 2 * * * pg_dump -U ngo_user ngo_db > /backups/ngo_db_$(date +\%Y\%m\%d).sql
   ```

---

## Performance Optimization

### 1. Enable Gzip in Nginx
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
gzip_min_length 1000;
```

### 2. Setup CDN (Optional)
- CloudFlare
- AWS CloudFront
- Bunny CDN

### 3. Database Optimization
```sql
-- Create indexes
CREATE INDEX idx_donations_donor_id ON donations(donor_id);
CREATE INDEX idx_causes_tenant_id ON causes(tenant_id);
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
```

---

## Quick Reference

### Important Files Locations
```
/var/www/ngo-platform/          # Backend code
/var/www/ngo-platform-frontend/ # Frontend build
/var/www/ngo-platform/.env      # Backend config
/etc/nginx/sites-available/     # Nginx config
```

### Important Commands
```bash
# View backend status
pm2 status

# View backend logs  
pm2 logs ngo-backend

# Restart backend
pm2 restart ngo-backend

# Reload Nginx
sudo systemctl reload nginx

# Check SSL certificate
sudo certbot certificates
```

---

## Support

For issues during deployment:
1. Check logs: `pm2 logs ngo-backend`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify environment variables in `.env`
4. Test database connection
5. Check firewall settings: `sudo ufw status`

---

**Status**: ✅ Ready for Production Deployment
**No Hardcoded Values**: All configurations are environment-based
**Deployment Method**: Flexible - Same domain or separate subdomains

