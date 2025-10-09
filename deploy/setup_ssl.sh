#!/bin/bash
################################################################################
# NGO Donations Platform - SSL Setup Script
# Run this after deploy_app.sh and DNS is configured
################################################################################

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  NGO Platform - SSL/HTTPS Setup                               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Get domain from argument or ask user
if [ -z "$1" ]; then
    read -p "Enter your domain name: " DOMAIN
else
    DOMAIN=$1
fi

echo ""
echo -e "${YELLOW}Domain: $DOMAIN${NC}"
echo ""

################################################################################
# Step 1: Verify DNS
################################################################################
echo -e "${YELLOW}🔍 Step 1: Verifying DNS...${NC}"

SERVER_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short $DOMAIN | tail -1)

echo "Server IP: $SERVER_IP"
echo "Domain IP: $DOMAIN_IP"

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    echo -e "${RED}⚠️  Warning: DNS not properly configured!${NC}"
    echo "Your domain does not point to this server."
    echo ""
    read -p "Continue anyway? (yes/no): " CONTINUE
    if [ "$CONTINUE" != "yes" ]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ DNS properly configured${NC}"
fi
echo ""

################################################################################
# Step 2: Get Email for Let's Encrypt
################################################################################
read -p "Enter your email for SSL certificate notifications: " EMAIL
echo ""

################################################################################
# Step 3: Obtain SSL Certificate
################################################################################
echo -e "${YELLOW}🔒 Step 3: Obtaining SSL Certificate...${NC}"

# Stop nginx temporarily
systemctl stop nginx

# Obtain certificate
certbot certonly --standalone \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --non-interactive \
    --redirect

# Start nginx
systemctl start nginx

echo -e "${GREEN}✅ SSL certificate obtained${NC}"
echo ""

################################################################################
# Step 4: Update Nginx Configuration for HTTPS
################################################################################
echo -e "${YELLOW}🌐 Step 4: Updating Nginx Configuration...${NC}"

cat > /etc/nginx/sites-available/ngo-platform << EOF
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    return 301 https://\$host\$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS (Optional but recommended)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

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
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Hide nginx version
    server_tokens off;

    # Additional security
    client_max_body_size 10M;
}
EOF

# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx

echo -e "${GREEN}✅ Nginx configured for HTTPS${NC}"
echo ""

################################################################################
# Step 5: Setup Auto-Renewal
################################################################################
echo -e "${YELLOW}🔄 Step 5: Setting up Auto-Renewal...${NC}"

# Create renewal hook
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh << 'EOF'
#!/bin/bash
systemctl reload nginx
EOF

chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

# Test renewal
certbot renew --dry-run

echo -e "${GREEN}✅ Auto-renewal configured${NC}"
echo ""

################################################################################
# Step 6: Update Backend .env
################################################################################
echo -e "${YELLOW}⚙️  Step 6: Updating Backend Configuration...${NC}"

APP_DIR="/var/www/ngo-platform"

# Update EXTERNAL_BASE_URL and ALLOWED_ORIGINS to use HTTPS
sed -i "s|http://|https://|g" $APP_DIR/.env
sed -i "s|EXTERNAL_BASE_URL=.*|EXTERNAL_BASE_URL=https://${DOMAIN}|" $APP_DIR/.env
sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://${DOMAIN},https://www.${DOMAIN}|" $APP_DIR/.env

# Restart backend
sudo -u ngoapp pm2 restart ngo-backend

echo -e "${GREEN}✅ Backend updated for HTTPS${NC}"
echo ""

################################################################################
# Summary
################################################################################
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✅ SSL Setup Complete!                                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}SSL Configuration:${NC}"
echo "  ✅ SSL certificate obtained"
echo "  ✅ Nginx configured for HTTPS"
echo "  ✅ HTTP to HTTPS redirect enabled"
echo "  ✅ Auto-renewal configured"
echo "  ✅ Backend updated"
echo ""
echo -e "${YELLOW}Certificate Details:${NC}"
echo "  Domain: $DOMAIN"
echo "  Email: $EMAIL"
echo "  Valid for: 90 days (auto-renews)"
echo ""
echo -e "${YELLOW}Security Features Enabled:${NC}"
echo "  ✅ TLS 1.2 and 1.3"
echo "  ✅ HSTS (HTTP Strict Transport Security)"
echo "  ✅ Security headers"
echo "  ✅ Strong ciphers"
echo ""
echo -e "${GREEN}Your application is now live at:${NC}"
echo -e "${YELLOW}  https://${DOMAIN}${NC}"
echo ""
echo -e "${YELLOW}SSL Certificate Renewal:${NC}"
echo "  • Automatic renewal configured"
echo "  • Check renewal: certbot renew --dry-run"
echo "  • Manual renewal: certbot renew"
echo ""
echo -e "${GREEN}Setup completed successfully!${NC}"

