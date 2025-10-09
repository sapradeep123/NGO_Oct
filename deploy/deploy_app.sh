#!/bin/bash
################################################################################
# NGO Donations Platform - Application Deployment Script
# Run this after contabo_setup.sh to deploy the application
################################################################################

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  NGO Platform - Application Deployment                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_DIR="/var/www/ngo-platform"
APP_USER="ngoapp"
REPO_URL="https://github.com/sapradeep123/NGO_Oct.git"

################################################################################
# Get Configuration from User
################################################################################
echo -e "${YELLOW}📝 Please provide the following information:${NC}"
echo ""

read -p "Enter your domain name (e.g., ngo.example.com): " DOMAIN_NAME
read -p "Enter database password (from /root/ngo_db_credentials.txt): " DB_PASSWORD
read -p "Enter JWT secret key (press Enter to generate random): " JWT_SECRET

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    echo -e "${GREEN}Generated JWT secret: $JWT_SECRET${NC}"
fi

echo ""
echo -e "${BLUE}Configuration:${NC}"
echo "  Domain: $DOMAIN_NAME"
echo "  App Directory: $APP_DIR"
echo "  Database: ngo_db"
echo ""
read -p "Continue with deployment? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

################################################################################
# Step 1: Clone Repository
################################################################################
echo ""
echo -e "${YELLOW}📥 Step 1: Cloning Repository...${NC}"

if [ -d "$APP_DIR/.git" ]; then
    echo "Repository already exists, pulling latest..."
    cd $APP_DIR
    sudo -u $APP_USER git pull origin master
else
    sudo -u $APP_USER git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

echo -e "${GREEN}✅ Repository cloned/updated${NC}"
echo ""

################################################################################
# Step 2: Setup Backend
################################################################################
echo -e "${YELLOW}🐍 Step 2: Setting up Backend...${NC}"

# Create virtual environment
sudo -u $APP_USER python3 -m venv venv

# Activate and install dependencies
sudo -u $APP_USER bash -c "source venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt"

echo -e "${GREEN}✅ Backend dependencies installed${NC}"
echo ""

################################################################################
# Step 3: Create Backend .env File
################################################################################
echo -e "${YELLOW}⚙️  Step 3: Creating Backend Environment File...${NC}"

# URL-encode the password
DB_PASSWORD_ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$DB_PASSWORD', safe=''))")

sudo -u $APP_USER cat > $APP_DIR/.env << EOF
# Production Environment Configuration
APP_ENV=prod
DEBUG=false

# Database
DATABASE_URL=postgresql://ngo_user:${DB_PASSWORD_ENCODED}@localhost:5432/ngo_db

# Security
SECRET_KEY=${JWT_SECRET}

# CORS - Update with your domain
ALLOWED_ORIGINS=https://${DOMAIN_NAME},https://www.${DOMAIN_NAME}

# External URLs
EXTERNAL_BASE_URL=https://${DOMAIN_NAME}

# Optional: Payment Gateway (configure later)
# RAZORPAY_KEY_ID=your_key_here
# RAZORPAY_KEY_SECRET=your_secret_here

# Optional: File Storage (configure later)
# S3_ENDPOINT=
# S3_BUCKET=
# S3_ACCESS_KEY=
# S3_SECRET_KEY=
EOF

chmod 600 $APP_DIR/.env
chown $APP_USER:$APP_USER $APP_DIR/.env

echo -e "${GREEN}✅ Backend .env created${NC}"
echo ""

################################################################################
# Step 4: Run Database Migrations
################################################################################
echo -e "${YELLOW}🗄️  Step 4: Running Database Migrations...${NC}"

cd $APP_DIR
sudo -u $APP_USER bash -c "source venv/bin/activate && alembic upgrade head"

echo -e "${GREEN}✅ Database migrations completed${NC}"
echo ""

################################################################################
# Step 5: Seed Database (Optional)
################################################################################
echo ""
read -p "Do you want to seed the database with demo data? (yes/no): " SEED_DB

if [ "$SEED_DB" = "yes" ]; then
    echo -e "${YELLOW}🌱 Seeding database...${NC}"
    sudo -u $APP_USER bash -c "source venv/bin/activate && python seed.py"
    echo -e "${GREEN}✅ Database seeded${NC}"
fi
echo ""

################################################################################
# Step 6: Setup Frontend
################################################################################
echo -e "${YELLOW}📗 Step 6: Setting up Frontend...${NC}"

# Install npm dependencies
cd $APP_DIR
sudo -u $APP_USER npm install

# Create frontend .env for build
sudo -u $APP_USER cat > $APP_DIR/.env.local << EOF
VITE_API_BASE_URL=https://${DOMAIN_NAME}
EOF

# Build frontend
sudo -u $APP_USER npm run build

echo -e "${GREEN}✅ Frontend built successfully${NC}"
echo ""

################################################################################
# Step 7: Setup PM2 for Backend
################################################################################
echo -e "${YELLOW}⚙️  Step 7: Setting up PM2 for Backend...${NC}"

# Create PM2 ecosystem file
cat > $APP_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ngo-backend',
    script: 'venv/bin/uvicorn',
    args: 'app.main:app --host 0.0.0.0 --port 8000',
    cwd: '/var/www/ngo-platform',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/log/ngo-backend-error.log',
    out_file: '/var/log/ngo-backend-out.log',
    log_file: '/var/log/ngo-backend-combined.log',
    time: true
  }]
};
EOF

chown $APP_USER:$APP_USER $APP_DIR/ecosystem.config.js

# Start application with PM2
cd $APP_DIR
sudo -u $APP_USER pm2 start ecosystem.config.js
sudo -u $APP_USER pm2 save

# Setup PM2 startup
env PATH=$PATH:/usr/bin pm2 startup systemd -u $APP_USER --hp /home/$APP_USER

echo -e "${GREEN}✅ PM2 configured and backend started${NC}"
echo ""

################################################################################
# Step 8: Configure Nginx
################################################################################
echo -e "${YELLOW}🌐 Step 8: Configuring Nginx...${NC}"

cat > /etc/nginx/sites-available/ngo-platform << EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};

    # Frontend - Serve static files
    root /var/www/ngo-platform/dist;
    index index.html;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
    gzip_disable "MSIE [1-6]\.";

    # Frontend routes
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static assets cache
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Hide nginx version
    server_tokens off;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/ngo-platform /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx

echo -e "${GREEN}✅ Nginx configured${NC}"
echo ""

################################################################################
# Step 9: Setup Log Rotation
################################################################################
echo -e "${YELLOW}📝 Step 9: Setting up Log Rotation...${NC}"

cat > /etc/logrotate.d/ngo-platform << EOF
/var/log/ngo-backend-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $APP_USER $APP_USER
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

echo -e "${GREEN}✅ Log rotation configured${NC}"
echo ""

################################################################################
# Summary
################################################################################
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✅ Application Deployment Complete!                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Deployment Summary:${NC}"
echo "  ✅ Repository cloned/updated"
echo "  ✅ Backend dependencies installed"
echo "  ✅ Database migrated"
echo "  ✅ Frontend built"
echo "  ✅ PM2 configured"
echo "  ✅ Nginx configured"
echo "  ✅ Log rotation setup"
echo ""
echo -e "${YELLOW}Application Status:${NC}"
echo "  Backend: Running on port 8000 (via PM2)"
echo "  Frontend: Served by Nginx"
echo "  Domain: http://${DOMAIN_NAME}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Point your domain DNS to this server's IP"
echo "  2. Wait for DNS propagation (5-30 minutes)"
echo "  3. Run SSL setup: ./setup_ssl.sh ${DOMAIN_NAME}"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "  • Check backend status: pm2 status"
echo "  • View backend logs: pm2 logs ngo-backend"
echo "  • Restart backend: pm2 restart ngo-backend"
echo "  • Check nginx status: systemctl status nginx"
echo "  • Test nginx config: nginx -t"
echo ""
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}Test your application at: http://${DOMAIN_NAME}${NC}"

