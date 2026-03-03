import React, { useState, useEffect } from 'react';
import { TrendingUp, Zap, Building2 } from 'lucide-react';
import { Company } from '../services/supabase';

interface LiveTickerProps {
  leads: Company[];
}

export const LiveTicker = ({ leads }: LiveTickerProps) => {
  const [index, setIndex] = useState(0);

  // Fallback data if no real leads yet
  const fallbackEvents = [
    "Intelligence Engine: NLP mapping accuracy reached 98%",
    "Bell24h Secure Handshake: Node 01 Online",
    "Stealth Mode: Robots.txt Disallow active",
    "Vercel Edge: Zero-latency feed enabled"
  ];

  const realEvents = leads
    .filter(l => l.is_approved)
    .sort((a, b) => new Date(b.approved_at || 0).getTime() - new Date(a.approved_at || 0).getTime())
    .slice(0, 5)
    .map(l => `New Lead: ${l.main_category || l.industry} from ${l.city || 'India'} just verified.`);

  const allEvents = realEvents.length > 0 ? [...realEvents, ...fallbackEvents] : fallbackEvents;

  useEffect(() => {
    if (allEvents.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % allEvents.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [allEvents.length]);

  return (
    <div className="flex items-center gap-3 px-4 py-2 glass rounded-2xl border-brand-primary/20 bg-brand-primary/5 max-w-xl overflow-hidden shadow-[0_0_20px_rgba(0,255,0,0.05)]">
      <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
        <Zap size={16} className="animate-pulse" />
      </div>
      <div className="flex-1 relative h-6 overflow-hidden">
        <div 
          className="absolute inset-0 flex items-center"
          key={index}
        >
          <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest animate-in slide-in-from-bottom-full duration-500">
            {allEvents[index]}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 bg-brand-primary/10 rounded-md">
        <div className="w-1 h-1 rounded-full bg-brand-primary animate-ping" />
        <span className="text-[10px] font-bold text-brand-primary tracking-tighter">LIVE FEED</span>
      </div>
    </div>
  );
};
