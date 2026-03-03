import React, { useState, useEffect } from 'react';
import { Database, TrendingUp, AlertCircle, ShoppingCart, Users, Search, Globe, Mail, Phone, ShieldCheck, CheckCircle2, Share2 } from 'lucide-react';
import { supabase, Company, getCompanies, approveCompany } from '../../services/supabase';

export const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = new URLSearchParams(window.location.search).get('admin') === 'true';
  const mainSiteUrl = "https://bell24h.com"; // Replace with actual main site URL

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await getCompanies();
      setSuppliers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      await approveCompany(id, !currentStatus);
      fetchSuppliers();
    } catch (err: any) {
      alert(`Approval update failed: ${err.message}`);
    }
  };

  const handleInvite = (supplier: Company) => {
    const message = `Hi ${supplier.name}, your business [GST: ${supplier.gst_number || 'verified'}] is verified on Bell24h Lead Factory. Complete your profile on our Main Marketplace here: ${mainSiteUrl}`;
    const whatsappUrl = `https://wa.me/${supplier.mobile?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleExportApproved = () => {
    const approved = suppliers.filter(s => s.is_approved);
    if (approved.length === 0) {
      alert("No approved suppliers to export.");
      return;
    }

    const headers = ["Name", "GSTIN", "Email", "Mobile", "Industry", "Approved At"];
    const csvContent = [
      headers.join(","),
      ...approved.map(s => [
        `"${s.name}"`,
        `"${s.gst_number || ''}"`,
        `"${s.email || ''}"`,
        `"${s.mobile || ''}"`,
        `"${s.industry || s.main_category || ''}"`,
        `"${s.approved_at || ''}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `bell24h_approved_leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold">Lead Management [INTERNAL]</h2>
          <p className="text-white/40 text-sm mt-1">Private feeder engine for the Bell24h B2B network</p>
        </div>
        <div className="flex gap-4">
          {isAdmin && (
            <button 
              onClick={handleExportApproved}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-brand-primary border border-brand-primary/20 transition-all"
            >
              Bulk Export for Marketplace
            </button>
          )}
           <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 w-64">
            <Search size={14} className="text-white/30" />
            <input 
              placeholder="Search leads..." 
              className="bg-transparent border-none text-xs focus:outline-none w-full placeholder:text-white/20"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl">
          <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white/40 text-sm font-mono animate-pulse">Scanning internal nodes...</p>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl text-center space-y-4">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-bold">Factory Empty</h3>
          <p className="text-white/40 max-w-sm mx-auto">No internal leads detected in the feeder system.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-brand-border">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Company</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Contact</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Marketplace Approval</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-bold">{supplier.name}</p>
                      <p className="text-[10px] text-white/40 font-mono uppercase">{supplier.gst_number || 'NO_GSTIN'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Mail size={12} className="text-white/20" />
                      <span>{supplier.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Phone size={12} className="text-white/20" />
                      <span>{supplier.mobile || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isAdmin ? (
                      <button 
                        onClick={() => handleToggleApproval(supplier.id, supplier.is_approved)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          supplier.is_approved 
                            ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/30" 
                            : "bg-white/5 text-white/40 border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {supplier.is_approved ? <CheckCircle2 size={12} /> : <div className="w-3 h-3 border border-current rounded-full" />}
                        {supplier.is_approved ? "Approved" : "Approve for Main"}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        {supplier.is_approved ? (
                          <span className="text-brand-primary flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                            <ShieldCheck size={14} /> Marketplace Ready
                          </span>
                        ) : (
                          <span className="text-white/20 text-[10px] font-bold uppercase tracking-wider italic">
                            Pending Review
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleInvite(supplier)}
                      className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-[10px] font-bold text-white/60 hover:text-brand-primary hover:border-brand-primary/30 transition-all"
                    >
                      <Share2 size={14} />
                      Invite to Main
                    </button>
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
          <p>Sync Error: {error}</p>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;
