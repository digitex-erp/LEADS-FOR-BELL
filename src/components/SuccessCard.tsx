import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Share2, Plus, TrendingUp } from 'lucide-react';

interface SuccessCardProps {
  category: string;
  count: number;
  totalInCategory: number;
  onClose: () => void;
}

export const SuccessCard = ({ category, count, totalInCategory, onClose }: SuccessCardProps) => {
  const shareText = `🚀 Bell24h just dropped ${count} new verified suppliers in ${category}! Check real-time liquidity here: ${window.location.origin}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="mb-8 p-6 glass border-brand-primary/30 bg-brand-primary/5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-brand-primary/20 flex items-center justify-center text-brand-primary shadow-[0_0_20px_rgba(0,255,0,0.2)] animate-pulse">
          <CheckCircle size={32} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-primary text-brand-dark uppercase tracking-wider">Verified</span>
            <h3 className="text-xl font-display font-bold text-white tracking-tight">
              {count} New Leads Injected into {category}
            </h3>
          </div>
          <p className="text-white/40 text-sm mt-1">
            Intelligence synchronization complete. Total Liquidity: 
            <span className="text-brand-primary font-bold ml-1">{totalInCategory}</span> Leads
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <a 
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-bold hover:scale-105 transition-transform shadow-lg shadow-green-500/20"
        >
          <Share2 size={16} />
          Share to WhatsApp
        </a>
        <button 
          onClick={onClose}
          className="p-2.5 hover:bg-white/5 rounded-xl text-white/20 hover:text-white transition-colors border border-white/10"
        >
          <Plus size={20} className="rotate-45" />
        </button>
      </div>
    </motion.div>
  );
};
