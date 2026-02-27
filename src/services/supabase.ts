import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL') 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export type Company = {
  id: string;
  name: string;
  gst_number?: string;
  industry?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  website?: string;
  lead_score: number;
  engagement_count: number;
  last_interaction?: string;
  pan_number?: string;
  main_category?: string;
  sub_category?: string;
  status: 'new' | 'warm-lead' | 'dormant-sme' | 'contacted' | 'qualified' | 'disqualified' | 'invalid_data';
  tags: string[];
  created_at: string;
};

export type Contact = {
  id: string;
  company_id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  is_primary: boolean;
  created_at: string;
};

// --- API Functions ---

export const getCompanies = async () => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Company[];
};

export const createCompany = async (company: Partial<Company>) => {
  if (!supabase) throw new Error("Supabase client not initialized. Check your environment variables.");
  const { data, error } = await supabase
    .from('companies')
    .insert([company])
    .select();
  
  if (error) throw error;
  return data[0] as Company;
};

export const updateCompanyScore = async (id: string, score: number) => {
  if (!supabase) throw new Error("Supabase client not initialized.");
  const { data, error } = await supabase
    .from('companies')
    .update({ lead_score: score })
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0] as Company;
};

export const upsertCompany = async (company: Partial<Company>) => {
  if (!supabase) throw new Error("Supabase client not initialized.");
  
  // If GST exists, we use it as the unique key for upsert
  const { data, error } = await supabase
    .from('companies')
    .upsert(company, { onConflict: 'gst_number' })
    .select();
    
  if (error) throw error;
  return data[0] as Company;
};

export const trackEngagement = async (id: string) => {
  if (!supabase) throw new Error("Supabase client not initialized.");
  
  // Increment engagement count and update last interaction
  const { data, error } = await supabase.rpc('increment_engagement', { company_id: id });
  
  // Fallback if RPC is not defined yet
  if (error) {
    const { data: company } = await supabase.from('companies').select('engagement_count').eq('id', id).single();
    const newCount = (company?.engagement_count || 0) + 1;
    
    const { data: updated, error: updateError } = await supabase
      .from('companies')
      .update({ 
        engagement_count: newCount,
        last_interaction: new Date().toISOString()
      })
      .eq('id', id)
      .select();
      
    if (updateError) throw updateError;
    return updated[0] as Company;
  }
  
  return data;
};

export const getContactsForCompany = async (companyId: string) => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('company_id', companyId);
  
  if (error) throw error;
  return data as Contact[];
};
