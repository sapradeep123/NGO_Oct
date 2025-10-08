#!/bin/bash
# Environment Setup Script for NGO Platform

echo "🚀 Setting up environment for NGO Platform..."

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Creating backup..."
    cp .env .env.backup
fi

# Create .env file for local development
echo "📝 Creating .env file for local development..."
cat > .env << 'EOF'
# Environment Configuration for NGO Platform
# Local Development Configuration

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8002
VITE_FRONTEND_URL=http://localhost:5173

# Backend Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8002
FRONTEND_URL=http://localhost:5173

# Database Configuration (if using database)
DATABASE_URL=postgresql+psycopg://ngo_user:ngo_pass@localhost:5432/ngo_db

# Email Configuration
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# Razorpay Configuration (Test Keys)
RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET=thisisjustademokey

# Environment
NODE_ENV=development
EOF

echo "✅ .env file created successfully!"
echo ""
echo "🔧 To use this configuration:"
echo "   1. For local development: Use the current .env file"
echo "   2. For production: Modify the URLs in .env to your domain"
echo ""
echo "📋 Current configuration:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend API: http://localhost:8002"
echo "   - Razorpay: Test mode"
echo ""
echo "🌐 To deploy to server:"
echo "   1. Update VITE_API_BASE_URL to your server URL"
echo "   2. Update VITE_FRONTEND_URL to your domain"
echo "   3. Update FRONTEND_URL to your domain"
echo "   4. Update Razorpay keys to live keys"
echo ""
echo "🎉 Setup complete! You can now run:"
echo "   - Backend: python simple_backend.py"
echo "   - Frontend: npm run dev"
