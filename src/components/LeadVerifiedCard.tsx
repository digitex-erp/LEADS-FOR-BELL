import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, PartyPopper, Share2, Plus, ExternalLink } from 'lucide-react';

interface LeadVerifiedCardProps {
  name: string;
  category: string;
  onClose: () => void;
}

export const LeadVerifiedCard = ({ name, category, onClose }: LeadVerifiedCardProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -50 }}
      className="fixed bottom-8 right-8 z-[200] max-w-md w-full glass border-brand-primary/50 bg-brand-dark/95 shadow-[0_20px_60px_-15px_rgba(0,255,0,0.3)] rounded-[2.5rem] overflow-hidden p-8"
    >
      <div className="absolute inset-0 bg-brand-primary/5 pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative space-y-6">
        <div className="flex justify-between items-start">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/20 flex items-center justify-center text-brand-primary shadow-[0_0_40px_rgba(0,255,0,0.3)] animate-bounce">
            <PartyPopper size={32} />
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/20 hover:text-white"
          >
            <Plus size={24} className="rotate-45" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Broadcast Live to Bell24h.com</span>
          </div>
          <h3 className="text-2xl font-display font-bold text-white tracking-tight">
            Lead Successfully Verified!
          </h3>
          <p className="text-white/40 text-sm leading-relaxed">
            <span className="text-white font-bold">{name}</span> in <span className="text-brand-primary font-bold">{category}</span> is now synchronized with the main marketplace.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onClose}
            className="py-3 glass rounded-xl text-xs font-bold text-white/60 hover:text-white transition-all border border-white/5"
          >
            Close Node
          </button>
          <button 
            className="py-3 bg-brand-primary text-brand-dark rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform"
          >
            <ExternalLink size={14} />
            View on Live
          </button>
        </div>
      </div>
    </motion.div>
  );
};
