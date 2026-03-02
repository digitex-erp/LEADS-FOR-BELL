import React, { useState } from 'react';
import { Play, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface SimulationButtonProps {
  category: string;
  onComplete?: () => void;
  triggerSimulate?: (category: string) => Promise<void>;
  className?: string;
}

export const SimulationButton = ({ category, onComplete, triggerSimulate, className }: SimulationButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSimulate = async () => {
    if (!category || loading) return;

    setLoading(true);
    setStatus('loading');
    try {
      if (triggerSimulate) {
        await triggerSimulate(category);
      } else {
        const response = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category })
        });
        if (!response.ok) throw new Error('Simulation failed');
      }

      setStatus('success');
      if (onComplete) onComplete();
      
      setTimeout(() => {
        setStatus('idle');
        setLoading(false);
      }, 3000);
    } catch (error) {
      console.error(error);
      alert('Error during simulation: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setLoading(false);
      setStatus('idle');
    }
  };

  return (
    <button
      onClick={handleSimulate}
      disabled={loading || !category}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300",
        status === 'idle' && "bg-brand-primary text-brand-dark hover:scale-105 shadow-[0_0_15px_rgba(0,255,0,0.2)]",
        status === 'loading' && "bg-white/10 text-white/50 cursor-wait",
        status === 'success' && "bg-emerald-500 text-white",
        !category && "opacity-50 grayscale cursor-not-allowed",
        className
      )}
    >
      {status === 'idle' && (
        <>
          <Play size={16} fill="currentColor" />
          <span>Simulate 10 Leads</span>
        </>
      )}
      {status === 'loading' && (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span>Simulating {category}...</span>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle size={16} />
          <span>Simulation Complete</span>
        </>
      )}
    </button>
  );
};
