# Contabo Deployment Scripts

Complete deployment automation for NGO Donations Platform on Contabo servers.

---

## 📁 Files Overview

| File | Purpose | When to Use |
|------|---------|-------------|
| **`contabo_setup.sh`** | Initial server setup | First time only |
| **`deploy_app.sh`** | Deploy application | After server setup |
| **`setup_ssl.sh`** | Configure SSL/HTTPS | After DNS is configured |
| **`update_app.sh`** | Update/redeploy code | When code changes |
| **`verify_deployment.sh`** | Verify deployment | Anytime to check status |
| **`DEPLOYMENT_STEPS.md`** | Step-by-step guide | Read this first! |

---

## 🚀 Quick Start

### 1. First Time Deployment

```bash
# On Contabo server
git clone https://github.com/sapradeep123/NGO_Oct.git
cd NGO_Oct/deploy

# Make scripts executable
chmod +x *.sh

# Step 1: Setup server (installs all software)
sudo ./contabo_setup.sh

# Step 2: Deploy application
sudo ./deploy_app.sh

# Step 3: Setup SSL (after DNS configured)
sudo ./setup_ssl.sh your-domain.com

# Step 4: Verify everything
sudo ./verify_deployment.sh your-domain.com
```

### 2. Update Existing Deployment

```bash
# On Contabo server
cd NGO_Oct/deploy
sudo ./update_app.sh
```

---

## 📋 Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. contabo_setup.sh                                         │
│    ├── Update Ubuntu                                        │
│    ├── Install Python 3.11                                  │
│    ├── Install Node.js 18                                   │
│    ├── Install PostgreSQL 15                                │
│    ├── Install Nginx                                        │
│    ├── Install Certbot (SSL)                                │
│    ├── Install PM2                                          │
│    ├── Configure Firewall                                   │
│    └── Create Database                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Configure DNS (Manual)                                   │
│    └── Point domain A record to server IP                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. deploy_app.sh                                            │
│    ├── Clone repository                                     │
│    ├── Install dependencies (backend & frontend)            │
│    ├── Create .env files                                    │
│    ├── Run migrations                                       │
│    ├── Seed database                                        │
│    ├── Build frontend                                       │
│    ├── Configure PM2                                        │
│    └── Configure Nginx                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. setup_ssl.sh                                             │
│    ├── Verify DNS                                           │
│    ├── Obtain SSL certificate                               │
│    ├── Configure HTTPS                                      │
│    ├── Enable auto-renewal                                  │
│    └── Update backend config                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. verify_deployment.sh                                     │
│    ├── Check all services                                   │
│    ├── Test database                                        │
│    ├── Verify SSL                                           │
│    ├── Test HTTP endpoints                                  │
│    └── Check logs                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Script Details

### contabo_setup.sh
**Purpose:** Sets up a fresh Contabo Ubuntu server with all required software.

**What it installs:**
- Ubuntu system updates
- Python 3.11 + pip
- Node.js 18 + npm
- PostgreSQL 15
- Nginx web server
- Certbot (Let's Encrypt SSL)
- PM2 process manager
- Firewall (UFW) + Fail2ban

**What it creates:**
- Application user: `ngoapp`
- Application directory: `/var/www/ngo-platform`
- PostgreSQL database: `ngo_db`
- PostgreSQL user: `ngo_user`
- Database credentials file: `/root/ngo_db_credentials.txt`

**Time:** ~10 minutes

**Usage:**
```bash
sudo ./contabo_setup.sh
```

---

### deploy_app.sh
**Purpose:** Deploys the NGO platform application.

**What it does:**
- Clones GitHub repository
- Creates Python virtual environment
- Installs backend dependencies
- Creates production `.env` file
- Runs database migrations
- Seeds database (optional)
- Installs frontend dependencies
- Builds frontend for production
- Configures PM2 for backend process management
- Configures Nginx reverse proxy

**Required information:**
- Domain name
- Database password (from setup script)
- JWT secret key (auto-generated if blank)

**Time:** ~5-10 minutes

**Usage:**
```bash
sudo ./deploy_app.sh
```

---

### setup_ssl.sh
**Purpose:** Configures SSL/HTTPS using Let's Encrypt.

**Prerequisites:**
- DNS must be configured and propagated
- Domain must point to server IP

**What it does:**
- Verifies DNS configuration
- Obtains SSL certificate from Let's Encrypt
- Updates Nginx config for HTTPS
- Enables HTTP → HTTPS redirect
- Configures auto-renewal (certificates renew every 90 days)
- Updates backend `.env` for HTTPS URLs

**Required information:**
- Domain name (can be passed as argument)
- Email address (for SSL notifications)

**Time:** ~2-3 minutes

**Usage:**
```bash
sudo ./setup_ssl.sh your-domain.com
```

---

### update_app.sh
**Purpose:** Updates application with latest code from GitHub.

**What it does:**
- Pulls latest code from master branch
- Updates backend dependencies
- Runs new database migrations
- Updates frontend dependencies
- Rebuilds frontend
- Restarts backend process
- Reloads Nginx

**Time:** ~3-5 minutes

**Usage:**
```bash
sudo ./update_app.sh
```

---

### verify_deployment.sh
**Purpose:** Comprehensive deployment verification.

**What it checks:**
- ✅ System software (Python, Node, PostgreSQL, Nginx)
- ✅ Application files and directories
- ✅ Running services (PM2, PostgreSQL, Nginx)
- ✅ Database configuration
- ✅ SSL certificates (if configured)
- ✅ HTTP/HTTPS endpoints
- ✅ Firewall rules
- ✅ Log files

**Time:** ~1 minute

**Usage:**
```bash
sudo ./verify_deployment.sh your-domain.com
```

---

## 🔐 Important Files & Credentials

### Database Credentials
**Location:** `/root/ngo_db_credentials.txt`

Contains:
- Database name
- Database user
- Database password
- Full connection string

**⚠️ Keep this secure!**

### Backend Environment
**Location:** `/var/www/ngo-platform/.env`

Contains:
- Database URL
- JWT secret key
- CORS origins
- External base URL
- Payment gateway keys (if configured)
- S3 credentials (if configured)

### Application Directory
**Location:** `/var/www/ngo-platform/`

Structure:
```
/var/www/ngo-platform/
├── app/              # Backend code
├── src/              # Frontend code
├── dist/             # Built frontend (served by Nginx)
├── venv/             # Python virtual environment
├── .env              # Backend environment variables
├── .env.local        # Frontend environment variables
└── ecosystem.config.js  # PM2 configuration
```

---

## 📊 Service Management

### Backend (PM2)
```bash
# Status
pm2 status

# Logs (live)
pm2 logs ngo-backend

# Restart
pm2 restart ngo-backend

# Stop
pm2 stop ngo-backend

# Start
pm2 start ngo-backend
```

### Nginx
```bash
# Status
systemctl status nginx

# Test config
nginx -t

# Restart
systemctl restart nginx

# Reload (no downtime)
systemctl reload nginx
```

### PostgreSQL
```bash
# Status
systemctl status postgresql

# Restart
systemctl restart postgresql

# Access database
sudo -u postgres psql ngo_db
```

---

## 🔄 Update Workflow

When you push code to GitHub:

```bash
# SSH to server
ssh root@your-server-ip

# Navigate to deploy folder
cd NGO_Oct/deploy

# Run update script
sudo ./update_app.sh

# Verify
sudo ./verify_deployment.sh your-domain.com
```

---

## 🐛 Troubleshooting

### Script Fails During Execution

**Check permissions:**
```bash
chmod +x *.sh
```

**Run with sudo:**
```bash
sudo ./script_name.sh
```

**Check logs:**
```bash
# Last 50 lines of system log
journalctl -n 50
```

### Backend Not Starting

**Check PM2 logs:**
```bash
pm2 logs ngo-backend --lines 100
```

**Common issues:**
- Database password not URL-encoded
- Port 8000 already in use
- Missing dependencies

**Fix:**
```bash
cd /var/www/ngo-platform
source venv/bin/activate
pip install -r requirements.txt
pm2 restart ngo-backend
```

### Frontend Not Loading

**Check Nginx:**
```bash
nginx -t
systemctl status nginx
```

**Check if built:**
```bash
ls -la /var/www/ngo-platform/dist/
```

**Rebuild:**
```bash
cd /var/www/ngo-platform
sudo -u ngoapp npm run build
systemctl reload nginx
```

### SSL Certificate Issues

**Check certificate:**
```bash
certbot certificates
```

**Test renewal:**
```bash
certbot renew --dry-run
```

**Force renewal:**
```bash
certbot renew --force-renewal
systemctl reload nginx
```

---

## 📝 Logs

### Application Logs
```bash
# Backend error log
tail -f /var/log/ngo-backend-error.log

# Backend output log
tail -f /var/log/ngo-backend-out.log

# Combined log
tail -f /var/log/ngo-backend-combined.log
```

### System Logs
```bash
# Nginx access
tail -f /var/log/nginx/access.log

# Nginx errors
tail -f /var/log/nginx/error.log

# PostgreSQL
tail -f /var/log/postgresql/postgresql-15-main.log

# System log
journalctl -f
```

---

## 🔒 Security Notes

### Firewall (UFW)
The setup script configures:
- Port 22 (SSH) - ALLOW
- Port 80 (HTTP) - ALLOW
- Port 443 (HTTPS) - ALLOW
- Port 5432 (PostgreSQL) - ALLOW (optional, for remote access)

### Fail2ban
Automatically bans IPs with failed login attempts.

### SSL/TLS
- TLS 1.2 and 1.3 only
- Strong cipher suites
- HSTS enabled
- Auto-renewal configured

### Database
- PostgreSQL listens on localhost only
- Strong password generated
- Dedicated user with limited privileges

---

## ✅ Best Practices

1. **Always backup before updates:**
   ```bash
   sudo -u postgres pg_dump ngo_db > backup_$(date +%Y%m%d).sql
   ```

2. **Test in staging first** (if available)

3. **Monitor logs during deployment:**
   ```bash
   pm2 logs ngo-backend
   ```

4. **Verify after deployment:**
   ```bash
   sudo ./verify_deployment.sh your-domain.com
   ```

5. **Keep credentials secure:**
   - Don't commit `.env` files
   - Rotate JWT secrets periodically
   - Use strong database passwords

---

## 🆘 Support

### Documentation
- `DEPLOYMENT_STEPS.md` - Complete step-by-step guide
- `../DEPLOYMENT_GUIDE.md` - Detailed deployment documentation
- `../README.md` - Project overview

### Common Issues
Check the troubleshooting section in `DEPLOYMENT_STEPS.md`

### Contact
- GitHub Issues
- Team lead
- Documentation files

---

## 📦 What Gets Installed

| Software | Version | Purpose |
|----------|---------|---------|
| Ubuntu | 20.04/22.04 | Operating System |
| Python | 3.11 | Backend runtime |
| Node.js | 18 | Frontend build tool |
| PostgreSQL | 15 | Database |
| Nginx | Latest | Web server & reverse proxy |
| Certbot | Latest | SSL certificates |
| PM2 | Latest | Process manager |
| UFW | Latest | Firewall |
| Fail2ban | Latest | Intrusion prevention |

---

## 🎯 Deployment Checklist

- [ ] Fresh Contabo server ready
- [ ] Domain name configured
- [ ] Run `contabo_setup.sh`
- [ ] Save database credentials
- [ ] Configure DNS A records
- [ ] Wait for DNS propagation
- [ ] Run `deploy_app.sh`
- [ ] Verify HTTP access
- [ ] Run `setup_ssl.sh`
- [ ] Verify HTTPS access
- [ ] Run `verify_deployment.sh`
- [ ] All checks pass ✅
- [ ] Change default passwords
- [ ] Setup backups
- [ ] Configure monitoring

---

**Your NGO Platform will be live and secure!** 🚀

