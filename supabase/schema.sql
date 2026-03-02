-- SQL Schema for Bell24h Lead Intelligence Engine
-- Run this in your Supabase SQL Editor

-- Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    gst_number TEXT UNIQUE,
    industry TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    website TEXT,
    lead_score NUMERIC DEFAULT 0,
    engagement_count INTEGER DEFAULT 0,
    last_interaction TIMESTAMP WITH TIME ZONE,
    pan_number TEXT,
    main_category TEXT,
    sub_category TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'warm-lead', 'dormant-sme', 'contacted', 'qualified', 'disqualified', 'invalid_data')),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RFQs Table
CREATE TABLE IF NOT EXISTS rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    quantity TEXT,
    specifications TEXT,
    category TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    email TEXT,
    phone TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    performed_by UUID, -- Link to auth.users if needed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (Simplified for internal use - adjust as needed)
CREATE POLICY "Allow all for authenticated users" ON companies FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON rfqs FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON contacts FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON activity_logs FOR ALL USING (true);

-- RPC Functions
CREATE OR REPLACE FUNCTION increment_engagement(company_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE companies
    SET engagement_count = engagement_count + 1,
        last_interaction = NOW()
    WHERE id = company_id;
END;
$$ LANGUAGE plpgsql;
