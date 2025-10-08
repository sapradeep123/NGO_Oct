# Deployment Guide - Hybrid Localhost/Server Configuration

This guide explains how to deploy the NGO Platform to work both locally and on a server.

## 🚀 Quick Setup

### 1. Environment Configuration

Copy the environment template and configure for your environment:

```bash
# For local development
cp env.template .env

# For production server
cp env.template .env.production
```

### 2. Local Development (.env)
```bash
# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8002
VITE_FRONTEND_URL=http://localhost:5173

# Backend Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8002
FRONTEND_URL=http://localhost:5173

# Razorpay Configuration (Test)
RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET=thisisjustademokey

# Environment
NODE_ENV=development
```

### 3. Production Server (.env.production)
```bash
# Frontend Configuration
VITE_API_BASE_URL=https://your-domain.com/api
VITE_FRONTEND_URL=https://your-domain.com

# Backend Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8002
FRONTEND_URL=https://your-domain.com

# Razorpay Configuration (Live)
RAZORPAY_KEY_ID=rzp_live_your_live_key_id
RAZORPAY_KEY_SECRET=your_live_secret_key

# Environment
NODE_ENV=production
```

## 🛠️ Deployment Steps

### Frontend Deployment

1. **Build for production:**
```bash
npm run build
```

2. **Deploy to your web server:**
   - Upload the `dist/` folder to your web server
   - Configure your web server to serve the built files
   - Ensure environment variables are set correctly

### Backend Deployment

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set environment variables:**
```bash
export BACKEND_HOST=0.0.0.0
export BACKEND_PORT=8002
export FRONTEND_URL=https://your-domain.com
export RAZORPAY_KEY_ID=rzp_live_your_live_key_id
export RAZORPAY_KEY_SECRET=your_live_secret_key
```

3. **Run the backend:**
```bash
python simple_backend.py
```

Or with a process manager like PM2:
```bash
pm2 start simple_backend.py --name ngo-backend
```

## 🔧 Configuration Details

### Environment Variables

| Variable | Description | Local | Production |
|----------|-------------|-------|------------|
| `VITE_API_BASE_URL` | Frontend API endpoint | `http://localhost:8002` | `https://your-domain.com/api` |
| `VITE_FRONTEND_URL` | Frontend URL | `http://localhost:5173` | `https://your-domain.com` |
| `BACKEND_HOST` | Backend host | `0.0.0.0` | `0.0.0.0` |
| `BACKEND_PORT` | Backend port | `8002` | `8002` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` | `https://your-domain.com` |
| `RAZORPAY_KEY_ID` | Razorpay key | Test key | Live key |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | Test secret | Live secret |

### Automatic Detection

The frontend automatically detects the environment:
- **Localhost**: Uses `http://localhost:8002` for API calls
- **Server**: Uses `${window.location.protocol}//${window.location.hostname}:8002`

### CORS Configuration

The backend automatically configures CORS based on the `FRONTEND_URL` environment variable.

## 🌐 Server Configuration Examples

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Apache Configuration
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/dist
    
    # Frontend
    <Directory /path/to/dist>
        AllowOverride All
        Require all granted
    </Directory>
    
    # Backend API
    ProxyPass /api http://localhost:8002/
    ProxyPassReverse /api http://localhost:8002/
</VirtualHost>
```

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Ensure CORS is properly configured for your domain
4. **Razorpay**: Use live keys only in production
5. **Firewall**: Configure firewall to allow only necessary ports

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Check `FRONTEND_URL` environment variable
2. **API Not Found**: Verify `VITE_API_BASE_URL` is correct
3. **Port Conflicts**: Ensure ports 8002 and 5173 are available
4. **Environment Variables**: Check all required variables are set

### Debug Commands

```bash
# Check environment variables
echo $VITE_API_BASE_URL
echo $FRONTEND_URL

# Test backend
curl http://localhost:8002/healthz

# Test frontend
curl http://localhost:5173
```

## 📝 Notes

- The system automatically detects localhost vs server environment
- All hardcoded localhost references have been replaced with environment variables
- The configuration supports both development and production seamlessly
- Razorpay integration works with both test and live keys based on environment
