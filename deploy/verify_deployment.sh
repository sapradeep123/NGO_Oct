#!/bin/bash
################################################################################
# NGO Donations Platform - Deployment Verification Script
# Run this to verify everything is working correctly
################################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  NGO Platform - Deployment Verification                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Get domain
if [ -z "$1" ]; then
    read -p "Enter your domain name: " DOMAIN
else
    DOMAIN=$1
fi

PASSED=0
FAILED=0

################################################################################
# Test Function
################################################################################
test_check() {
    local test_name=$1
    local command=$2
    
    echo -n "Testing $test_name... "
    
    if eval $command > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAILED++))
    fi
}

################################################################################
# System Checks
################################################################################
echo -e "${BLUE}🔍 System Checks${NC}"
echo "─────────────────────────────────────────────────────────────────"

test_check "Python 3.11" "python3 --version | grep -q '3.11'"
test_check "Node.js" "node --version | grep -q 'v18'"
test_check "PostgreSQL" "systemctl is-active --quiet postgresql"
test_check "Nginx" "systemctl is-active --quiet nginx"
test_check "PM2" "which pm2"

echo ""

################################################################################
# Application Checks
################################################################################
echo -e "${BLUE}📦 Application Checks${NC}"
echo "─────────────────────────────────────────────────────────────────"

test_check "App directory exists" "[ -d /var/www/ngo-platform ]"
test_check "Virtual environment" "[ -d /var/www/ngo-platform/venv ]"
test_check "Backend .env file" "[ -f /var/www/ngo-platform/.env ]"
test_check "Frontend build" "[ -d /var/www/ngo-platform/dist ]"
test_check "Frontend index.html" "[ -f /var/www/ngo-platform/dist/index.html ]"

echo ""

################################################################################
# Service Checks
################################################################################
echo -e "${BLUE}⚙️  Service Checks${NC}"
echo "─────────────────────────────────────────────────────────────────"

test_check "Backend PM2 process" "pm2 list | grep -q ngo-backend"
test_check "Backend listening on 8000" "netstat -tuln | grep -q ':8000'"
test_check "PostgreSQL listening" "netstat -tuln | grep -q ':5432'"
test_check "Nginx listening on 80" "netstat -tuln | grep -q ':80'"
test_check "Nginx listening on 443" "netstat -tuln | grep -q ':443'"

echo ""

################################################################################
# Database Checks
################################################################################
echo -e "${BLUE}🗄️  Database Checks${NC}"
echo "─────────────────────────────────────────────────────────────────"

test_check "Database exists" "sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw ngo_db"
test_check "Database user exists" "sudo -u postgres psql -c '\du' | grep -q ngo_user"

# Check table count
TABLE_COUNT=$(sudo -u postgres psql -d ngo_db -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
if [ "$TABLE_COUNT" -gt 0 ]; then
    echo -e "Testing Database tables... ${GREEN}✅ PASS${NC} ($TABLE_COUNT tables)"
    ((PASSED++))
else
    echo -e "Testing Database tables... ${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

echo ""

################################################################################
# SSL/HTTPS Checks (if domain provided)
################################################################################
if [ ! -z "$DOMAIN" ]; then
    echo -e "${BLUE}🔒 SSL/HTTPS Checks${NC}"
    echo "─────────────────────────────────────────────────────────────────"
    
    test_check "SSL certificate" "[ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]"
    test_check "SSL private key" "[ -f /etc/letsencrypt/live/$DOMAIN/privkey.pem ]"
    
    echo ""
fi

################################################################################
# HTTP Endpoint Checks
################################################################################
if [ ! -z "$DOMAIN" ]; then
    echo -e "${BLUE}🌐 HTTP Endpoint Checks${NC}"
    echo "─────────────────────────────────────────────────────────────────"
    
    # Test backend health
    echo -n "Testing Backend health endpoint... "
    HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/healthz)
    if [ "$HEALTH_CHECK" = "200" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $HEALTH_CHECK)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $HEALTH_CHECK)"
        ((FAILED++))
    fi
    
    # Test frontend (HTTP)
    echo -n "Testing Frontend HTTP... "
    FRONTEND_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN)
    if [ "$FRONTEND_HTTP" = "200" ] || [ "$FRONTEND_HTTP" = "301" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $FRONTEND_HTTP)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $FRONTEND_HTTP)"
        ((FAILED++))
    fi
    
    # Test frontend (HTTPS if SSL is setup)
    if [ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
        echo -n "Testing Frontend HTTPS... "
        FRONTEND_HTTPS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN)
        if [ "$FRONTEND_HTTPS" = "200" ]; then
            echo -e "${GREEN}✅ PASS${NC} (HTTP $FRONTEND_HTTPS)"
            ((PASSED++))
        else
            echo -e "${RED}❌ FAIL${NC} (HTTP $FRONTEND_HTTPS)"
            ((FAILED++))
        fi
    fi
    
    echo ""
fi

################################################################################
# Firewall Checks
################################################################################
echo -e "${BLUE}🛡️  Firewall Checks${NC}"
echo "─────────────────────────────────────────────────────────────────"

test_check "UFW active" "ufw status | grep -q 'Status: active'"
test_check "Port 80 allowed" "ufw status | grep -q '80/tcp.*ALLOW'"
test_check "Port 443 allowed" "ufw status | grep -q '443/tcp.*ALLOW'"

echo ""

################################################################################
# Log Checks
################################################################################
echo -e "${BLUE}📝 Log File Checks${NC}"
echo "─────────────────────────────────────────────────────────────────"

test_check "Backend error log exists" "[ -f /var/log/ngo-backend-error.log ]"
test_check "Backend out log exists" "[ -f /var/log/ngo-backend-out.log ]"
test_check "Nginx access log" "[ -f /var/log/nginx/access.log ]"
test_check "Nginx error log" "[ -f /var/log/nginx/error.log ]"

echo ""

################################################################################
# Summary
################################################################################
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Verification Summary                                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $TOTAL"
echo ""
echo -e "Success Rate: ${BLUE}$PERCENTAGE%${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ ALL CHECKS PASSED - DEPLOYMENT SUCCESSFUL! 🎉             ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    if [ ! -z "$DOMAIN" ]; then
        if [ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
            echo -e "${YELLOW}🌐 Your application is live at:${NC}"
            echo -e "${GREEN}   https://$DOMAIN${NC}"
        else
            echo -e "${YELLOW}🌐 Your application is live at:${NC}"
            echo -e "${GREEN}   http://$DOMAIN${NC}"
            echo ""
            echo -e "${YELLOW}⚠️  Run ./setup_ssl.sh $DOMAIN to enable HTTPS${NC}"
        fi
    fi
    echo ""
    echo -e "${YELLOW}📊 Useful Commands:${NC}"
    echo "   • View backend logs: pm2 logs ngo-backend"
    echo "   • Check backend status: pm2 status"
    echo "   • Restart backend: pm2 restart ngo-backend"
    echo "   • View nginx logs: tail -f /var/log/nginx/access.log"
    echo "   • Test nginx config: nginx -t"
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ SOME CHECKS FAILED - REVIEW ERRORS ABOVE                   ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Common Issues:${NC}"
    echo "  • Backend not running: pm2 restart ngo-backend"
    echo "  • Nginx errors: nginx -t"
    echo "  • Database issues: systemctl status postgresql"
    echo "  • Check logs: pm2 logs ngo-backend"
    echo ""
    exit 1
fi

