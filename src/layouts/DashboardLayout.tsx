import React from 'react';
import { 
  TrendingUp, 
  MessageSquare, 
  Building2, 
  Users, 
  Plus, 
  ShieldCheck, 
  AlertCircle, 
  Settings,
  Database,
  LayoutDashboard,
  PieChart,
  Layers,
  Bell
} from 'lucide-react';
import { cn } from '../lib/utils';
import { LiveTicker } from '../components/LiveTicker';

interface SidebarItemProps {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => (
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

interface DashboardLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
  sidebarContent?: React.ReactNode;
}

export const DashboardLayout = ({ activeTab, setActiveTab, children, sidebarContent }: DashboardLayoutProps) => {
  return (
    <div className="flex h-screen bg-brand-dark text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-brand-border flex flex-col p-4 gap-6 bg-brand-dark z-20">
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
              <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
              <SidebarItem icon={Building2} label="Leads" active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} />
              <SidebarItem icon={Layers} label="Categories" active={activeTab === 'categories'} onClick={() => setActiveTab('categories')} />
              <SidebarItem icon={Plus} label="Import" active={activeTab === 'import'} onClick={() => setActiveTab('import')} />
              <SidebarItem icon={PieChart} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
            </nav>
          </section>

          {sidebarContent}

          <section>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-3 mb-2">Intelligence</p>
            <nav className="space-y-1">
              <SidebarItem icon={MessageSquare} label="AI Engine" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
              <SidebarItem icon={Database} label="Suppliers" active={activeTab === 'suppliers'} onClick={() => setActiveTab('suppliers')} />
            </nav>
          </section>
          
          <section className="mt-auto">
            <nav className="space-y-1">
              <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            </nav>
          </section>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,0,0.02),transparent)] pointer-events-none" />
        
        {/* Header */}
        <header className="h-16 border-b border-brand-border bg-brand-dark/30 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <LiveTicker />
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/5 rounded-xl transition-colors relative">
              <Bell size={20} className="text-white/40" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-primary rounded-full border-2 border-brand-dark" />
            </button>
            <div className="h-8 w-[1px] bg-brand-border mx-2" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-primary/40 border border-brand-primary/30" />
              <span className="text-xs font-bold">Admin Node 01</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-brand-dark/50 p-8 scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  );
};
