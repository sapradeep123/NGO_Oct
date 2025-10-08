@echo off
REM Environment Setup Script for NGO Platform (Windows)

echo 🚀 Setting up environment for NGO Platform...

REM Check if .env already exists
if exist ".env" (
    echo ⚠️  .env file already exists. Creating backup...
    copy .env .env.backup
)

REM Create .env file for local development
echo 📝 Creating .env file for local development...
(
echo # Environment Configuration for NGO Platform
echo # Local Development Configuration
echo.
echo # Frontend Configuration
echo VITE_API_BASE_URL=http://localhost:8002
echo VITE_FRONTEND_URL=http://localhost:5173
echo.
echo # Backend Configuration
echo BACKEND_HOST=0.0.0.0
echo BACKEND_PORT=8002
echo FRONTEND_URL=http://localhost:5173
echo.
echo # Database Configuration ^(if using database^)
echo DATABASE_URL=postgresql+psycopg://ngo_user:ngo_pass@localhost:5432/ngo_db
echo.
echo # Email Configuration
echo SMTP_HOST=localhost
echo SMTP_PORT=587
echo SMTP_USER=
echo SMTP_PASSWORD=
echo.
echo # Razorpay Configuration ^(Test Keys^)
echo RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
echo RAZORPAY_KEY_SECRET=thisisjustademokey
echo.
echo # Environment
echo NODE_ENV=development
) > .env

echo ✅ .env file created successfully!
echo.
echo 🔧 To use this configuration:
echo    1. For local development: Use the current .env file
echo    2. For production: Modify the URLs in .env to your domain
echo.
echo 📋 Current configuration:
echo    - Frontend: http://localhost:5173
echo    - Backend API: http://localhost:8002
echo    - Razorpay: Test mode
echo.
echo 🌐 To deploy to server:
echo    1. Update VITE_API_BASE_URL to your server URL
echo    2. Update VITE_FRONTEND_URL to your domain
echo    3. Update FRONTEND_URL to your domain
echo    4. Update Razorpay keys to live keys
echo.
echo 🎉 Setup complete! You can now run:
echo    - Backend: python simple_backend.py
echo    - Frontend: npm run dev
pause
