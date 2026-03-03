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

-- --- Views (Security Invoker) ---

CREATE OR REPLACE VIEW verified_marketplace_leads 
WITH (security_invoker = true) AS
SELECT name, gst_number, email, mobile, industry, approved_at, main_category, sub_category, lead_score
FROM companies
WHERE is_approved = true;

CREATE OR REPLACE VIEW category_stats 
WITH (security_invoker = true) AS
SELECT main_category, count(*) as total_leads, avg(lead_score) as avg_score
FROM companies
GROUP BY main_category;

CREATE OR REPLACE VIEW category_liquidity 
WITH (security_invoker = true) AS
SELECT main_category, count(*) filter (where status = 'qualified') as qualified_leads
FROM companies
GROUP BY main_category;

-- --- Functions (search_path set to public) ---

CREATE OR REPLACE FUNCTION increment_engagement(company_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE companies
    SET engagement_count = engagement_count + 1,
        last_interaction = NOW()
    WHERE id = company_id;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION handle_engagement_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_interaction = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- --- RLS Hardening ---

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Companies: Public Read, Authenticated Write
CREATE POLICY "Public Read for Companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Auth Write for Companies" ON companies 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Update for Companies" ON companies 
FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Delete for Companies" ON companies 
FOR DELETE USING (auth.role() = 'authenticated');

-- Contacts: Public Read, Authenticated Write
CREATE POLICY "Public Read for Contacts" ON contacts FOR SELECT USING (true);
CREATE POLICY "Auth Write for Contacts" ON contacts 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth Update for Contacts" ON contacts 
FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Delete for Contacts" ON contacts 
FOR DELETE USING (auth.role() = 'authenticated');
