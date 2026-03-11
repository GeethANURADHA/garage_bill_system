-- Comprehensive Schema for Garage Pro

-- 1. Vehicles Table (Updated with Insurance)
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_number TEXT NOT NULL UNIQUE,
    owner_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    vehicle_type TEXT, -- Car, Van, Bike, Lorry
    brand TEXT,
    model TEXT,
    notes TEXT,
    
    -- Insurance Tracking
    ins_company TEXT,
    ins_policy_number TEXT,
    ins_expiry_date DATE,
    ins_type TEXT, -- Full / Third-party
    ins_contact_person TEXT,
    ins_contact_number TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Services Table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    services_done TEXT,
    parts_replaced TEXT,
    parts_cost DECIMAL(10, 2) DEFAULT 0.00,
    labour_cost DECIMAL(10, 2) DEFAULT 0.00,
    total_cost DECIMAL(10, 2) GENERATED ALWAYS AS (parts_cost + labour_cost) STORED,
    notes TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insurance Claims Table
CREATE TABLE IF NOT EXISTS insurance_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    claim_number TEXT NOT NULL,
    claim_amount DECIMAL(10, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'Pending',
    notes TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL,
    items JSONB, -- Array of {description, amount}
    pdf_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Management
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
