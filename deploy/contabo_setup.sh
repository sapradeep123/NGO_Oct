#!/bin/bash
################################################################################
# NGO Donations Platform - Contabo Server Setup Script
# This script sets up everything needed on a fresh Contabo Ubuntu server
################################################################################

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  NGO Platform - Contabo Server Setup                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Running as root${NC}"
echo ""

################################################################################
# Step 1: System Update
################################################################################
echo -e "${YELLOW}📦 Step 1: Updating System...${NC}"
apt update && apt upgrade -y
echo -e "${GREEN}✅ System updated${NC}"
echo ""

################################################################################
# Step 2: Install Essential Tools
################################################################################
echo -e "${YELLOW}🔧 Step 2: Installing Essential Tools...${NC}"
apt install -y curl wget git vim nano unzip software-properties-common \
    build-essential ufw fail2ban
echo -e "${GREEN}✅ Essential tools installed${NC}"
echo ""

################################################################################
# Step 3: Install Python 3.11
################################################################################
echo -e "${YELLOW}🐍 Step 3: Installing Python 3.11...${NC}"
add-apt-repository ppa:deadsnakes/ppa -y
apt update
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
echo -e "${GREEN}✅ Python 3.11 installed${NC}"
python3 --version
echo ""

################################################################################
# Step 4: Install Node.js 18
################################################################################
echo -e "${YELLOW}📗 Step 4: Installing Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
echo -e "${GREEN}✅ Node.js installed${NC}"
node --version
npm --version
echo ""

################################################################################
# Step 5: Install PostgreSQL 15
################################################################################
echo -e "${YELLOW}🐘 Step 5: Installing PostgreSQL 15...${NC}"
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt update
apt install -y postgresql-15 postgresql-contrib-15
systemctl enable postgresql
systemctl start postgresql
echo -e "${GREEN}✅ PostgreSQL 15 installed${NC}"
echo ""

################################################################################
# Step 6: Install Nginx
################################################################################
echo -e "${YELLOW}🌐 Step 6: Installing Nginx...${NC}"
apt install -y nginx
systemctl enable nginx
systemctl start nginx
echo -e "${GREEN}✅ Nginx installed${NC}"
echo ""

################################################################################
# Step 7: Install Certbot (for SSL)
################################################################################
echo -e "${YELLOW}🔒 Step 7: Installing Certbot for SSL...${NC}"
apt install -y certbot python3-certbot-nginx
echo -e "${GREEN}✅ Certbot installed${NC}"
echo ""

################################################################################
# Step 8: Install PM2 (Process Manager)
################################################################################
echo -e "${YELLOW}⚙️  Step 8: Installing PM2...${NC}"
npm install -g pm2
pm2 startup systemd -u root --hp /root
echo -e "${GREEN}✅ PM2 installed${NC}"
echo ""

################################################################################
# Step 9: Configure Firewall
################################################################################
echo -e "${YELLOW}🛡️  Step 9: Configuring Firewall...${NC}"
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 5432/tcp  # PostgreSQL (optional, for remote access)
ufw status
echo -e "${GREEN}✅ Firewall configured${NC}"
echo ""

################################################################################
# Step 10: Create Application User
################################################################################
echo -e "${YELLOW}👤 Step 10: Creating Application User...${NC}"
if id "ngoapp" &>/dev/null; then
    echo "User ngoapp already exists"
else
    useradd -m -s /bin/bash ngoapp
    usermod -aG sudo ngoapp
    echo -e "${GREEN}✅ User ngoapp created${NC}"
fi
echo ""

################################################################################
# Step 11: Setup Application Directory
################################################################################
echo -e "${YELLOW}📁 Step 11: Setting up Application Directory...${NC}"
mkdir -p /var/www/ngo-platform
chown -R ngoapp:ngoapp /var/www/ngo-platform
echo -e "${GREEN}✅ Application directory created: /var/www/ngo-platform${NC}"
echo ""

################################################################################
# Step 12: Configure PostgreSQL
################################################################################
echo -e "${YELLOW}🗄️  Step 12: Configuring PostgreSQL...${NC}"

# Generate a random password
PG_PASSWORD=$(openssl rand -base64 32)

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE ngo_db;
CREATE USER ngo_user WITH ENCRYPTED PASSWORD '$PG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE ngo_db TO ngo_user;
ALTER DATABASE ngo_db OWNER TO ngo_user;
\q
EOF

echo -e "${GREEN}✅ PostgreSQL configured${NC}"
echo ""
echo -e "${YELLOW}📝 Database Credentials:${NC}"
echo "   Database: ngo_db"
echo "   User: ngo_user"
echo "   Password: $PG_PASSWORD"
echo ""
echo -e "${RED}⚠️  SAVE THIS PASSWORD! Writing to /root/ngo_db_credentials.txt${NC}"
cat > /root/ngo_db_credentials.txt << EOF
Database Credentials
====================
Database: ngo_db
User: ngo_user
Password: $PG_PASSWORD
Connection String: postgresql://ngo_user:$PG_PASSWORD@localhost:5432/ngo_db
EOF
chmod 600 /root/ngo_db_credentials.txt
echo ""

################################################################################
# Summary
################################################################################
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✅ Server Setup Complete!                                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Installed Components:${NC}"
echo "  ✅ Ubuntu system updated"
echo "  ✅ Python 3.11"
echo "  ✅ Node.js 18"
echo "  ✅ PostgreSQL 15"
echo "  ✅ Nginx"
echo "  ✅ Certbot (SSL)"
echo "  ✅ PM2 (Process Manager)"
echo "  ✅ Firewall configured"
echo "  ✅ Application user created"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Run deployment script: ./deploy_app.sh"
echo "  2. Configure your domain DNS to point to this server"
echo "  3. Run SSL setup: ./setup_ssl.sh yourdomain.com"
echo ""
echo -e "${YELLOW}Important Files:${NC}"
echo "  • Database credentials: /root/ngo_db_credentials.txt"
echo "  • Application directory: /var/www/ngo-platform"
echo ""
echo -e "${GREEN}Setup completed successfully!${NC}"

