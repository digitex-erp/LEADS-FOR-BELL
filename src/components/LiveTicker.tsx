import React, { useState, useEffect } from 'react';
import { TrendingUp, Zap } from 'lucide-react';

const EVENTS = [
  "New Lead in EVs - 2 mins ago",
  "Agriculture Liquidity spiked +12% in Maharashtra",
  "Automobile components supplier verified in Pune",
  "Iron & Steel: 45 new qualified leads detected",
  "Apparel: Export-ready manufacturer added in Surat",
  "Intelligence Engine: NLP mapping accuracy reached 98%",
  "New Lead in EVs - Bangalore Hub active"
];

export const LiveTicker = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % EVENTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 glass rounded-full border-brand-primary/20 bg-brand-primary/5 max-w-md overflow-hidden">
      <Zap size={14} className="text-brand-primary shrink-0 animate-pulse" />
      <div className="flex-1 relative h-5 overflow-hidden">
        <div 
          className="absolute inset-0 transition-transform duration-500 ease-in-out whitespace-nowrap"
          style={{ transform: `translateY(0)` }}
          key={index}
        >
          <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest animate-in slide-in-from-bottom-full">
            {EVENTS[index]}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <TrendingUp size={12} className="text-brand-primary" />
        <span className="text-[10px] font-bold text-brand-primary">LIVE</span>
      </div>
    </div>
  );
};
