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
import { getCompanies, Company, createCompany, updateCompanyScore, supabase, upsertCompany, trackEngagement, logActivity } from './services/supabase';
import { calculateLeadScore } from './services/scoring';
import { MASTER_CATEGORIES, Category } from './constants/categories';
import { categorizeBusiness } from './services/nlpCategorizer';
import { simulateLeads } from './services/simulation';
import { DashboardLayout } from './layouts/DashboardLayout';
import { SuppliersPage } from './pages/suppliers/page';
import { SimulationButton } from './components/SimulationButton';
import { SuccessCard } from './components/SuccessCard';
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
    { role: 'model', text: "Hello! I'm your Lead Intelligence Assistant. I can help you find businesses, analyze locations, and score leads. I now support Gemini, Claude, and NVIDIA NIM models (Minimax, Qwen, Kimi). How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<'gemini' | 'claude' | 'minimaxai/minimax-m2.5' | 'qwen/qwen3.5-397b-a17b' | 'moonshotai/kimi-k2.5'>('gemini');
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
      let responseText = "";
      if (model === 'gemini') {
        const response = await chatWithGrounding(userMsg, messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })));
        responseText = response.text || "I couldn't process that request.";
      } else if (model === 'claude') {
        const response = await fetch('/api/chat/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMsg, history: messages })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        responseText = data.text;
      } else {
        // NVIDIA NIM models
        const response = await fetch('/api/chat/nvidia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMsg, history: messages, model })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        responseText = data.text;
      }
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${error.message || "Sorry, I encountered an error connecting to the intelligence engine."}` }]);
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
        <div className="flex items-center gap-2">
          <select 
            value={model} 
            onChange={(e) => setModel(e.target.value as any)}
            className="bg-brand-dark/50 border border-brand-border rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/60 focus:outline-none focus:border-brand-primary/50"
          >
            <option value="gemini">Gemini 2.5</option>
            <option value="claude">Claude 3.5</option>
            <option value="minimaxai/minimax-m2.5">NVIDIA Minimax</option>
            <option value="qwen/qwen3.5-397b-a17b">NVIDIA Qwen</option>
            <option value="moonshotai/kimi-k2.5">NVIDIA Kimi</option>
          </select>
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
  const [selectedLead, setSelectedLead] = useState<Company | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [importPreview, setImportPreview] = useState<{ leads: Partial<Company>[], summary: Record<string, number> } | null>(null);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSuccess, setSimulationSuccess] = useState<{ category: string, count: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Listen to URL search params
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      setActiveTab('leads');
    }

    console.log("🚀 Bell24h Orchestrator: Connected to Supabase");
    fetchLeads();
  }, []);

  const updateCategoryParam = (category: string) => {
    const url = new URL(window.location.href);
    if (category === 'All') {
      url.searchParams.delete('category');
    } else {
      url.searchParams.set('category', category);
    }
    window.history.pushState({}, '', url);
    setSelectedCategory(category);
  };

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

    setIsProcessingImport(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        
        const previewLeads: Partial<Company>[] = [];
        const summary: Record<string, number> = {};
        
        // Process max 50 leads for preview to keep it fast
        const processLimit = Math.min(lines.length, 51);
        
        for (let i = 1; i < processLimit; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(',');
          const lead: any = {};
          headers.forEach((header, index) => {
            lead[header.trim().toLowerCase()] = values[index]?.trim();
          });
          
          const description = lead.description || lead.industry || lead.name;
          const catResult = await categorizeBusiness(description);
          
          const enrichedLead = {
            ...lead,
            main_category: catResult.mainCategory,
            sub_category: catResult.subCategory,
            status: 'new',
            tags: []
          };
          
          summary[catResult.mainCategory] = (summary[catResult.mainCategory] || 0) + 1;
          previewLeads.push(enrichedLead);
        }

        setImportPreview({ leads: previewLeads, summary });
        setActiveTab('import');
      } catch (error) {
        console.error("Import preview error:", error);
        alert("Error generating import preview.");
      } finally {
        setIsProcessingImport(false);
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (!importPreview) return;
    
    setIsProcessingImport(true);
    try {
      for (const lead of importPreview.leads) {
        const score = calculateLeadScore(lead);
        await upsertCompany({ ...lead, lead_score: score });
      }
      fetchLeads();
      setImportPreview(null);
      setActiveTab('leads');
      alert(`Successfully imported ${importPreview.leads.length} leads.`);
    } catch (error) {
      console.error("Final import error:", error);
      alert("Error during final import.");
    } finally {
      setIsProcessingImport(false);
    }
  };

  const handleSimulate = async (category: string) => {
    setIsSimulating(true);
    setSimulationSuccess(null);
    try {
      await simulateLeads(category, 10);
      await fetchLeads();
      setSimulationSuccess({ category, count: 10 });
      setTimeout(() => setSimulationSuccess(null), 10000); // Hide after 10s
    } catch (error) {
      console.error("Simulation error:", error);
      alert("Error during simulation.");
    } finally {
      setIsSimulating(false);
    }
  };

  const displayLeads = leads.length > 0 
    ? leads.filter(l => selectedCategory === 'All' || l.main_category === selectedCategory) 
    : [];

  if (loading && leads.length === 0) {
    return (
      <div className="h-screen bg-brand-dark flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-display font-bold">Connecting to Bell24h Engine...</h2>
        <p className="text-white/40 text-sm mt-2 font-mono">Initializing Lead Intelligence Layer</p>
      </div>
    );
  }

  return (
    <DashboardLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      sidebarContent={
        <>
          <section>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-3 mb-2">Category Heatmap</p>
            <div className="px-3 space-y-2">
              <button 
                onClick={() => updateCategoryParam('All')}
                className={cn(
                  "w-full flex items-center justify-between text-[10px] hover:bg-white/5 p-1 rounded transition-colors group text-left",
                  selectedCategory === 'All' ? "bg-white/10 text-white" : "text-white/40"
                )}
              >
                <span>All Categories</span>
                <span className="text-brand-primary font-bold">{leads.length}</span>
              </button>
              {MASTER_CATEGORIES
                .map(cat => ({
                  name: cat.name,
                  count: leads.filter(l => l.main_category === cat.name).length
                }))
                .filter(c => c.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map(cat => (
                  <button 
                    key={cat.name} 
                    onClick={() => {
                      updateCategoryParam(cat.name);
                      setActiveTab('leads');
                      logActivity('category_interest', `Clicked heatmap: ${cat.name}`);
                    }}
                    className="w-full flex items-center justify-between text-[10px] hover:bg-white/5 p-1 rounded transition-colors group text-left"
                  >
                    <span className="text-white/40 truncate pr-2 group-hover:text-white">{cat.name}</span>
                    <span className="text-brand-primary font-bold">{cat.count}</span>
                  </button>
                ))
              }
              {leads.filter(l => !l.main_category || l.main_category === 'Uncategorized').length > 0 && (
                <div className="flex items-center justify-between text-[10px] px-1">
                  <span className="text-white/20 italic">Uncategorized</span>
                  <span className="text-white/40">{leads.filter(l => !l.main_category || l.main_category === 'Uncategorized').length}</span>
                </div>
              )}
            </div>
          </section>

          <section>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-3 mb-2">Market Simulation</p>
            <div className="px-3 space-y-2">
              <select 
                onChange={(e) => setSelectedCategory(e.target.value)}
                value={selectedCategory === 'All' ? '' : selectedCategory}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-brand-primary focus:outline-none"
              >
                <option value="">Select Category...</option>
                {MASTER_CATEGORIES.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <SimulationButton 
                category={selectedCategory === 'All' ? '' : selectedCategory} 
                triggerSimulate={handleSimulate}
                className="w-full"
              />
            </div>
          </section>
        </>
      }
    >
      <div className="max-w-7xl mx-auto">
        <AnimatePresence>
          {simulationSuccess && (
            <SuccessCard 
              category={simulationSuccess.category}
              count={simulationSuccess.count}
              totalInCategory={leads.filter(l => l.main_category === simulationSuccess.category).length}
              onClose={() => setSimulationSuccess(null)}
            />
          )}
        </AnimatePresence>
        {!supabase && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-amber-200 text-sm mb-8">
            <AlertCircle size={18} />
            <p>Supabase is not configured. Please add <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> to your environment variables.</p>
          </div>
        )}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-display font-bold">Intelligence Overview</h2>
                <p className="text-white/40 text-sm mt-1">Real-time market liquidity and lead acquisition velocity</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white/5 border border-brand-border rounded-lg px-3 py-1.5 w-64">
                  <Search size={14} className="text-white/30" />
                  <input 
                    placeholder="Search leads..." 
                    className="bg-transparent border-none text-xs focus:outline-none w-full placeholder:text-white/20"
                  />
                </div>
              </div>
            </div>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                label="Total Companies" 
                value={leads.length.toLocaleString()} 
                trend={`+${leads.filter(l => {
                  const d = new Date(l.created_at || '');
                  const now = new Date();
                  return d.getTime() > now.getTime() - 24 * 60 * 60 * 1000;
                }).length}`} 
                subtext="last 24 hours" 
                icon={Building2} 
              />
              <StatCard 
                label="Qualified Leads" 
                value={leads.filter(l => l.status === 'qualified').length.toString()} 
                trend="+12%" 
                subtext="vs last month" 
                icon={ShieldCheck} 
              />
              <StatCard 
                label="Est. Liquidity Value" 
                value={`₹${(leads.length * 1.5).toFixed(1)}M`} 
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
              <div className="lg:col-span-2 glass p-6 rounded-2xl flex flex-col gap-6">
                <div>
                  <h3 className="font-bold text-sm">Lead Acquisition Velocity</h3>
                  <p className="text-xs text-white/40 mt-1">New companies ingested and processed over time</p>
                </div>
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={VELOCITY_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#00FF00' }}
                      />
                      <Line type="monotone" dataKey="value" stroke="#00FF00" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="lg:col-span-1 flex flex-col gap-8">
                <div className="glass p-6 rounded-2xl flex-1 flex flex-col gap-6">
                  <h3 className="font-bold text-sm">Lead Distribution</h3>
                  <div className="flex-1 min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={DISTRIBUTION_DATA}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {DISTRIBUTION_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <MarketMap />
              </div>
            </div>
          </div>
        )}

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
                          <tr 
                            key={lead.id} 
                            onClick={() => setSelectedLead(lead)}
                            className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                          >
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
            )}

          {activeTab === 'chat' && (
            <div className="h-[calc(100vh-160px)]">
              <ChatBot />
            </div>
          )}

          {activeTab === 'suppliers' && (
            <SuppliersPage />
          )}

          {activeTab === 'categories' && (
            <div className="h-[calc(100vh-200px)] flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold">Category Market Map</h2>
                <div className="flex gap-2">
                  <button className="px-4 py-2 glass rounded-xl text-xs font-bold text-brand-primary">Heatmap</button>
                  <button className="px-4 py-2 glass rounded-xl text-xs font-bold text-white/40">Clusters</button>
                </div>
              </div>
              <MarketMap />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <h2 className="text-xl font-display font-bold">Performance Analytics</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="glass p-6 rounded-2xl flex flex-col gap-6">
                  <div>
                    <h3 className="font-bold text-sm">Lead Acquisition Velocity</h3>
                    <p className="text-xs text-white/40 mt-1">New companies ingested and processed over time</p>
                  </div>
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={VELOCITY_DATA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          itemStyle={{ color: '#00FF00' }}
                        />
                        <Line type="monotone" dataKey="value" stroke="#00FF00" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="glass p-6 rounded-2xl flex flex-col gap-6">
                  <h3 className="font-bold text-sm">Lead Distribution</h3>
                  <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={DISTRIBUTION_DATA}
                          innerRadius={80}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {DISTRIBUTION_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
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

          {activeTab === 'import' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-display font-bold">Bulk Import Validator</h2>
                  <p className="text-white/40 text-sm">Review NLP categorization before committing to database</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setImportPreview(null)}
                    className="px-6 py-2 glass rounded-xl text-sm font-bold hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmImport}
                    disabled={isProcessingImport || !importPreview}
                    className="px-6 py-2 bg-brand-primary text-brand-dark rounded-xl text-sm font-bold hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    {isProcessingImport ? 'Processing...' : 'Confirm & Upsert'}
                  </button>
                </div>
              </div>

              {importPreview && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-1 space-y-6">
                    <div className="glass p-6 rounded-2xl">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Pre-Categorization Report</h3>
                      <div className="space-y-3">
                        {Object.entries(importPreview.summary).map(([cat, count]) => (
                          <div key={cat} className="flex justify-between items-center">
                            <span className="text-sm text-white/70">{cat}</span>
                            <span className="text-sm font-bold text-brand-primary">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-xl">
                      <div className="flex items-center gap-3 text-brand-primary mb-2">
                        <ShieldCheck size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Trojan Horse Active</span>
                      </div>
                      <p className="text-[10px] text-white/60 leading-relaxed">
                        GST numbers detected. PAN extraction and lead scoring will be triggered automatically upon confirmation.
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-2 glass rounded-2xl overflow-hidden">
                    <div className="max-h-[600px] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white/5 border-b border-brand-border sticky top-0 z-10">
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Company</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">NLP Category</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">GST</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                          {importPreview.leads.map((lead, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4">
                                <p className="text-sm font-medium">{lead.name}</p>
                                <p className="text-[10px] text-white/30">{lead.city}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs text-brand-primary font-bold">{lead.main_category}</span>
                                <p className="text-[10px] text-white/40">{lead.sub_category}</p>
                              </td>
                              <td className="px-6 py-4 text-xs font-mono text-white/40">
                                {lead.gst_number || '---'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {!importPreview && !isProcessingImport && (
                <div className="glass rounded-3xl p-20 text-center border-dashed border-2 border-white/10">
                  <Plus size={48} className="mx-auto mb-4 text-white/10" />
                  <h3 className="text-lg font-bold mb-2">Upload CSV to Begin</h3>
                  <p className="text-white/40 text-sm mb-8">Your data will be analyzed by the NLP engine before import</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors"
                  >
                    Select CSV File
                  </button>
                </div>
              )}
              
              {isProcessingImport && !importPreview && (
                <div className="glass rounded-3xl p-20 text-center">
                  <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                  <h3 className="text-lg font-bold mb-2">Analyzing Data...</h3>
                  <p className="text-white/40 text-sm">Gemini is mapping your leads to the 50 master categories</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>

      {/* Lead Detail Modal */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold">{selectedLead.name}</h2>
                      <p className="text-white/40 text-sm">{selectedLead.industry || 'Unknown Industry'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedLead(null)}
                    className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/20 hover:text-white"
                  >
                    <Plus size={24} className="rotate-45" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">GST Number</p>
                    <p className="text-sm font-mono">{selectedLead.gst_number || 'Not Available'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">PAN Number (Auto-Extracted)</p>
                    <p className="text-sm font-mono text-brand-primary">{selectedLead.pan_number || 'Processing...'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Location</p>
                    <p className="text-sm">{selectedLead.city}, {selectedLead.state || 'India'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Status</p>
                    <select 
                      value={selectedLead.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value as any;
                        if (supabase) {
                          await supabase.from('companies').update({ status: newStatus }).eq('id', selectedLead.id);
                          fetchLeads();
                          setSelectedLead({...selectedLead, status: newStatus});
                        }
                      }}
                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-brand-primary/50"
                    >
                      <option value="new">New</option>
                      <option value="warm-lead">Warm Lead</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="dormant-sme">Dormant SME</option>
                      <option value="disqualified">Disqualified</option>
                      <option value="invalid_data">Invalid Data</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Main Category</p>
                    <p className="text-sm font-bold text-brand-primary">{selectedLead.main_category || 'Uncategorized'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Sub-Category</p>
                    <p className="text-sm text-white/60">{selectedLead.sub_category || 'None'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Lead Score</p>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-primary" style={{ width: `${selectedLead.lead_score}%` }} />
                      </div>
                      <span className="text-sm font-bold">{selectedLead.lead_score}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Engagements</p>
                    <p className="text-sm font-bold text-brand-primary">{selectedLead.engagement_count || 0}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Quick Intelligence Actions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={async () => {
                        await trackEngagement(selectedLead.id);
                        window.open(`https://wa.me/?text=Hello ${selectedLead.name}, checking in regarding...`, '_blank');
                        fetchLeads();
                      }}
                      className="flex items-center justify-center gap-3 p-4 glass rounded-2xl hover:bg-brand-primary/10 hover:border-brand-primary/30 transition-all group"
                    >
                      <Phone size={18} className="text-brand-primary group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold">WhatsApp Link</span>
                    </button>
                    <button 
                      onClick={async () => {
                        await trackEngagement(selectedLead.id);
                        if (selectedLead.gst_number) {
                          navigator.clipboard.writeText(selectedLead.gst_number);
                          alert('GST Number copied for verification');
                        }
                        fetchLeads();
                      }}
                      className="flex items-center justify-center gap-3 p-4 glass rounded-2xl hover:bg-brand-primary/10 hover:border-brand-primary/30 transition-all group"
                    >
                      <ShieldCheck size={18} className="text-brand-primary group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold">Verify GST</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
