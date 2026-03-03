-- SQL Schema for Bell24h Lead Intelligence Engine - Feeder Mode
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Main Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    gst_number TEXT UNIQUE,
    industry TEXT,
    email TEXT,
    mobile TEXT,
    website TEXT,
    city TEXT,
    state TEXT,
    lead_score NUMERIC DEFAULT 0,
    main_category TEXT,
    sub_category TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'warm-lead', 'dormant-sme', 'contacted', 'qualified', 'disqualified', 'invalid_data')),
    is_approved BOOLEAN DEFAULT false,
    approved_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    engagement_count INTEGER DEFAULT 0,
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RFQs Table
CREATE TABLE IF NOT EXISTS rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    quantity TEXT,
    specifications TEXT,
    category TEXT,
    company_id UUID REFERENCES companies(id),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Contacts Table (User hinted at this in hardening)
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    name TEXT NOT NULL,
    role TEXT,
    email TEXT,
    mobile TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Subcategories Table
CREATE TABLE IF NOT EXISTS subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, name)
);

-- --- Views (Security Invoker) ---

-- ... (keep existing views)

CREATE OR REPLACE VIEW category_market_map
WITH (security_invoker = true) AS
SELECT 
    c.name as category_name,
    c.icon as category_icon,
    count(comp.id) as lead_count,
    avg(comp.lead_score) as avg_score
FROM categories c
LEFT JOIN companies comp ON comp.main_category = c.name
GROUP BY c.name, c.icon;

-- --- RLS Hardening ---

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Categories: Public Read, Authenticated Write
CREATE POLICY "Public Read for Categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Auth Write for Categories" ON categories FOR ALL USING (auth.role() = 'authenticated');

-- Subcategories: Public Read, Authenticated Write
CREATE POLICY "Public Read for Subcategories" ON subcategories FOR SELECT USING (true);
CREATE POLICY "Auth Write for Subcategories" ON subcategories FOR ALL USING (auth.role() = 'authenticated');
