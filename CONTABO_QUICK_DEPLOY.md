# Contabo Quick Deploy Checklist

## ✅ Pre-Deployment Verification

**Good News:** Your application has **ZERO hardcoded values**! It's 100% ready for Contabo deployment.

---

## 📋 Quick Deploy Steps

### 1. Prepare Contabo Server
```bash
# SSH into your Contabo server
ssh root@your-contabo-ip

# Update system
apt update && apt upgrade -y

# Install requirements
apt install -y python3.11 python3-pip python3-venv nodejs npm postgresql nginx git
npm install -g pm2
```

### 2. Setup Database
```bash
# Create PostgreSQL database
sudo -u postgres psql
CREATE DATABASE ngo_db;
CREATE USER ngo_user WITH PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE ngo_db TO ngo_user;
\q
```

### 3. Deploy Backend
```bash
# Clone and setup
cd /var/www
git clone YOUR_REPO_URL ngo-platform
cd ngo-platform
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure
cp .env.production.example .env
nano .env  # Update with your values

# Migrate database
alembic upgrade head

# Start with PM2
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000" --name ngo-backend
pm2 save
```

### 4. Deploy Frontend
```bash
# Configure
cp .env.frontend.production .env.production
nano .env.production  # Set VITE_API_BASE_URL

# Build
npm install
npm run build

# Deploy
mkdir -p /var/www/ngo-frontend
cp -r dist/* /var/www/ngo-frontend/
```

### 5. Configure Nginx
```bash
# Create config
nano /etc/nginx/sites-available/ngo-platform
```

**Paste this configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/ngo-frontend;
        try_files $uri /index.html;
    }

    # Backend API
    location ~ ^/(auth|public|admin|donations|vendors|ngo|donor|healthz|docs) {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable and restart
ln -s /etc/nginx/sites-available/ngo-platform /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 6. Setup SSL
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get certificate
certbot --nginx -d your-domain.com
```

---

## 🔧 Essential Configuration

### Backend .env (Required)
```env
APP_ENV=prod
DATABASE_URL=postgresql://ngo_user:YOUR_PASSWORD@localhost:5432/ngo_db
SECRET_KEY=$(openssl rand -hex 32)
ALLOWED_ORIGINS=https://your-domain.com
EXTERNAL_BASE_URL=https://your-domain.com
```

### Frontend .env.production (Optional - auto-detects if same domain)
```env
VITE_API_BASE_URL=https://your-domain.com
```

---

## ✅ Post-Deploy Verification

```bash
# 1. Check backend
curl https://your-domain.com/healthz
# Should return: {"status":"healthy"}

# 2. Check frontend
curl https://your-domain.com
# Should return HTML

# 3. Check API
curl https://your-domain.com/demo/users
# Should return JSON

# 4. View logs
pm2 logs ngo-backend
```

---

## 🚨 Common Issues & Fixes

### Database Connection Failed
```bash
# Check password is URL-encoded in .env
# @ → %40, # → %23, etc.
DATABASE_URL=postgresql://user:pass%40word@host:5432/db
```

### CORS Error
```env
# Add your domain to ALLOWED_ORIGINS
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### 502 Bad Gateway
```bash
# Check backend is running
pm2 status
pm2 restart ngo-backend
```

### API Not Found
```bash
# Check Nginx configuration includes all API paths
# Should have: /auth, /public, /admin, /donations, etc.
```

---

## 📱 Access Your Application

- **Website**: https://your-domain.com
- **API Docs**: https://your-domain.com/docs
- **Health Check**: https://your-domain.com/healthz
- **Demo Users**: https://your-domain.com/demo/users

### Login Credentials
- **Admin**: admin@example.com / Admin@123
- **NGO Admin**: ngo.hope.admin@example.com / Ngo@123
- **Donor**: donor.arya@example.com / Donor@123

---

## 🔄 Update Application

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
cp -r dist/* /var/www/ngo-frontend/
```

---

## 📚 Full Documentation

- **`DEPLOYMENT_GUIDE.md`** - Complete deployment guide
- **`NO_HARDCODED_VALUES.md`** - Configuration details
- **`.env.production.example`** - Environment template

---

**Deployment Time:** ~30 minutes  
**Difficulty:** Easy  
**Hardcoded Values:** None ✅

