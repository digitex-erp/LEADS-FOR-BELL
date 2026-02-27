import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Map as MapIcon, 
  MessageSquare, 
  Database, 
  TrendingUp, 
  Users, 
  Settings, 
  Plus, 
  Filter, 
  MoreVertical,
  ChevronRight,
  Send,
  MapPin,
  Building2,
  Phone,
  Mail,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Markdown from 'react-markdown';
import { chatWithGrounding } from './services/gemini';
import { getCompanies, Company, createCompany, updateCompanyScore, supabase } from './services/supabase';
import { calculateLeadScore } from './services/scoring';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Lead {
  id: string;
  name: string;
  industry: string;
  score: number;
  status: 'New' | 'Qualified' | 'Contacted';
  location: string;
  lastActive: string;
}

// --- Mock Data ---
const MOCK_LEADS: Lead[] = [
  { id: '1', name: 'TechFlow Solutions', industry: 'SaaS', score: 88, status: 'Qualified', location: 'Bangalore, KA', lastActive: '2h ago' },
  { id: '2', name: 'GreenGrid Energy', industry: 'Renewables', score: 72, status: 'New', location: 'Mumbai, MH', lastActive: '5h ago' },
  { id: '3', name: 'SwiftLogistics', industry: 'Logistics', score: 94, status: 'Qualified', location: 'Delhi, DL', lastActive: '10m ago' },
  { id: '4', name: 'Apex Manufacturing', industry: 'Industrial', score: 45, status: 'Contacted', location: 'Pune, MH', lastActive: '1d ago' },
];

// --- Mock Data for Charts ---
const VELOCITY_DATA = [
  { name: 'Jan 01', value: 120, value2: 80 },
  { name: 'Jan 08', value: 150, value2: 100 },
  { name: 'Jan 15', value: 280, value2: 210 },
  { name: 'Jan 22', value: 250, value2: 190 },
  { name: 'Jan 29', value: 320, value2: 240 },
  { name: 'Feb 05', value: 410, value2: 350 },
  { name: 'Feb 12', value: 380, value2: 320 },
];

const DISTRIBUTION_DATA = [
  { name: 'High', value: 400, color: '#00FF00' },
  { name: 'Medium', value: 300, color: '#3b82f6' },
  { name: 'Low', value: 200, color: '#a855f7' },
  { name: 'New', value: 100, color: '#f59e0b' },
];

// --- Components ---

const MarketMap = () => (
  <div className="flex-1 glass rounded-3xl overflow-hidden relative bg-brand-dark/40">
    <div className="absolute inset-0 opacity-20 pointer-events-none" 
      style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }} 
    />
    <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
      <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary animate-pulse">
        <MapIcon size={32} />
      </div>
      <div className="text-center">
        <h3 className="font-display font-bold text-lg">Market Intelligence Map</h3>
        <p className="text-white/40 text-sm max-w-xs mx-auto mt-2">Visualizing lead density and market opportunities across India. Grounding data active.</p>
      </div>
      <div className="flex gap-4 mt-4">
        <div className="px-4 py-2 glass rounded-xl text-xs font-bold border-brand-primary/20 text-brand-primary">Bangalore: 1,242</div>
        <div className="px-4 py-2 glass rounded-xl text-xs font-bold border-white/10 text-white/50">Mumbai: 842</div>
        <div className="px-4 py-2 glass rounded-xl text-xs font-bold border-white/10 text-white/50">Delhi: 712</div>
      </div>
    </div>
    
    {/* Mock Map Markers */}
    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute top-1/4 left-1/3 w-3 h-3 rounded-full bg-brand-primary shadow-[0_0_10px_rgba(0,255,0,0.5)]" />
    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 3, delay: 1 }} className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-brand-primary shadow-[0_0_10px_rgba(0,255,0,0.5)]" />
    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 3, delay: 2 }} className="absolute bottom-1/3 right-1/4 w-3 h-3 rounded-full bg-brand-primary shadow-[0_0_10px_rgba(0,255,0,0.5)]" />
  </div>
);

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
      active ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
    )}
  >
    <Icon size={18} className={cn("transition-transform duration-200", active ? "scale-110" : "group-hover:scale-110")} />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const StatCard = ({ label, value, trend, icon: Icon, subtext }: { label: string, value: string, trend?: string, icon: any, subtext?: string }) => (
  <div className="glass p-5 rounded-xl flex flex-col gap-3 relative overflow-hidden">
    <div className="flex justify-between items-start">
      <p className="text-white/60 text-sm font-medium">{label}</p>
      <div className="text-white/20">
        <Icon size={18} />
      </div>
    </div>
    <div>
      <h3 className="text-2xl font-bold font-display">{value}</h3>
      <div className="flex items-center gap-2 mt-1">
        {trend && (
          <span className={cn("text-xs font-bold", trend.startsWith('+') ? "text-brand-primary" : "text-rose-500")}>
            {trend}
          </span>
        )}
        {subtext && <span className="text-[10px] text-white/30 font-medium">{subtext}</span>}
      </div>
    </div>
  </div>
);

const ChatBot = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: "Hello! I'm your Lead Intelligence Assistant. I can help you find businesses, analyze locations, and score leads using real-time Google Maps data. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await chatWithGrounding(userMsg, messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })));
      setMessages(prev => [...prev, { role: 'model', text: response.text || "I couldn't process that request." }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error connecting to the intelligence engine." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full glass rounded-3xl overflow-hidden">
      <div className="p-4 border-b border-brand-border flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
          <h3 className="font-display font-bold text-sm uppercase tracking-widest">Intelligence Chat</h3>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors"><MoreVertical size={16} /></button>
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={cn(
              "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
              msg.role === 'user' 
                ? "bg-brand-primary text-brand-dark ml-auto font-medium" 
                : "bg-white/5 text-white/90 border border-brand-border"
            )}
          >
            <div className="markdown-body">
              <Markdown>{msg.text}</Markdown>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-1 p-2">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
          </div>
        )}
      </div>

      <div className="p-4 bg-white/5 border-t border-brand-border">
        <div className="relative">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about local businesses or leads..."
            className="w-full bg-brand-dark/50 border border-brand-border rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-brand-primary/50 transition-colors"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-primary text-brand-dark rounded-lg hover:scale-105 transition-transform disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await getCompanies();
      if (data && data.length > 0) {
        setLeads(data);
      } else {
        // If no data, we could keep mock data or show empty
        // For now, let's just set empty
        setLeads([]);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportMock = async () => {
    const mockLead: Partial<Company> = {
      name: 'New Tech Corp',
      industry: 'SaaS',
      city: 'Bangalore',
      website: 'https://newtech.co',
      gst_number: '29ABCDE1234F1Z5',
      status: 'new',
      tags: ['AI', 'B2B']
    };
    
    const score = calculateLeadScore(mockLead);
    mockLead.lead_score = score;

    try {
      await createCompany(mockLead);
      fetchLeads();
    } catch (error) {
      console.error("Error creating lead:", error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      const newLeads: Partial<Company>[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',');
        const lead: any = {};
        headers.forEach((header, index) => {
          lead[header.trim().toLowerCase()] = values[index]?.trim();
        });
        
        const score = calculateLeadScore(lead);
        newLeads.push({
          ...lead,
          lead_score: score,
          status: 'new',
          tags: []
        });
      }

      try {
        for (const lead of newLeads) {
          await createCompany(lead);
        }
        fetchLeads();
        alert(`Successfully imported ${newLeads.length} leads.`);
      } catch (error) {
        console.error("Import error:", error);
        alert("Error importing leads. Check console for details.");
      }
    };
    reader.readAsText(file);
  };

  const displayLeads = leads.length > 0 ? leads : [];

  return (
    <div className="flex h-screen bg-brand-dark text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-brand-border flex flex-col p-4 gap-6 bg-brand-dark">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-brand-dark shadow-[0_0_15px_rgba(0,255,0,0.3)]">
            <TrendingUp size={20} strokeWidth={2.5} />
          </div>
          <h1 className="font-display font-bold text-lg tracking-tight">Bell24h</h1>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto scrollbar-hide">
          <section>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-3 mb-2">Platform</p>
            <nav className="space-y-1">
              <SidebarItem icon={TrendingUp} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
              <SidebarItem icon={MessageSquare} label="Intelligence Engine" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
              <SidebarItem icon={Building2} label="Companies" active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} />
              <SidebarItem icon={Users} label="Contacts" active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')} />
            </nav>
          </section>

          <section>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-3 mb-2">Data Operations</p>
            <nav className="space-y-1">
              <SidebarItem icon={Plus} label="Import Data" onClick={() => fileInputRef.current?.click()} />
              <SidebarItem icon={ShieldCheck} label="API Keys" active={activeTab === 'api'} onClick={() => setActiveTab('api')} />
              <SidebarItem icon={AlertCircle} label="Enrichment Logs" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
            </nav>
          </section>

          <section>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-3 mb-2">System</p>
            <nav className="space-y-1">
              <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </nav>
          </section>
        </div>

        <div className="pt-4 border-t border-brand-border">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-primary/40 border border-brand-primary/30 flex items-center justify-center font-bold text-brand-primary text-xs">
              SA
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">System Admin</p>
              <p className="text-[10px] text-white/40 truncate">admin@bell24h.in</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-brand-border flex items-center justify-between px-8 bg-brand-dark/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex flex-col">
            <h2 className="text-2xl font-display font-bold">Intelligence Overview</h2>
          </div>
          
          <div className="flex items-center gap-6">
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Last updated: Just now</p>
            <div className="flex items-center gap-4 bg-white/5 border border-brand-border rounded-lg px-3 py-1.5 w-64">
              <Search size={14} className="text-white/30" />
              <input 
                placeholder="Search..." 
                className="bg-transparent border-none text-xs focus:outline-none w-full placeholder:text-white/20"
              />
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {!supabase && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-amber-200 text-sm">
              <AlertCircle size={18} />
              <p>Supabase is not configured. Please add <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> to your environment variables.</p>
            </div>
          )}
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  label="Total Companies" 
                  value={leads.length > 0 ? leads.length.toLocaleString() : "2,543"} 
                  trend="+180" 
                  subtext="from last import" 
                  icon={Building2} 
                />
                <StatCard 
                  label="Qualified Leads" 
                  value={leads.length > 0 ? leads.filter(l => l.status === 'qualified').length.toString() : "892"} 
                  trend="+12%" 
                  subtext="vs last month" 
                  icon={ShieldCheck} 
                />
                <StatCard 
                  label="Est. Liquidity Value" 
                  value="₹4.2M" 
                  subtext="Based on enriched revenue data" 
                  icon={Database} 
                />
                <div className="glass p-5 rounded-xl flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <p className="text-white/60 text-sm font-medium">Enrichment Rate</p>
                    <div className="text-white/20"><TrendingUp size={18} /></div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold font-display">78%</h3>
                    <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-brand-primary w-[78%] rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Velocity Chart */}
                <div className="lg:col-span-2 glass p-6 rounded-2xl flex flex-col gap-6">
                  <div>
                    <h3 className="font-bold text-sm">Lead Acquisition Velocity</h3>
                    <p className="text-xs text-white/40 mt-1">New companies ingested and processed over time</p>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={VELOCITY_DATA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="rgba(255,255,255,0.3)" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.3)" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                          itemStyle={{ fontSize: '12px' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#00FF00" 
                          strokeWidth={2} 
                          dot={false} 
                          activeDot={{ r: 4, fill: '#00FF00' }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value2" 
                          stroke="#3b82f6" 
                          strokeWidth={2} 
                          dot={false} 
                          activeDot={{ r: 4, fill: '#3b82f6' }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Distribution Chart */}
                <div className="glass p-6 rounded-2xl flex flex-col gap-6">
                  <div>
                    <h3 className="font-bold text-sm">Scoring Distribution</h3>
                    <p className="text-xs text-white/40 mt-1">Lead quality breakdown by current score</p>
                  </div>
                  <div className="h-[300px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={DISTRIBUTION_DATA}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {DISTRIBUTION_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-bold">Recent Intelligence</h2>
                  <button className="text-xs font-semibold text-brand-primary hover:underline" onClick={() => setActiveTab('leads')}>View All</button>
                </div>

                  <div className="glass rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 border-b border-brand-border">
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Company</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Industry</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Score</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Status</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border">
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-white/20">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                                Loading intelligence...
                              </div>
                            </td>
                          </tr>
                        ) : displayLeads.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-white/20">
                              No leads found. Start by importing or chatting.
                            </td>
                          </tr>
                        ) : displayLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-brand-primary transition-colors">
                                  <Building2 size={16} />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold">{lead.name}</p>
                                  <p className="text-[10px] text-white/30 flex items-center gap-1">
                                    <MapPin size={10} /> {lead.city}, {lead.state || 'IN'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs text-white/60">{lead.industry || 'N/A'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${lead.lead_score}%` }}
                                    className={cn(
                                      "h-full rounded-full",
                                      lead.lead_score > 80 ? "bg-brand-primary" : lead.lead_score > 50 ? "bg-amber-400" : "bg-rose-500"
                                    )}
                                  />
                                </div>
                                <span className="text-xs font-bold">{lead.lead_score}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md",
                                lead.status === 'qualified' ? "bg-brand-primary/10 text-brand-primary" : 
                                lead.status === 'new' ? "bg-blue-500/10 text-blue-400" : "bg-white/5 text-white/40"
                              )}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="p-2 text-white/20 hover:text-white transition-colors">
                                <ChevronRight size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

          {activeTab === 'chat' && (
            <div className="h-[calc(100vh-160px)]">
              <ChatBot />
            </div>
          )}

          {activeTab === 'map' && (
            <div className="h-[calc(100vh-200px)] flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold">Market Map</h2>
                <div className="flex gap-2">
                  <button className="px-4 py-2 glass rounded-xl text-xs font-bold text-brand-primary">Heatmap</button>
                  <button className="px-4 py-2 glass rounded-xl text-xs font-bold text-white/40">Clusters</button>
                </div>
              </div>
              <MarketMap />
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="space-y-6">
              <h2 className="text-xl font-display font-bold">Full Lead Database</h2>
              <div className="glass rounded-2xl p-12 text-center text-white/20">
                <Database size={48} className="mx-auto mb-4 opacity-10" />
                <p>Lead management module active. Filter and export controls available.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
