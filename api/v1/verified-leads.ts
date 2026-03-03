import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const internalFeedKey = process.env.INTERNAL_FEED_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: any, res: any) {
  // 1. Security Gate
  const authHeader = req.headers['x-bell24h-auth'];
  
  if (!internalFeedKey || authHeader !== internalFeedKey) {
    console.error("❌ Unauthorized Handshake Attempt");
    return res.status(401).json({ error: "Unauthorized. Secure x-bell24h-auth required." });
  }

  try {
    // 2. Query Approved Leads
    const { data, error } = await supabase
      .from('companies')
      .select('name, gst_number, email, mobile, industry, approved_at')
      .eq('is_approved', true);

    if (error) throw error;

    // 3. Data Cleaning (Ensures Main Site receives "Clean Gold")
    const cleanedLeads = (data || []).map(lead => ({
      ...lead,
      // Ensure +91 prefix
      mobile: lead.mobile 
        ? (lead.mobile.startsWith('+91') ? lead.mobile : `+91 ${lead.mobile.replace(/\D/g, '')}`)
        : null,
      // Strip spaces from GST
      gst_number: lead.gst_number ? lead.gst_number.replace(/\s+/g, '') : null
    }));

    // 4. Return Structured JSON
    res.status(200).json({
      factory: "Bell24h Lead Factory [INTERNAL]",
      timestamp: new Date().toISOString(),
      count: cleanedLeads.length,
      leads: cleanedLeads
    });

  } catch (error: any) {
    console.error("API Error:", error.message);
    res.status(500).json({ error: "Internal Server Error during data extraction" });
  }
}
