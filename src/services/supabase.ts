import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isPlaceholder = (val: string) => !val || val.includes('YOUR_SUPABASE') || val.length < 20;

export const supabase = (!isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey)) 
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
  email?: string;
  mobile?: string;
  lead_score: number;
  engagement_count: number;
  last_interaction?: string;
  pan_number?: string;
  main_category?: string;
  sub_category?: string;
  status: 'new' | 'warm-lead' | 'dormant-sme' | 'contacted' | 'qualified' | 'disqualified' | 'invalid_data';
  is_approved: boolean;
  approved_at?: string;
  tags: string[];
  created_at: string;
  metadata?: any;
};

// ... existing code ...

export const approveCompany = async (id: string, isApproved: boolean) => {
  if (!supabase) throw new Error("Supabase client not initialized.");
  const { data, error } = await supabase
    .from('companies')
    .update({ 
      is_approved: isApproved,
      approved_at: isApproved ? new Date().toISOString() : null
    })
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0] as Company;
};

export type RFQ = {
  id: string;
  title: string;
  quantity?: string;
  specifications?: string;
  category?: string;
  company_id?: string;
  status: string;
  created_at: string;
};

export type Contact = {
  id: string;
  company_id: string;
  name: string;
  role?: string;
  email?: string;
  mobile?: string;
  is_primary: boolean;
  created_at: string;
};

export type DBCategory = {
  id: string;
  name: string;
  icon?: string;
  description?: string;
};

export type DBSubcategory = {
  id: string;
  category_id: string;
  name: string;
};

// ... existing code ...

export const getDBCategories = async () => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as DBCategory[];
};

export const getDBSubcategories = async (categoryId: string) => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('subcategories')
    .select('*')
    .eq('category_id', categoryId)
    .order('name');

  if (error) throw error;
  return data as DBSubcategory[];
};

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
  
  // Refresh session to clear schema cache if it helps
  try { await supabase.auth.refreshSession(); } catch (e) {}
  
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
  
  // Refresh session to clear schema cache if it helps
  try { await supabase.auth.refreshSession(); } catch (e) {}
  
  // If GST exists, we use it as the unique key for upsert
  const { data, error } = await supabase
    .from('companies')
    .upsert(company, { onConflict: 'gst_number' })
    .select();
    
  if (error) throw error;
  return data[0] as Company;
};

export const createRFQ = async (rfq: Partial<RFQ>) => {
  if (!supabase) throw new Error("Supabase client not initialized.");
  const { data, error } = await supabase
    .from('rfqs')
    .insert([rfq])
    .select();
  
  if (error) throw error;
  return data[0] as RFQ;
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

export const logActivity = async (action: string, details: string, companyId?: string) => {
  if (!supabase) return;
  const { error } = await supabase
    .from('activity_logs')
    .insert([{ 
      action, 
      details, 
      company_id: companyId 
    }]);
  if (error) console.error("Logging error:", error);
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
