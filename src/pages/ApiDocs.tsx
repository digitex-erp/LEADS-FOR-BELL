import React from 'react';
import { Terminal, Copy, Shield, Database, Lock, Globe } from 'lucide-react';

export const ApiDocs = () => {
  const internalKey = import.meta.env.VITE_INTERNAL_FEED_KEY || 'YOUR_INTERNAL_FEED_KEY';
  const apiUrl = `${window.location.origin}/api/v1/leads/verified`;

  const curlCommand = `curl -X GET "${apiUrl}" 
  -H "x-bell24h-key: ${internalKey}" 
  -H "Content-Type: application/json"`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(curlCommand);
    alert('cURL command copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 p-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-primary/20 rounded-lg text-brand-primary">
            <Lock size={20} />
          </div>
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.3em]">Secure Handshake Protocol</span>
        </div>
        <h1 className="text-4xl font-display font-bold text-white tracking-tight">
          Bell24h.com Feed Documentation
        </h1>
        <p className="text-white/40 text-lg leading-relaxed max-w-2xl">
          This is a stealth feeder node. Unauthorized access to this endpoint will trigger an automatic IP shroud. Use the following encrypted handshake to fetch verified leads.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl space-y-3">
          <Database size={24} className="text-brand-primary" />
          <h3 className="font-bold text-sm">Real-time Sync</h3>
          <p className="text-[10px] text-white/40 leading-relaxed uppercase font-bold tracking-wider">
            Direct database view access for zero-latency lead delivery.
          </p>
        </div>
        <div className="glass p-6 rounded-3xl space-y-3">
          <Shield size={24} className="text-brand-primary" />
          <h3 className="font-bold text-sm">Security Node</h3>
          <p className="text-[10px] text-white/40 leading-relaxed uppercase font-bold tracking-wider">
            Mandatory x-bell24h-key validation for every request.
          </p>
        </div>
        <div className="glass p-6 rounded-3xl space-y-3">
          <Globe size={24} className="text-brand-primary" />
          <h3 className="font-bold text-sm">Edge Optimization</h3>
          <p className="text-[10px] text-white/40 leading-relaxed uppercase font-bold tracking-wider">
            Served via Vercel Edge for high-speed cross-region fetch.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-display font-bold flex items-center gap-3">
            <Terminal size={20} className="text-brand-primary" />
            Verified Leads cURL
          </h2>
          <button 
            onClick={copyToClipboard}
            className="px-4 py-1.5 glass rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-colors"
          >
            <Copy size={12} />
            Copy Command
          </button>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary/20 to-transparent blur opacity-25 group-hover:opacity-50 transition duration-1000" />
          <pre className="relative p-8 glass rounded-[2rem] bg-brand-dark/80 font-mono text-sm overflow-x-auto text-white/80 border border-white/5">
            <code>{curlCommand}</code>
          </pre>
        </div>
      </div>

      <div className="glass p-8 rounded-[2rem] bg-brand-primary/5 border-brand-primary/20 space-y-4">
        <h4 className="font-bold text-brand-primary uppercase tracking-widest text-[10px]">Data Schema Details</h4>
        <ul className="grid grid-cols-2 gap-4 text-xs">
          <li className="flex items-center gap-2 text-white/60">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
            name (string)
          </li>
          <li className="flex items-center gap-2 text-white/60">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
            gst_number (string)
          </li>
          <li className="flex items-center gap-2 text-white/60">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
            email (string)
          </li>
          <li className="flex items-center gap-2 text-white/60">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
            mobile (string)
          </li>
          <li className="flex items-center gap-2 text-white/60">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
            industry (string)
          </li>
          <li className="flex items-center gap-2 text-white/60">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
            lead_score (number)
          </li>
        </ul>
      </div>
    </div>
  );
};
