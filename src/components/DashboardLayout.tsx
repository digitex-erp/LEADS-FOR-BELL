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
  PieChart
} from 'lucide-react';
import { cn } from '../lib/utils'; // Assuming I'll add this or use the one in App.tsx

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
              <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
              <SidebarItem icon={MessageSquare} label="Intelligence Engine" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
              <SidebarItem icon={Building2} label="Leads" active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} />
              <SidebarItem icon={PieChart} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
            </nav>
          </section>

          {sidebarContent}

          <section>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-3 mb-2">Data Operations</p>
            <nav className="space-y-1">
              <SidebarItem icon={Plus} label="Import Center" active={activeTab === 'import-center'} onClick={() => setActiveTab('import-center')} />
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-brand-dark/50 p-8 scrollbar-hide">
        {children}
      </main>
    </div>
  );
};
