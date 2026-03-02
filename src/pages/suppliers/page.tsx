import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';

export default function SuppliersPage() {
  const [liquidity, setLiquidity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLiquidity() {
      try {
        if (!supabase) {
          console.warn("Supabase not connected. Cannot fetch category_liquidity.");
          setLoading(false);
          return;
        }
        
        // Fetch from the category_liquidity view
        // If the view doesn't exist yet, this will fail gracefully
        const { data, error } = await supabase
          .from('category_liquidity')
          .select('*');
          
        if (error) {
          console.error("Error fetching category_liquidity:", error);
          // Fallback to counting from companies table if view doesn't exist
          const { data: companiesData } = await supabase.from('companies').select('main_category');
          if (companiesData) {
            const counts = companiesData.reduce((acc: any, curr: any) => {
              const cat = curr.main_category || 'Uncategorized';
              acc[cat] = (acc[cat] || 0) + 1;
              return acc;
            }, {});
            
            const formattedData = Object.keys(counts).map(cat => ({
              category: cat,
              lead_count: counts[cat]
            }));
            setLiquidity(formattedData);
          }
        } else if (data) {
          setLiquidity(data);
        }
      } catch (err) {
        console.error("Failed to fetch liquidity:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLiquidity();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-display font-bold">Loading Suppliers...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-display font-bold mb-2">Verified Suppliers</h1>
        <p className="text-white/60 mb-12">Real-time market liquidity across 50 master categories.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liquidity.length > 0 ? (
            liquidity.map((item, index) => (
              <div key={index} className="glass p-6 rounded-2xl border border-white/5 hover:border-brand-primary/30 transition-colors">
                <h3 className="text-lg font-bold mb-2">{item.category}</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                  <span className="text-brand-primary font-mono text-sm">
                    {item.lead_count > 0 ? `${item.lead_count} Verified Suppliers` : 'Seeking Suppliers'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 glass rounded-2xl">
              <p className="text-white/40">No supplier data available. Run the simulation engine to generate liquidity.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
