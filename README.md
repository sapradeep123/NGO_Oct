# NGO Donations Platform

A comprehensive platform for managing NGO donations, vendor relationships, and cause management with proper account reconciliation and reporting.

## 🚀 Features

### Core Functionality
- **Multi-Role System**: Admin, NGO, Vendor, Donor roles with specific dashboards
- **Cause Management**: Create, approve, and manage donation causes
- **NGO-Vendor Associations**: Many-to-many relationships across categories
- **Category Management**: Organized cause categorization system
- **Account Reconciliation**: Comprehensive financial tracking and reporting

### 🆕 New Interactive Features
- **NGO Microsite**: Independent, branded websites for each NGO
- **About Us Management**: NGO Admins can edit mission, vision, values, team
- **Contact Page Management**: Manage contact info, departments, office hours
- **Photo Gallery**: Upload and manage NGO photos with professional display
- **End-to-End Donations**: Complete donation workflow with transaction tracking
- **Real-time Data**: All microsite content updates from NGO Admin changes
- **Professional Design**: Clean, NGO-branded experience with smooth navigation

### Key Workflows
1. **Category Creation** → **NGO Registration** → **Vendor Association** → **Cause Creation** → **Admin Approval** → **Live Donations**
2. **Multi-Category Support**: NGOs can work with different vendors for different categories
3. **Approval Process**: All causes require admin approval before going live
4. **Financial Tracking**: Complete donation tracking and vendor payment management

## 🌐 NGO Microsite Features

### For NGO Admins
1. **Login**: Use NGO Admin credentials (e.g., `ngo.hope-trust.admin@example.com` / `Ngo@123`)
2. **Dashboard Management**:
   - **About Us Page**: Edit mission, vision, values, team members
   - **Contact Page**: Manage phone, office hours, departments, social media
   - **Photo Gallery**: Upload, view, and manage NGO photos
   - **Preview Microsite**: See how the public microsite will look

### For Public Users
1. **Access**: Visit `{FRONTEND_URL}/microsite/{ngo-slug}` (e.g., `/microsite/hope-trust`)
2. **Features**:
   - **Real Causes**: View only that NGO's causes (no other NGO data)
   - **Donation Workflow**: Complete donation process with transaction tracking
   - **Professional Design**: Clean, NGO-branded experience
   - **Smooth Navigation**: About Us, Contact, Gallery sections
   - **Responsive**: Works on all devices

### Key URLs
- **Main Platform**: `{FRONTEND_URL}`
- **Hope Trust Microsite**: `{FRONTEND_URL}/microsite/hope-trust`
- **Care Works Microsite**: `{FRONTEND_URL}/microsite/care-works`
- **Health First Microsite**: `{FRONTEND_URL}/microsite/health-first`

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **React 18** with TypeScript
- **Material-UI** for modern UI components
- **React Query** for data fetching and caching
- **React Router** for navigation
- **Axios** for API communication

### Backend (Python + FastAPI)
- **FastAPI** for high-performance API
- **Pydantic** for data validation
- **CORS** enabled for frontend communication
- **In-memory storage** for development (easily replaceable with database)

## 📁 Project Structure

```
NGO_Oct/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Main application pages
│   ├── auth/               # Authentication context
│   ├── api/                # API client and types
│   └── contexts/           # React contexts
├── app/                    # Backend application (if using full FastAPI)
├── simple_backend.py       # Development backend server
├── requirements.txt        # Python dependencies
├── package.json           # Node.js dependencies
└── README.md              # This file
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Git

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start backend server
python simple_backend.py
```

### Access Points
- **Frontend**: `{FRONTEND_URL}` (default: http://localhost:5173)
- **Backend API**: `{API_URL}` (default: http://localhost:8002)
- **API Documentation**: `{API_URL}/docs`

## 👥 User Roles & Credentials

### Admin Console
- **Email**: admin@example.com
- **Password**: Admin@123
- **Access**: Full platform management, cause approval, NGO/Vendor management

### Demo Users
- **NGO**: ngo@example.com / ngo123
- **Vendor**: vendor@example.com / vendor123
- **Donor**: donor@example.com / donor123

## 🔧 Key Features Implemented

### 1. NGO-Vendor Association System
- **Many-to-Many Relationships**: NGOs can work with multiple vendors
- **Category-Based**: Associations are specific to cause categories
- **Management Interface**: Complete CRUD operations for associations
- **API Endpoints**: Full REST API for association management

### 2. Cause Management Workflow
- **Creation**: NGOs create causes with category and vendor relationships
- **Approval**: Admin approves causes before they go live
- **Tracking**: Real-time donation tracking and progress monitoring
- **Status Management**: Draft → Pending → Live → Funded → Fulfilled

### 3. Account Reconciliation
- **Financial Summary**: Total received, disbursed, platform commission
- **Category Breakdown**: Donations and disbursements by category
- **Vendor Payments**: Track vendor invoices and payments
- **Audit Trail**: Complete transaction history

### 4. Multi-Category Support
- **Flexible Categories**: Create and manage cause categories
- **Vendor Specialization**: Vendors can specialize in specific categories
- **NGO Flexibility**: NGOs can work across multiple categories
- **Proper Relationships**: All entities properly linked and tracked

## 📊 Sample Data

The platform includes comprehensive sample data:
- **5 Categories**: Food & Nutrition, Education, Healthcare, Emergency Relief, Women & Children
- **3 NGOs**: Hope Trust, Care Works, Health First Foundation
- **3 Vendors**: Alpha Supplies, Beta Medical, Gamma Educational
- **5 Live Causes**: Across different categories with proper relationships
- **NGO-Vendor Associations**: Multi-category vendor relationships

## 🔄 API Endpoints

### Public Endpoints
- `GET /public/categories` - Get all categories
- `GET /public/ngos` - Get all NGOs
- `GET /public/causes` - Get live causes

### Admin Endpoints
- `POST /admin/categories` - Create category
- `POST /admin/ngos` - Create NGO
- `POST /admin/vendors` - Create vendor
- `POST /admin/causes` - Create cause
- `GET /admin/pending-causes` - Get pending causes
- `POST /admin/causes/{id}/approve` - Approve cause
- `GET /admin/ngo-vendor-associations` - Get associations
- `POST /admin/ngo-vendor-associations` - Create association

### Authentication
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

## 🚀 Deployment

### Development
- Frontend runs on Vite dev server (port 5173)
- Backend runs on FastAPI (port 8000)
- Hot reload enabled for both frontend and backend

### Production Ready
- Backend can be deployed with any ASGI server (uvicorn, gunicorn)
- Frontend builds to static files for any web server
- Database integration ready (currently using in-memory storage)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the GitHub Issues
2. Review the API documentation at `/docs`
3. Test with the provided sample data

---

**Built with ❤️ for NGO management and donation tracking**