# Contabo Deployment - Quick Reference Card

## 🚀 One-Page Deployment Guide

---

## 📋 Pre-Deployment Checklist

- [ ] Contabo Ubuntu 20.04/22.04 server
- [ ] Root/sudo access
- [ ] Domain name ready
- [ ] SSH access configured

---

## ⚡ Quick Commands

### Initial Deployment (First Time)
```bash
# 1. Clone and setup
git clone https://github.com/sapradeep123/NGO_Oct.git
cd NGO_Oct/deploy
chmod +x *.sh

# 2. Setup server (~10 min)
sudo ./contabo_setup.sh
# Save database password from output!

# 3. Configure DNS (external)
# Add A record: your-domain.com → your-server-ip
# Wait 5-30 minutes for propagation

# 4. Deploy app (~10 min)
sudo ./deploy_app.sh
# Enter: domain, db password, jwt secret

# 5. Setup SSL (~3 min)
sudo ./setup_ssl.sh your-domain.com
# Enter: email address

# 6. Verify (~1 min)
sudo ./verify_deployment.sh your-domain.com
```

### Update Deployment
```bash
cd NGO_Oct/deploy
sudo ./update_app.sh
```

---

## 📂 Important Locations

| Item | Path |
|------|------|
| App Directory | `/var/www/ngo-platform` |
| Backend .env | `/var/www/ngo-platform/.env` |
| Frontend Build | `/var/www/ngo-platform/dist` |
| DB Credentials | `/root/ngo_db_credentials.txt` |
| Nginx Config | `/etc/nginx/sites-available/ngo-platform` |
| SSL Certs | `/etc/letsencrypt/live/your-domain.com/` |
| PM2 Config | `/var/www/ngo-platform/ecosystem.config.js` |

---

## 🔧 Service Commands

### Backend (PM2)
```bash
pm2 status                    # Check status
pm2 logs ngo-backend         # View logs
pm2 restart ngo-backend      # Restart
pm2 stop ngo-backend         # Stop
pm2 start ngo-backend        # Start
pm2 save                     # Save config
```

### Nginx
```bash
systemctl status nginx       # Check status
nginx -t                     # Test config
systemctl restart nginx      # Restart
systemctl reload nginx       # Reload (no downtime)
tail -f /var/log/nginx/access.log
```

### PostgreSQL
```bash
systemctl status postgresql  # Check status
sudo -u postgres psql ngo_db # Access DB
sudo -u postgres pg_dump ngo_db > backup.sql
systemctl restart postgresql
```

---

## 📊 Monitoring & Logs

```bash
# Backend Logs
tail -f /var/log/ngo-backend-error.log
tail -f /var/log/ngo-backend-out.log
pm2 logs ngo-backend --lines 100

# Nginx Logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System Logs
journalctl -f
journalctl -u nginx -n 50
```

---

## 🐛 Common Issues & Fixes

### Backend Not Starting
```bash
# Check logs
pm2 logs ngo-backend

# Fix dependencies
cd /var/www/ngo-platform
source venv/bin/activate
pip install -r requirements.txt

# Restart
pm2 restart ngo-backend
```

### Frontend 404 Errors
```bash
# Check build exists
ls /var/www/ngo-platform/dist/

# Rebuild
cd /var/www/ngo-platform
sudo -u ngoapp npm run build

# Reload nginx
systemctl reload nginx
```

### Database Connection Failed
```bash
# Check .env password is URL-encoded
cat /var/www/ngo-platform/.env | grep DATABASE_URL

# @ should be %40
# If password is postgres@123, use postgres%40123

# Restart backend
pm2 restart ngo-backend
```

### SSL Certificate Issues
```bash
# Check certificate
certbot certificates

# Test renewal
certbot renew --dry-run

# Force renewal
certbot renew --force-renewal

# Reload nginx
systemctl reload nginx
```

---

## 🔐 Security Commands

### Firewall (UFW)
```bash
ufw status                   # Check status
ufw allow 80/tcp            # Allow HTTP
ufw allow 443/tcp           # Allow HTTPS
ufw enable                  # Enable firewall
```

### SSH Hardening
```bash
# Edit SSH config
nano /etc/ssh/sshd_config

# Disable root login
PermitRootLogin no

# Disable password auth
PasswordAuthentication no

# Restart SSH
systemctl restart sshd
```

---

## 💾 Backup & Restore

### Database Backup
```bash
# Backup
sudo -u postgres pg_dump ngo_db > backup_$(date +%Y%m%d).sql

# Restore
sudo -u postgres psql ngo_db < backup_20250109.sql

# Automated backup (cron)
0 2 * * * sudo -u postgres pg_dump ngo_db > /backups/ngo_$(date +\%Y\%m\%d).sql
```

### Application Backup
```bash
# Backup .env
cp /var/www/ngo-platform/.env /root/env_backup_$(date +%Y%m%d)

# Backup uploads (if using local storage)
tar -czf uploads_backup.tar.gz /var/www/ngo-platform/uploads/
```

---

## 🔄 Update Workflow

```bash
# 1. Backup database
sudo -u postgres pg_dump ngo_db > backup_before_update.sql

# 2. Pull latest code
cd /var/www/ngo-platform
git pull origin master

# 3. Update dependencies
source venv/bin/activate
pip install -r requirements.txt
npm install

# 4. Run migrations
alembic upgrade head

# 5. Rebuild frontend
npm run build

# 6. Restart services
pm2 restart ngo-backend
systemctl reload nginx

# Or use update script:
cd /root/NGO_Oct/deploy
sudo ./update_app.sh
```

---

## 🌐 DNS Configuration

### A Records (Required)
```
@ (root)     A    your-server-ip
www          A    your-server-ip
```

### Verify DNS
```bash
# Check propagation
dig your-domain.com
nslookup your-domain.com

# Should show your server IP
```

---

## 🔑 Default Credentials

After seeding database:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Admin@123 |
| NGO Admin | ngo.hope.admin@example.com | Ngo@123 |
| Donor | donor.arya@example.com | Donor@123 |
| Vendor | vendor.alpha@example.com | Vendor@123 |

**⚠️ Change these immediately in production!**

---

## 🎯 Health Checks

```bash
# Backend health
curl http://localhost:8000/healthz
# Should return: {"status":"healthy"}

# Frontend (HTTP)
curl -I http://your-domain.com
# Should return: 200 or 301

# Frontend (HTTPS)
curl -I https://your-domain.com
# Should return: 200

# Database
sudo -u postgres psql -c "SELECT version();"
```

---

## 📈 Performance Tuning

### PM2 Cluster Mode
```bash
# Edit ecosystem.config.js
instances: 4,              # Use 4 CPU cores
exec_mode: 'cluster',      # Cluster mode

# Restart
pm2 restart ngo-backend
```

### Nginx Caching
```bash
# Already configured in setup script:
# - Gzip compression enabled
# - Static file caching (1 year)
# - Browser caching headers
```

### PostgreSQL
```bash
# Edit PostgreSQL config
nano /etc/postgresql/15/main/postgresql.conf

# Increase connections (if needed)
max_connections = 200

# Restart
systemctl restart postgresql
```

---

## 🔍 Debugging

### Check All Services
```bash
pm2 status                        # Backend
systemctl status nginx            # Web server
systemctl status postgresql       # Database
ufw status                        # Firewall
certbot certificates              # SSL
```

### Network Debugging
```bash
# Check ports
netstat -tuln | grep -E ':(80|443|8000|5432)'

# Check processes
ps aux | grep -E '(nginx|postgres|node)'

# Check disk space
df -h

# Check memory
free -h
```

### Application Debugging
```bash
# Test backend directly
curl http://localhost:8000/healthz

# Test with verbose
curl -v https://your-domain.com

# Check Nginx config
nginx -t

# Validate SSL
openssl s_client -connect your-domain.com:443
```

---

## 📞 Support

### Documentation
- `DEPLOYMENT_STEPS.md` - Full guide
- `README.md` - Scripts overview
- `../DEPLOYMENT_GUIDE.md` - Detailed docs

### Logs
```bash
# View all recent logs
journalctl -xe

# Specific service
journalctl -u nginx -n 100
```

### Verification
```bash
sudo ./verify_deployment.sh your-domain.com
```

---

## ✅ Production Checklist

### Before Going Live
- [ ] SSL certificate installed
- [ ] DNS properly configured
- [ ] Firewall enabled
- [ ] Strong passwords set
- [ ] Database backed up
- [ ] All services running
- [ ] Health checks passing
- [ ] Logs rotating properly

### After Going Live
- [ ] Change default user passwords
- [ ] Configure email (SMTP)
- [ ] Setup payment gateway
- [ ] Configure file storage (S3)
- [ ] Setup monitoring
- [ ] Schedule backups
- [ ] Document custom configs
- [ ] Test all features

---

## 🚨 Emergency Commands

### Stop Everything
```bash
pm2 stop all
systemctl stop nginx
systemctl stop postgresql
```

### Restart Everything
```bash
systemctl restart postgresql
pm2 restart all
systemctl restart nginx
```

### Rollback Update
```bash
cd /var/www/ngo-platform
git reset --hard HEAD~1
sudo ./update_app.sh
```

### Restore Database
```bash
sudo -u postgres psql ngo_db < backup_file.sql
pm2 restart ngo-backend
```

---

**Keep this reference handy for quick troubleshooting!** 📌

