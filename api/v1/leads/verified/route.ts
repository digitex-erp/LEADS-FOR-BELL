import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const bell24hKey = process.env.INTERNAL_FEED_KEY || ''; // Aligning with existing env var

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: any, res: any) {
  // 1. Security Gate: Implement check for 'x-bell24h-key' header
  const authHeader = req.headers['x-bell24h-key'];
  
  if (!bell24hKey || authHeader !== bell24hKey) {
    console.error("❌ Unauthorized Handshake Attempt [V1 LEADS]");
    return res.status(401).json({ error: "Unauthorized. Secure x-bell24h-key required." });
  }

  try {
    // 2. Data Pull: Fetch from 'verified_marketplace_leads' view
    const { data, error } = await supabase
      .from('verified_marketplace_leads')
      .select('*');

    if (error) throw error;

    // 3. Return Structured JSON
    res.status(200).json({
      factory: "Bell24h Lead Factory [V1]",
      timestamp: new Date().toISOString(),
      count: data?.length || 0,
      leads: data
    });

  } catch (error: any) {
    console.error("API Error [V1 LEADS]:", error.message);
    res.status(500).json({ error: "Internal Server Error during data extraction" });
  }
}
