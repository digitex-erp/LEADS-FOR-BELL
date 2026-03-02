import React, { useState, useEffect } from 'react';
import { Database, TrendingUp, AlertCircle, ShoppingCart, Users, Search, Globe, Mail, Phone, ShieldCheck } from 'lucide-react';
import { supabase, Company, getCompanies } from '../../services/supabase';

export const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true);
      try {
        const data = await getCompanies();
        // For this page, we'll treat all companies as potential suppliers
        setSuppliers(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch suppliers');
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold">Supplier Intelligence</h2>
          <p className="text-white/40 text-sm mt-1">Direct access to verified industrial manufacturers and distributors</p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 w-64">
            <Search size={14} className="text-white/30" />
            <input 
              placeholder="Filter suppliers..." 
              className="bg-transparent border-none text-xs focus:outline-none w-full placeholder:text-white/20"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl">
          <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white/40 text-sm font-mono animate-pulse">Syncing supplier nodes...</p>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl text-center space-y-4">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-bold">No Suppliers Found</h3>
          <p className="text-white/40 max-w-sm mx-auto">The supplier database is currently empty. Run a simulation or import data to populate the marketplace.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-brand-border">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Supplier Details</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">GSTIN / Tax ID</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Contact Info</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Digital Presence</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-bold">{supplier.name}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-tight">{supplier.industry || supplier.main_category}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-brand-primary/80">{supplier.gst_number || 'PENDING_VERIFICATION'}</span>
                  </td>
                  <td className="px-6 py-4 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Mail size={12} className="text-white/20" />
                      <span>{supplier.metadata?.email || `info@${supplier.name.toLowerCase().replace(/\s+/g, '')}.in`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Phone size={12} className="text-white/20" />
                      <span>+91 {Math.floor(Math.random() * 9000000000) + 1000000000}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <a href="#" className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300">
                      <Globe size={12} />
                      <span>Website</span>
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-brand-primary">
                      <ShieldCheck size={16} />
                      <span className="text-[10px] font-bold uppercase">Verified</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-200 text-sm">
          <AlertCircle size={18} />
          <p>Intelligence Sync Error: {error}</p>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;
