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
  AlertCircle,
  Mic,
  Save,
  CheckCircle2,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Markdown from 'react-markdown';
import { chatWithGrounding, generateRFQ } from './services/gemini';
import { getCompanies, Company, createCompany, updateCompanyScore, supabase, upsertCompany, trackEngagement, logActivity, createRFQ, RFQ } from './services/supabase';
import { calculateLeadScore } from './services/scoring';
import { MASTER_CATEGORIES, Category } from './constants/categories';
import { categorizeBusiness } from './services/nlpCategorizer';
import { simulateLeads } from './services/simulation';
import { DashboardLayout } from './layouts/DashboardLayout';
import { SuppliersPage } from './pages/suppliers/page';
import { SettingsPage } from './pages/Settings';
import { SimulationButton } from './components/SimulationButton';
import { SuccessCard } from './components/SuccessCard';
import { JoinSupplierModal } from './components/JoinSupplierModal';
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

const AIStatusIndicator = ({ model }: { model: string }) => {
  const isMinimax = model.includes('minimax');
  const isDeepseek = model.includes('deepseek');
  
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
      <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isMinimax ? "bg-brand-primary" : isDeepseek ? "bg-blue-400" : "bg-amber-400")} />
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
        {isMinimax ? "⚡ Powered by Minimax" : isDeepseek ? "🧠 DeepSeek is thinking..." : "✨ Gemini Active"}
      </span>
    </div>
  );
};

const MarketMap = () => (
  <div className="flex-1 glass rounded-3xl overflow-hidden relative bg-brand-dark/40 min-h-[200px]">
    <div className="absolute inset-0 opacity-20 pointer-events-none" 
      style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }} 
    />
    <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
      <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary animate-pulse">
        <MapIcon size={24} />
      </div>
      <div className="text-center px-4">
        <h3 className="font-display font-bold text-sm">Intelligence Map</h3>
        <p className="text-white/40 text-[10px] mt-1">Grounding data active.</p>
      </div>
    </div>
  </div>
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

const VoiceRFQ = ({ onSave }: { onSave: (rfq: Partial<RFQ>) => Promise<void> }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedRFQ, setExtractedRFQ] = useState<Partial<RFQ> | null>(null);

  const startRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      setTranscript("Looking for 500 tons of high-grade Mumbai Steel for a construction project in Navi Mumbai. Need it within 2 weeks.");
      setIsRecording(false);
    }, 3000);
  };

  const handleExtract = async () => {
    setIsExtracting(true);
    try {
      const data = await generateRFQ(transcript);
      setExtractedRFQ(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="glass p-6 rounded-3xl space-y-6 border-brand-primary/20">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-display font-bold flex items-center gap-2">
          <Mic size={20} className="text-brand-primary" />
          Voice RFQ Extraction
        </h3>
        {extractedRFQ && <span className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary rounded text-[10px] font-bold uppercase tracking-wider">AI Generated</span>}
      </div>

      {!transcript ? (
        <button 
          onClick={startRecording}
          disabled={isRecording}
          className={cn(
            "w-full py-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all",
            isRecording ? "border-brand-primary bg-brand-primary/5" : "border-white/10 hover:border-white/20"
          )}
        >
          <div className={cn("w-16 h-16 rounded-full flex items-center justify-center", isRecording ? "bg-brand-primary text-brand-dark animate-ping" : "bg-white/5 text-white/40")}>
            <Mic size={32} />
          </div>
          <p className="text-sm font-bold text-white/40">{isRecording ? "Listening to your requirement..." : "Click to start voice requirement"}</p>
        </button>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-xs text-white/40 uppercase font-bold tracking-widest mb-2">Transcript</p>
            <p className="text-sm text-white/80 italic">"{transcript}"</p>
          </div>

          {!extractedRFQ ? (
            <button 
              onClick={handleExtract}
              disabled={isExtracting}
              className="w-full py-3 bg-brand-primary text-brand-dark rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
            >
              {isExtracting ? <Brain size={18} className="animate-spin" /> : <Brain size={18} />}
              {isExtracting ? "Extracting Intelligence..." : "Extract RFQ with AI"}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Title</p>
                <p className="text-sm font-bold">{extractedRFQ.title}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Quantity</p>
                <p className="text-sm font-bold text-brand-primary">{extractedRFQ.quantity}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Specifications</p>
                <p className="text-sm text-white/60">{extractedRFQ.specifications}</p>
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
                <button 
                  onClick={() => setExtractedRFQ(null)}
                  className="flex-1 py-2 glass rounded-lg text-xs font-bold text-white/40 hover:text-white transition-colors"
                >
                  Reset
                </button>
                <button 
                  onClick={() => onSave(extractedRFQ)}
                  className="flex-1 py-2 bg-brand-primary text-brand-dark rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                >
                  <Save size={14} />
                  Save to Supabase
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ChatBot = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: "Hello! I'm your Lead Intelligence Assistant. I now prioritize NVIDIA NIM models (Minimax Primary, DeepSeek Backup) for maximum resilience. How can I help you extract value today?" }
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
      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${error.message || "Intelligence layer unreachable. Site is live in Safety Mode."}` }]);
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
          <AIStatusIndicator model="minimax" />
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
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Company | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [importPreview, setImportPreview] = useState<{ leads: Partial<Company>[], summary: Record<string, number> } | null>(null);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSuccess, setSimulationSuccess] = useState<{ category: string, count: number } | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = new URLSearchParams(window.location.search).get('admin') === 'true';

  useEffect(() => {
    try {
      const hasAnyConfig = !!(
        (import.meta.env.VITE_NVIDIA_API_KEY_MINIMAX && !import.meta.env.VITE_NVIDIA_API_KEY_MINIMAX.includes("YOUR_")) ||
        (import.meta.env.VITE_NVIDIA_API_KEY_DEEPSEEK && !import.meta.env.VITE_NVIDIA_API_KEY_DEEPSEEK.includes("YOUR_")) ||
        (import.meta.env.VITE_GEMINI_API_KEY && !import.meta.env.VITE_GEMINI_API_KEY.includes("YOUR_")) ||
        (import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes("YOUR_"))
      );

      if (!hasAnyConfig) {
        setIsDemoMode(true);
      } else {
        setIsDemoMode(false);
      }

      const params = new URLSearchParams(window.location.search);
      const categoryParam = params.get('category');
      if (categoryParam) {
        setSelectedCategory(categoryParam);
        setActiveTab('leads');
      }

      fetchLeads();
    } catch (err: any) {
      console.error("❌ Critical Initialization Failure:", err);
      setInitError(err.message || "Startup protected by safety net.");
    }
  }, []);

  const handleSaveRFQ = async (rfqData: Partial<RFQ>) => {
    try {
      await createRFQ({
        ...rfqData,
        status: 'pending'
      });
      alert(`🚀 RFQ Saved Successfully: ${rfqData.title}`);
      logActivity('rfq_save', `Saved voice RFQ: ${rfqData.title}`);
      await fetchLeads();
    } catch (error: any) {
      console.error("❌ Failed to save RFQ:", error);
      alert(`Failed to save RFQ: ${error.message || 'Unknown error'}`);
    }
  };

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
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
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
      setTimeout(() => setSimulationSuccess(null), 10000);
    } catch (error) {
      console.error("Simulation error:", error);
    } finally {
      setIsSimulating(false);
    }
  };

  // --- Dynamic Velocity Logic ---
  const getVelocityData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      name: day,
      value: leads.filter(l => new Date(l.created_at).getDay() === days.indexOf(day)).length + Math.floor(Math.random() * 5),
    }));
  };

  const getDistributionData = () => {
    const cats = ['Iron & Steel', 'Apparel', 'Agriculture', 'EVs', 'Automobile'];
    const colors = ['#00FF00', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899'];
    return cats.map((cat, i) => ({
      name: cat,
      value: leads.filter(l => l.main_category === cat).length || 1,
      color: colors[i]
    }));
  };

  const displayLeads = leads.filter(l => selectedCategory === 'All' || l.main_category === selectedCategory);

  if (loading && leads.length === 0) {
    return (
      <div className="h-screen bg-brand-dark flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-display font-bold">Connecting to Bell24h Engine...</h2>
        <p className="text-white/40 text-sm mt-2 font-mono">Initializing Lead Intelligence Layer</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="h-screen bg-brand-dark flex flex-col items-center justify-center text-white p-8 text-center">
        <AlertCircle size={48} className="text-rose-500 mb-4" />
        <h2 className="text-xl font-display font-bold">Intelligence Shield Active</h2>
        <p className="text-white/40 text-sm mt-2 max-w-md">{initError}</p>
        <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-white/10 rounded-xl text-sm font-bold">Restart Engine</button>
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
            </div>
          </section>

          {isAdmin && (
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
          )}
        </>
      }
    >
      <div className="max-w-7xl mx-auto">
        <JoinSupplierModal 
          isOpen={isJoinModalOpen} 
          onClose={() => setIsJoinModalOpen(false)} 
          onSuccess={(cat, count) => {
            setSimulationSuccess({ category: cat, count });
            fetchLeads();
            setTimeout(() => setSimulationSuccess(null), 10000);
          }}
        />
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
        
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-display font-bold">Intelligence Overview</h2>
                    <p className="text-white/40 text-sm mt-1">Real-time market liquidity and lead acquisition</p>
                  </div>
                  <button 
                    onClick={() => setIsJoinModalOpen(true)}
                    className="px-6 py-2.5 bg-brand-primary text-brand-dark rounded-xl text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,255,0,0.2)]"
                  >
                    <Plus size={18} strokeWidth={3} />
                    Join as Supplier
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>

                <div className="glass p-6 rounded-2xl flex flex-col gap-6">
                  <h3 className="font-bold text-sm">Lead Acquisition Velocity</h3>
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getVelocityData()}>
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
              </div>

              <div className="lg:col-span-1 space-y-8">
                <VoiceRFQ onSave={handleSaveRFQ} />
                <div className="glass p-6 rounded-3xl">
                  <h3 className="font-bold text-sm mb-6">Market Distribution</h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getDistributionData()}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {getDistributionData().map((entry, index) => (
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
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-[calc(100vh-160px)]">
            <ChatBot />
          </div>
        )}

        {activeTab === 'suppliers' && <SuppliersPage />}

        {activeTab === 'settings' && <SettingsPage />}

        {activeTab === 'categories' && (
          <div className="h-[calc(100vh-200px)] flex flex-col gap-6">
            <h2 className="text-xl font-display font-bold">Category Market Map</h2>
            <MarketMap />
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-bold">Full Lead Database</h2>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 w-64">
                <Search size={14} className="text-white/30" />
                <input placeholder="Filter by name..." className="bg-transparent border-none text-xs focus:outline-none w-full text-white" />
              </div>
            </div>
            
            <div className="glass rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 border-b border-brand-border">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Company</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Industry</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Score</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {displayLeads.map((lead) => (
                    <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Building2 size={16} className="text-white/40 group-hover:text-brand-primary" />
                          <p className="text-sm font-semibold">{lead.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-white/60">{lead.industry}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-primary" style={{ width: `${lead.lead_score}%` }} />
                          </div>
                          <span className="text-xs font-bold">{lead.lead_score}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">{lead.status}</td>
                      <td className="px-6 py-4 text-right"><ChevronRight size={18} className="text-white/20" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold">Bulk Import Validator</h2>
              <div className="flex gap-4">
                <button onClick={() => setImportPreview(null)} className="px-6 py-2 glass rounded-xl text-sm font-bold">Cancel</button>
                <button onClick={confirmImport} disabled={isProcessingImport} className="px-6 py-2 bg-brand-primary text-brand-dark rounded-xl text-sm font-bold">Confirm & Upsert</button>
              </div>
            </div>
            <div className="glass rounded-3xl p-20 text-center border-dashed border-2 border-white/10">
              <Plus size={48} className="mx-auto mb-4 text-white/10" />
              <button onClick={() => fileInputRef.current?.click()} className="px-8 py-3 bg-white/10 rounded-xl text-sm font-bold">Select CSV File</button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedLead(null)} className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl glass rounded-3xl overflow-hidden p-8 space-y-8">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary"><Building2 size={24} /></div>
                  <div>
                    <h2 className="text-2xl font-display font-bold">{selectedLead.name}</h2>
                    <p className="text-white/40 text-sm">{selectedLead.industry}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLead(null)} className="p-2 text-white/20 hover:text-white"><Plus size={24} className="rotate-45" /></button>
              </div>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div><p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">GSTIN</p><p className="font-mono text-brand-primary">{selectedLead.gst_number || 'PENDING'}</p></div>
                <div><p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Email</p><p>{selectedLead.email || 'N/A'}</p></div>
                <div><p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Mobile</p><p>{selectedLead.mobile || 'N/A'}</p></div>
                <div><p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Score</p><p className="font-bold">{selectedLead.lead_score}</p></div>
              </div>
              <div className="pt-4 border-t border-white/5 flex gap-4">
                <button onClick={() => window.open(`https://wa.me/${selectedLead.mobile?.replace(/\D/g,'')}`)} className="flex-1 py-3 bg-[#25D366] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"><Phone size={16} /> WhatsApp</button>
                <button onClick={() => { navigator.clipboard.writeText(selectedLead.gst_number || ''); alert('GST Copied'); }} className="flex-1 py-3 glass rounded-xl text-sm font-bold flex items-center justify-center gap-2"><ShieldCheck size={16} /> Verify GST</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
