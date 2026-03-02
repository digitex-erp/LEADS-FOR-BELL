-- SQL Schema for Bell24h Lead Intelligence Engine - Feeder Mode
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Main Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    gst_number TEXT UNIQUE,
    industry TEXT,
    email TEXT,
    phone TEXT,
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
