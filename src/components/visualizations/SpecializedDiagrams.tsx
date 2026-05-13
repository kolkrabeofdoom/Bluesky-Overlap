import React from 'react';
import { motion } from 'motion/react';

interface SpecializedDiagramProps {
  accounts: { profile: any }[];
  membershipCounts: Record<string, number>;
  type: 'edwards' | 'johnston' | 'kv';
}

export default function SpecializedDiagrams({ accounts, membershipCounts, type }: SpecializedDiagramProps) {
  const n = accounts.length;

  const getCount = (indices: number[]) => {
      const key = indices.sort((a,b) => a-b).join(',');
      return membershipCounts[key] || 0;
  };

  if (type === 'kv') {
    const rows = n >= 4 ? 4 : 2;
    const cols = n === 3 ? 4 : 2;

    // Helper to get count by bitmask
    const getCountByMask = (mask: number) => {
        // Convert mask to indices
        const indices: number[] = [];
        for (let j = 0; j < n; j++) {
            if ((mask >> j) & 1) indices.push(j);
        }
        if (indices.length === 0) return 0;
        return getCount(indices);
    };

    // Gray code for KV indexing (to keep adjacent cells differing by 1 bit)
    const grayCode = [0, 1, 3, 2];

    return (
      <div className="w-full h-full p-8 bg-white rounded-xl shadow-inner border border-slate-100 flex flex-col items-center justify-center min-h-[500px]">
        <div className="relative p-8">
            {/* Axis Labels */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase text-blue-500 tracking-widest">
                {n >= 2 ? accounts[1].profile.handle.split('.')[0] : ''} {n >= 3 ? `& ${accounts[2].profile.handle.split('.')[0]}` : ''}
            </div>
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -rotate-90 text-[10px] font-black uppercase text-indigo-500 tracking-widest">
                {accounts[0].profile.handle.split('.')[0]} {n >= 4 ? `& ${accounts[3].profile.handle.split('.')[0]}` : ''}
            </div>

            <div className="grid gap-px bg-slate-900 border-2 border-slate-900 shadow-2xl">
                {Array.from({ length: rows }).map((_, r) => (
                    <div key={r} className="flex gap-px">
                        {Array.from({ length: cols }).map((_, c) => {
                            // Map r, c to bitmask
                            // Row bits: A (bit 0), D (bit 3)
                            // Col bits: B (bit 1), C (bit 2)
                            let mask = 0;
                            if (n >= 1) mask |= (r % 2) << 0;
                            if (n >= 2) mask |= (c % 2) << 1;
                            if (n === 3) mask |= (Math.floor(c / 2)) << 2;
                            if (n >= 4) mask |= (Math.floor(r / 2)) << 3;
                            
                            const count = getCountByMask(mask);
                            
                            return (
                                <div key={c} className="bg-white w-24 h-24 p-4 flex flex-col items-center justify-center group hover:bg-blue-50 transition-colors">
                                    <span className="text-[7px] font-black text-slate-300 uppercase tracking-tighter mb-2">
                                        {mask.toString(2).padStart(n, '0')}
                                    </span>
                                    <span className={cn("text-xl font-black transition-colors", count > 0 ? "text-slate-900" : "text-slate-200")}>
                                        {count > 0 ? count.toLocaleString() : '0'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
        <p className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">KV-Diagramm: Logische Minterm-Matrix (Echtzeit-Daten)</p>
      </div>
    );
  }

  if (type === 'edwards') {
    // Edwards-Venn (The gear shape)
    return (
      <div className="w-full h-full p-8 bg-white rounded-xl shadow-inner border border-slate-100 flex flex-col items-center justify-center min-h-[500px]">
        <svg viewBox="0 0 100 100" className="w-full max-w-[500px] overflow-visible">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2 2" />
            
            {Array.from({ length: Math.max(n, 4) }).map((_, i) => (
                <g key={i}>
                    <motion.path
                        d="M 50 50 Q 70 30 90 50 Q 70 70 50 50"
                        fill={`hsl(${i * 45}, 70%, 60%)`}
                        fillOpacity="0.2"
                        stroke={`hsl(${i * 45}, 70%, 50%)`}
                        strokeWidth="0.5"
                        initial={{ rotate: i * 45, scale: 0 }}
                        animate={{ rotate: i * 45, scale: 1 }}
                        style={{ originX: '50px', originY: '50px' }}
                        className="mix-blend-multiply"
                    />
                    {i < n && (
                        <text 
                            transform={`rotate(${i * 45 + 22.5} 50 50) translate(0 -35)`} 
                            x="50" y="50" 
                            textAnchor="middle" 
                            className="text-[2px] font-black fill-slate-400 uppercase tracking-widest"
                        >
                            {accounts[i].profile.handle.split('.')[0]}
                        </text>
                    )}
                </g>
            ))}
            
            <text x="50" y="52" textAnchor="middle" className="text-[4px] font-black fill-slate-900 uppercase tracking-[0.2em]">
                {getCount(Array.from({length: n}, (_, i) => i)).toLocaleString()}
            </text>
            <text x="50" y="56" textAnchor="middle" className="text-[2px] font-bold fill-slate-400 uppercase tracking-widest">Total Mutual</text>
        </svg>
        <p className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Edwards-Venn: Symmetrische Mengen-Abbildung</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-8 bg-white rounded-xl shadow-inner border border-slate-100 flex flex-col items-center justify-center min-h-[500px]">
       <div className="relative w-full max-w-[500px] aspect-square border-2 border-slate-900 bg-slate-50 flex items-center justify-center p-8">
          <div className="absolute top-4 left-4 text-[10px] font-black uppercase text-slate-900 tracking-widest">Universe (All Users)</div>
          <div className="w-full h-full border-2 border-slate-900 flex items-center justify-center bg-white shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                  <div className="border border-slate-100 flex items-center justify-center p-4">
                      <span className="text-[8px] font-bold text-slate-300">A'B'</span>
                  </div>
                  <div className="border border-slate-100 bg-blue-50 flex flex-col items-center justify-center p-4">
                      <span className="text-[8px] font-bold text-blue-400 mb-1">A ∩ B'</span>
                      <span className="text-sm font-black text-blue-600">{n >= 1 ? getCount([0]).toLocaleString() : 0}</span>
                  </div>
                  <div className="border border-slate-100 bg-indigo-50 flex flex-col items-center justify-center p-4">
                      <span className="text-[8px] font-bold text-indigo-400 mb-1">A' ∩ B</span>
                      <span className="text-sm font-black text-indigo-600">{n >= 2 ? getCount([1]).toLocaleString() : 0}</span>
                  </div>
                  <div className="border border-slate-100 bg-blue-500 flex flex-col items-center justify-center p-4">
                      <span className="text-[8px] font-bold text-white/50 mb-1">A ∩ B</span>
                      <span className="text-lg font-black text-white">{n >= 2 ? getCount([0, 1]).toLocaleString() : 0}</span>
                  </div>
              </div>
          </div>
       </div>
       <p className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Johnston-Diagramm: Visuelle Prädikatenlogik (2-Mengen Fokus)</p>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
