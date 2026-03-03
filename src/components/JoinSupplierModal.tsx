import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Building2, ShieldCheck, Phone, ArrowRight, Loader2, Tag } from 'lucide-react';
import { upsertCompany, getDBCategories, getDBSubcategories, DBCategory, DBSubcategory } from '../services/supabase';
import { calculateLeadScore } from '../services/scoring';

interface JoinSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (category: string, count: number) => void;
}

export const JoinSupplierModal = ({ isOpen, onClose, onSuccess }: JoinSupplierModalProps) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [subcategories, setSubcategories] = useState<DBSubcategory[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    gst_number: '',
    mobile: '',
    industry: '',
    sub_category: ''
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getDBCategories();
        setCategories(data);
        if (data.length > 0 && !formData.industry) {
          setFormData(prev => ({ ...prev, industry: data[0].name }));
        }
      } catch (e) {
        console.error("Failed to load categories:", e);
      }
    };
    if (isOpen) loadCategories();
  }, [isOpen]);

  useEffect(() => {
    const loadSubcategories = async () => {
      const selectedCat = categories.find(c => c.name === formData.industry);
      if (selectedCat) {
        try {
          const data = await getDBSubcategories(selectedCat.id);
          setSubcategories(data);
          setFormData(prev => ({ ...prev, sub_category: data[0]?.name || '' }));
        } catch (e) {
          console.error("Failed to load subcategories:", e);
        }
      }
    };
    if (formData.industry) loadSubcategories();
  }, [formData.industry, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const score = calculateLeadScore(formData);
      await upsertCompany({
        ...formData,
        main_category: formData.industry,
        lead_score: score,
        status: 'qualified',
        tags: ['Self-Onboarded', 'Real Supplier']
      });
      
      onSuccess(formData.industry, 1);
      onClose();
    } catch (error: any) {
      alert(`Onboarding failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-dark/90 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg glass rounded-[2.5rem] overflow-hidden border-brand-primary/20 shadow-2xl"
      >
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-3xl font-display font-bold text-white tracking-tight">Join as Supplier</h2>
              <p className="text-white/40 text-sm">Activate your node in the Bell24h Network</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/20 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Company Name</label>
                <div className="relative">
                  <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter registered business name"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">GST Number</label>
                <div className="relative">
                  <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input 
                    required
                    value={formData.gst_number}
                    onChange={e => setFormData({...formData, gst_number: e.target.value.toUpperCase()})}
                    placeholder="15-digit GSTIN"
                    maxLength={15}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-mono focus:outline-none focus:border-brand-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Mobile Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input 
                    required
                    type="tel"
                    value={formData.mobile}
                    onChange={e => setFormData({...formData, mobile: e.target.value})}
                    placeholder="+91 Mobile for RFQ alerts"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Industry</label>
                  <div className="relative">
                    <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <select
                      required
                      value={formData.industry}
                      onChange={e => setFormData({...formData, industry: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors appearance-none"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name} className="bg-brand-dark">{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">Subcategory</label>
                  <div className="relative">
                    <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <select
                      required
                      value={formData.sub_category}
                      onChange={e => setFormData({...formData, sub_category: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-brand-primary/50 transition-colors appearance-none"
                    >
                      {subcategories.map(sub => (
                        <option key={sub.id} value={sub.name} className="bg-brand-dark">{sub.name}</option>
                      ))}
                      {subcategories.length === 0 && <option value="" className="bg-brand-dark">Generic</option>}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full py-5 bg-brand-primary text-brand-dark rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(0,255,0,0.2)] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Activating Node...</span>
                </>
              ) : (
                <>
                  <span>Verify & Go Live</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <p className="text-[10px] text-center text-white/20 uppercase font-bold tracking-[0.2em]">
            Quantum-Secured Encryption Active
          </p>
        </div>
      </motion.div>
    </div>
  );
};
