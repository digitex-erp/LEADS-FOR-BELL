import React, { useState, useEffect } from 'react';
import { Database, TrendingUp, AlertCircle, ShoppingCart, Users, Search } from 'lucide-react';
import { supabase } from '../../services/supabase';

interface CategoryLiquidity {
  category: string;
  count: number;
  liquidity_score: number;
  avg_score: number;
}

export const SuppliersPage = () => {
  const [data, setData] = useState<CategoryLiquidity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLiquidity = async () => {
      setLoading(true);
      try {
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }

        const { data: result, error } = await supabase
          .from('category_liquidity')
          .select('*');

        if (error) {
          console.error('Error fetching liquidity:', error);
          setError(error.message);
        } else if (result) {
          setData(result);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchLiquidity();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold">Supplier Intelligence</h2>
          <p className="text-white/40 text-sm mt-1">Cross-category market liquidity and supplier availability</p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 w-64">
            <Search size={14} className="text-white/30" />
            <input 
              placeholder="Search categories..." 
              className="bg-transparent border-none text-xs focus:outline-none w-full placeholder:text-white/20"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl">
          <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white/40 text-sm font-mono animate-pulse">Scanning liquidity views...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl text-center space-y-4">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary">
            <Database size={32} />
          </div>
          <h3 className="text-xl font-bold">Seeking Suppliers</h3>
          <p className="text-white/40 max-w-sm mx-auto">No liquidity data found for the current categories. New leads may be required to activate the marketplace.</p>
          <button className="px-6 py-2 bg-brand-primary text-brand-dark rounded-xl text-sm font-bold hover:scale-105 transition-transform">
            Simulate Market
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((item) => (
            <div key={item.category} className="glass p-6 rounded-2xl flex flex-col gap-4 group hover:bg-white/5 transition-colors border-l-2 border-brand-primary">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{item.category}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Market Depth:</span>
                    <span className="text-[10px] font-bold text-brand-primary">{item.count} Leads</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
                  <TrendingUp size={20} />
                </div>
              </div>
              
              <div className="mt-2 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/60">Liquidity Score</span>
                  <span className="text-xs font-bold">{item.liquidity_score}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-primary transition-all duration-1000" 
                    style={{ width: `${item.liquidity_score}%` }} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-white/5 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Avg Quality</p>
                  <p className="text-sm font-bold">{item.avg_score.toFixed(1)}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Potential</p>
                  <p className="text-sm font-bold text-brand-primary">High</p>
                </div>
              </div>

              <button className="w-full mt-2 py-2 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                <ShoppingCart size={14} />
                View Leads
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-200 text-sm">
          <AlertCircle size={18} />
          <p>Error loading liquidity data: {error}. Make sure the <strong>category_liquidity</strong> view is created in your database.</p>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;
