import React from 'react';
import { Shield, Key, Database, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

export const SettingsPage = () => {
  const configs = [
    {
      name: 'Supabase Connection',
      status: supabase ? 'Connected' : 'Not Configured',
      icon: Database,
      details: import.meta.env.VITE_SUPABASE_URL ? 'Endpoint Active' : 'Missing VITE_SUPABASE_URL',
      color: supabase ? 'text-brand-primary' : 'text-rose-500'
    },
    {
      name: 'NVIDIA Minimax (Primary)',
      status: import.meta.env.VITE_NVIDIA_MINIMAX_KEY ? 'Connected' : 'Missing',
      icon: Cpu,
      details: 'High-speed extraction node',
      color: import.meta.env.VITE_NVIDIA_MINIMAX_KEY ? 'text-brand-primary' : 'text-amber-500'
    },
    {
      name: 'DeepSeek (Backup)',
      status: import.meta.env.VITE_NVIDIA_DEEPSEEK_KEY ? 'Connected' : 'Missing',
      icon: Shield,
      details: 'Reasoning & failover engine',
      color: import.meta.env.VITE_NVIDIA_DEEPSEEK_KEY ? 'text-brand-primary' : 'text-amber-500'
    }
  ];

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-3xl font-display font-bold">System Settings</h2>
        <p className="text-white/40 text-sm mt-1">Configure your AI nodes and database connections</p>
      </div>

      <div className="grid gap-6">
        <section className="glass p-8 rounded-3xl space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Key size={20} className="text-brand-primary" />
            Infrastructure Health
          </h3>
          
          <div className="grid gap-4">
            {configs.map((cfg) => (
              <div key={cfg.name} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                    <cfg.icon size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{cfg.name}</p>
                    <p className="text-xs text-white/40">{cfg.details}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-widest ${cfg.color}`}>{cfg.status}</span>
                  {cfg.status === 'Ready' || cfg.status === 'Connected' ? (
                    <CheckCircle2 size={16} className="text-brand-primary" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass p-8 rounded-3xl space-y-6">
          <h3 className="text-lg font-bold">Profile Configuration</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Node Identifier</label>
              <input 
                disabled 
                value="Admin Node 01" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/60"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Region</label>
              <input 
                disabled 
                value="India-East (Vercel)" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/60"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
