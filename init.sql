-- Create database schema for NGO Donations Platform

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NGOs/Tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    logo_url VARCHAR(500),
    contact_email VARCHAR(200),
    website_url VARCHAR(200),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    gstin VARCHAR(15) UNIQUE,
    contact_email VARCHAR(200),
    phone VARCHAR(20),
    address TEXT,
    kyc_status VARCHAR(20) DEFAULT 'PENDING',
    tenant_id INTEGER REFERENCES tenants(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Causes table
CREATE TABLE IF NOT EXISTS causes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING_APPROVAL',
    category_id INTEGER REFERENCES categories(id),
    tenant_id INTEGER REFERENCES tenants(id),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(200) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'DONOR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(15,2) NOT NULL,
    cause_id INTEGER REFERENCES causes(id),
    donor_id INTEGER REFERENCES users(id),
    payment_method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO categories (name, description) VALUES
('Food & Nutrition', 'Providing meals and nutritional support to those in need'),
('Education', 'Supporting educational programs and school infrastructure'),
('Healthcare', 'Medical care, medicines, and health awareness programs'),
('Emergency Relief', 'Disaster response and emergency assistance'),
('Women & Children', 'Programs supporting women and children welfare')
ON CONFLICT (name) DO NOTHING;

INSERT INTO tenants (name, slug, description, logo_url, contact_email, website_url, status, verified) VALUES
('Hope Trust', 'hope-trust', 'Dedicated to providing hope and support to communities in need', 'https://via.placeholder.com/200x200/2563EB/FFFFFF?text=Hope+Trust', 'contact@hopetrust.org', 'https://hopetrust.org', 'ACTIVE', TRUE),
('Care Works', 'care-works', 'Working together to create positive change in communities', 'https://via.placeholder.com/200x200/059669/FFFFFF?text=Care+Works', 'info@careworks.org', 'https://careworks.org', 'ACTIVE', TRUE),
('Health First Foundation', 'health-first', 'Promoting healthcare access and medical support', 'https://via.placeholder.com/200x200/DC2626/FFFFFF?text=Health+First', 'contact@healthfirst.org', 'https://healthfirst.org', 'ACTIVE', TRUE)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO vendors (name, gstin, contact_email, phone, address, kyc_status, tenant_id) VALUES
('Alpha Supplies', '29ABCDE1234F1Z5', 'contact@alphasupplies.com', '+91-9876543210', '123 Business Park, Mumbai, Maharashtra', 'VERIFIED', 1),
('Beta Medical', '29FGHIJ5678K2L6', 'info@betamedical.com', '+91-9876543211', '456 Medical Complex, Delhi, Delhi', 'PENDING', 2),
('Gamma Educational', '29MNOPQ9012R3S7', 'sales@gammaedu.com', '+91-9876543212', '789 Education Hub, Bangalore, Karnataka', 'VERIFIED', 3)
ON CONFLICT (gstin) DO NOTHING;

INSERT INTO causes (title, description, target_amount, current_amount, status, category_id, tenant_id, image_url) VALUES
('Daily Meals for Children', 'Providing nutritious meals to 500 children daily in rural schools', 150000, 75000, 'LIVE', 1, 1, 'https://via.placeholder.com/400x300/2563EB/FFFFFF?text=Daily+Meals'),
('School Infrastructure Development', 'Building new classrooms and library for underprivileged students', 300000, 180000, 'LIVE', 2, 2, 'https://via.placeholder.com/400x300/059669/FFFFFF?text=School+Infrastructure'),
('Mobile Health Clinic', 'Providing free medical checkups and medicines in remote villages', 200000, 120000, 'LIVE', 3, 3, 'https://via.placeholder.com/400x300/DC2626/FFFFFF?text=Mobile+Clinic'),
('Flood Relief Fund', 'Emergency assistance for families affected by recent floods', 250000, 95000, 'LIVE', 4, 1, 'https://via.placeholder.com/400x300/7C3AED/FFFFFF?text=Flood+Relief'),
('Women Empowerment Program', 'Skill development and microfinance support for women entrepreneurs', 180000, 65000, 'LIVE', 5, 2, 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Women+Empowerment')
ON CONFLICT DO NOTHING;

INSERT INTO users (email, first_name, last_name, role) VALUES
('admin@example.com', 'Admin', 'User', 'PLATFORM_ADMIN'),
('ngo.hope.admin@example.com', 'Hope', 'Admin', 'NGO_ADMIN'),
('ngo.hope.staff@example.com', 'Hope', 'Staff', 'NGO_STAFF'),
('vendor.alpha@example.com', 'Alpha', 'Vendor', 'VENDOR'),
('donor.arya@example.com', 'Arya', 'Donor', 'DONOR')
ON CONFLICT (email) DO NOTHING;
