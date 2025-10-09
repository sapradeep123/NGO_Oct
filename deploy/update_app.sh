#!/bin/bash
################################################################################
# NGO Donations Platform - Update/Redeploy Script
# Use this to pull latest code and redeploy
################################################################################

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  NGO Platform - Update Application                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

APP_DIR="/var/www/ngo-platform"
APP_USER="ngoapp"

echo -e "${YELLOW}📥 Step 1: Pulling Latest Code...${NC}"
cd $APP_DIR
sudo -u $APP_USER git pull origin master
echo -e "${GREEN}✅ Code updated${NC}"
echo ""

echo -e "${YELLOW}🐍 Step 2: Updating Backend Dependencies...${NC}"
sudo -u $APP_USER bash -c "source venv/bin/activate && pip install --upgrade -r requirements.txt"
echo -e "${GREEN}✅ Backend dependencies updated${NC}"
echo ""

echo -e "${YELLOW}🗄️  Step 3: Running Database Migrations...${NC}"
sudo -u $APP_USER bash -c "source venv/bin/activate && alembic upgrade head"
echo -e "${GREEN}✅ Migrations completed${NC}"
echo ""

echo -e "${YELLOW}📗 Step 4: Updating Frontend...${NC}"
sudo -u $APP_USER npm install
sudo -u $APP_USER npm run build
echo -e "${GREEN}✅ Frontend rebuilt${NC}"
echo ""

echo -e "${YELLOW}⚙️  Step 5: Restarting Backend...${NC}"
sudo -u $APP_USER pm2 restart ngo-backend
echo -e "${GREEN}✅ Backend restarted${NC}"
echo ""

echo -e "${YELLOW}🌐 Step 6: Reloading Nginx...${NC}"
nginx -t && systemctl reload nginx
echo -e "${GREEN}✅ Nginx reloaded${NC}"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✅ Update Complete!                                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Application updated successfully!${NC}"
echo ""
echo -e "${YELLOW}Check status:${NC}"
echo "  pm2 status"
echo "  pm2 logs ngo-backend"

