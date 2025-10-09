# NGO Platform - Contabo Deployment Steps

## 🎯 Quick Deployment Guide

This guide will help you deploy the NGO Donations Platform to your Contabo server in **under 30 minutes**.

---

## 📋 Prerequisites

### On Contabo
- Fresh Ubuntu 20.04/22.04 server
- Root/sudo access
- At least 2GB RAM, 2 CPU cores
- 20GB+ storage

### On Your Local Machine
- Domain name configured
- SSH access to Contabo server
- Git repository access

---

## 🚀 Step-by-Step Deployment

### Step 1: Connect to Contabo Server

```bash
# SSH into your Contabo server
ssh root@your-server-ip
```

### Step 2: Clone Repository

```bash
# Clone the repository
git clone https://github.com/sapradeep123/NGO_Oct.git
cd NGO_Oct
cd deploy
```

### Step 3: Make Scripts Executable

```bash
# Make all deployment scripts executable
chmod +x *.sh
```

### Step 4: Run Server Setup

```bash
# This installs all required software (takes ~10 minutes)
sudo ./contabo_setup.sh
```

**What this does:**
- ✅ Updates Ubuntu system
- ✅ Installs Python 3.11
- ✅ Installs Node.js 18
- ✅ Installs PostgreSQL 15
- ✅ Installs Nginx
- ✅ Installs Certbot (for SSL)
- ✅ Installs PM2 (process manager)
- ✅ Configures firewall
- ✅ Creates database and user
- ✅ Saves database credentials to `/root/ngo_db_credentials.txt`

**Important:** Save the database password shown at the end!

### Step 5: Configure DNS

**Before proceeding, configure your domain:**

1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Add an A record:
   - **Name**: `@` (or your subdomain)
   - **Type**: `A`
   - **Value**: Your Contabo server IP
   - **TTL**: 300 (5 minutes)

3. Add a www A record:
   - **Name**: `www`
   - **Type**: `A`
   - **Value**: Your Contabo server IP
   - **TTL**: 300

4. Wait 5-30 minutes for DNS propagation

**Verify DNS:**
```bash
dig your-domain.com
# Should show your server IP
```

### Step 6: Deploy Application

```bash
# Run the deployment script
sudo ./deploy_app.sh
```

**You will be asked for:**
- Domain name (e.g., ngo.example.com)
- Database password (from Step 4)
- JWT secret key (press Enter to auto-generate)
- Whether to seed database with demo data (recommended: yes)

**What this does:**
- ✅ Clones/updates repository
- ✅ Installs backend dependencies
- ✅ Creates production .env file
- ✅ Runs database migrations
- ✅ Seeds database (if selected)
- ✅ Builds frontend
- ✅ Configures PM2 for backend
- ✅ Configures Nginx

**Your app is now live at:** `http://your-domain.com`

### Step 7: Setup SSL/HTTPS (Recommended)

```bash
# Run SSL setup
sudo ./setup_ssl.sh your-domain.com
```

**You will be asked for:**
- Email address (for SSL certificate notifications)

**What this does:**
- ✅ Obtains free SSL certificate from Let's Encrypt
- ✅ Configures Nginx for HTTPS
- ✅ Enables HTTP to HTTPS redirect
- ✅ Sets up auto-renewal (certificates valid 90 days)
- ✅ Updates backend configuration for HTTPS

**Your app is now live at:** `https://your-domain.com` 🎉

### Step 8: Verify Deployment

```bash
# Run verification script
sudo ./verify_deployment.sh your-domain.com
```

This checks:
- ✅ All services running
- ✅ Database configured
- ✅ SSL certificate valid
- ✅ HTTP endpoints working
- ✅ Logs being generated

---

## 🔐 Login Credentials

After deployment (if you seeded the database):

| Role | Email | Password |
|------|-------|----------|
| Platform Admin | admin@example.com | Admin@123 |
| NGO Admin | ngo.hope.admin@example.com | Ngo@123 |
| Donor | donor.arya@example.com | Donor@123 |
| Vendor | vendor.alpha@example.com | Vendor@123 |

---

## 📊 Useful Commands

### Check Application Status
```bash
# Backend status
pm2 status

# Backend logs (live)
pm2 logs ngo-backend

# Nginx status
systemctl status nginx
```

### Restart Services
```bash
# Restart backend
pm2 restart ngo-backend

# Restart nginx
systemctl restart nginx

# Restart PostgreSQL
systemctl restart postgresql
```

### View Logs
```bash
# Backend error logs
tail -f /var/log/ngo-backend-error.log

# Backend output logs
tail -f /var/log/ngo-backend-out.log

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log
```

### Update Application
```bash
# Pull latest code and redeploy
cd /root/NGO_Oct/deploy
sudo ./update_app.sh
```

### Database Access
```bash
# Connect to database
sudo -u postgres psql ngo_db

# Backup database
sudo -u postgres pg_dump ngo_db > backup_$(date +%Y%m%d).sql

# Restore database
sudo -u postgres psql ngo_db < backup_20250109.sql
```

---

## 🔧 Troubleshooting

### Backend Not Starting
```bash
# Check logs
pm2 logs ngo-backend

# Common issues:
# 1. Database connection - check .env file
# 2. Port already in use - kill process on 8000
# 3. Missing dependencies - run: cd /var/www/ngo-platform && source venv/bin/activate && pip install -r requirements.txt
```

### Frontend Not Loading
```bash
# Check nginx config
nginx -t

# Check if built
ls -la /var/www/ngo-platform/dist

# Rebuild frontend
cd /var/www/ngo-platform
sudo -u ngoapp npm run build
```

### Database Connection Issues
```bash
# Check PostgreSQL status
systemctl status postgresql

# Check connection
sudo -u postgres psql -c '\l'

# Check .env file password is URL-encoded
cat /var/www/ngo-platform/.env | grep DATABASE_URL
```

### SSL Certificate Issues
```bash
# Test renewal
certbot renew --dry-run

# Force renewal
certbot renew --force-renewal

# Check certificate
certbot certificates
```

---

## 🔄 Update/Redeploy Process

When you push code changes to GitHub:

```bash
# On Contabo server
cd /root/NGO_Oct/deploy
sudo ./update_app.sh
```

This will:
1. Pull latest code
2. Update dependencies
3. Run migrations
4. Rebuild frontend
5. Restart backend
6. Reload Nginx

---

## 🛡️ Security Checklist

After deployment, ensure:

- ✅ Firewall (UFW) is enabled
- ✅ SSH key authentication (disable password login)
- ✅ Fail2ban is configured
- ✅ PostgreSQL only listens on localhost
- ✅ Regular backups scheduled
- ✅ SSL certificate auto-renewal working
- ✅ Strong database password
- ✅ Unique JWT secret key

### Harden SSH (Optional)
```bash
# Edit SSH config
nano /etc/ssh/sshd_config

# Set:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

# Restart SSH
systemctl restart sshd
```

---

## 📦 File Locations

| Item | Location |
|------|----------|
| Application | `/var/www/ngo-platform` |
| Backend .env | `/var/www/ngo-platform/.env` |
| Frontend build | `/var/www/ngo-platform/dist` |
| Nginx config | `/etc/nginx/sites-available/ngo-platform` |
| SSL certificates | `/etc/letsencrypt/live/your-domain.com/` |
| Database credentials | `/root/ngo_db_credentials.txt` |
| Backend logs | `/var/log/ngo-backend-*.log` |
| Nginx logs | `/var/log/nginx/` |

---

## 🆘 Getting Help

### Check Documentation
1. `DEPLOYMENT_GUIDE.md` - Complete deployment guide
2. `NO_HARDCODED_VALUES.md` - Configuration reference
3. `README.md` - Project overview

### Common Issues Solved
- Database connection → Check password URL encoding
- Backend not starting → Check logs: `pm2 logs`
- Frontend 404 → Check Nginx config: `nginx -t`
- SSL issues → Check Certbot: `certbot certificates`

### Support
- Check GitHub issues
- Review deployment logs
- Contact team lead

---

## ✅ Deployment Checklist

Use this checklist to ensure everything is set up:

### Pre-Deployment
- [ ] Contabo server ready (Ubuntu 20.04/22.04)
- [ ] Domain name purchased
- [ ] DNS configured
- [ ] SSH access confirmed

### Server Setup
- [ ] Ran `contabo_setup.sh`
- [ ] Saved database credentials
- [ ] Verified all services installed

### Application Deployment
- [ ] Ran `deploy_app.sh`
- [ ] Provided domain name
- [ ] Provided database password
- [ ] Seeded database
- [ ] Confirmed app accessible via HTTP

### SSL Setup
- [ ] DNS propagated (verified with `dig`)
- [ ] Ran `setup_ssl.sh`
- [ ] Provided email for notifications
- [ ] Confirmed app accessible via HTTPS

### Verification
- [ ] Ran `verify_deployment.sh`
- [ ] All checks passed
- [ ] Can login to application
- [ ] All dashboards working
- [ ] API responding correctly

### Post-Deployment
- [ ] Changed default passwords
- [ ] Configured email settings (if needed)
- [ ] Set up regular backups
- [ ] Documented custom configurations
- [ ] Tested update process

---

## 🎉 Success!

If all steps completed successfully:

✅ Your NGO Donations Platform is live!  
✅ Accessible at `https://your-domain.com`  
✅ Backend API at `https://your-domain.com/api/`  
✅ SSL certificate auto-renews  
✅ Application auto-restarts on server reboot  
✅ Logs being collected  

**Next Steps:**
1. Change default passwords
2. Configure payment gateway (Razorpay)
3. Set up email notifications
4. Configure file storage (S3/MinIO)
5. Customize branding
6. Add your NGOs and vendors

---

**Need help?** Check the troubleshooting section or review the deployment logs!

