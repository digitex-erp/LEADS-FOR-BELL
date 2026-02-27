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
  status: 'new' | 'contacted' | 'qualified' | 'disqualified';
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

export const getContactsForCompany = async (companyId: string) => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('company_id', companyId);
  
  if (error) throw error;
  return data as Contact[];
};
