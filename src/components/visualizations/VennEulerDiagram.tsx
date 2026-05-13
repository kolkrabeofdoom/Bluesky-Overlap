import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface VennEulerDiagramProps {
  accounts: { profile: any }[];
  membershipCounts: Record<string, number>;
  type: 'venn' | 'euler';
}

export default function VennEulerDiagram({ accounts, membershipCounts, type }: VennEulerDiagramProps) {
  const n = accounts.length;

  const circles = useMemo(() => {
    if (n === 2) {
      return [
        { x: 35, y: 50, r: 25, color: '#3b82f6', label: accounts[0].profile.handle.split('.')[0] },
        { x: 65, y: 50, r: 25, color: '#6366f1', label: accounts[1].profile.handle.split('.')[0] },
      ];
    } else if (n === 3) {
      return [
        { x: 50, y: 35, r: 25, color: '#3b82f6', label: accounts[0].profile.handle.split('.')[0] },
        { x: 35, y: 65, r: 25, color: '#6366f1', label: accounts[1].profile.handle.split('.')[0] },
        { x: 65, y: 65, r: 25, color: '#8b5cf6', label: accounts[2].profile.handle.split('.')[0] },
      ];
    } else {
        // Fallback for 4+ sets: Circular arrangement
        return accounts.map((acc, i) => {
            const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
            const dist = 25;
            return {
                x: 50 + Math.cos(angle) * dist,
                y: 50 + Math.sin(angle) * dist,
                r: 20,
                color: `hsl(${i * (360 / n)}, 70%, 60%)`,
                label: acc.profile.handle.split('.')[0]
            };
        });
    }
  }, [n, accounts]);

  // Helper to find count for a specific bitmask
  const getCount = (indices: number[]) => {
      const key = indices.sort((a,b) => a-b).join(',');
      return membershipCounts[key] || 0;
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-inner border border-slate-100 min-h-[500px]">
      <svg viewBox="0 0 100 100" className="w-full max-w-[500px] drop-shadow-2xl">
        <defs>
          {circles.map((c, i) => (
            <radialGradient key={i} id={`grad-${i}`} cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="white" stopOpacity="0.2" />
              <stop offset="100%" stopColor="black" stopOpacity="0.1" />
            </radialGradient>
          ))}
        </defs>
        
        {/* Circles */}
        {circles.map((c, i) => (
          <g key={i}>
            <motion.circle
              cx={c.x}
              cy={c.y}
              r={c.r}
              fill={c.color}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.4, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="mix-blend-multiply cursor-help"
            />
            <circle
              cx={c.x}
              cy={c.y}
              r={c.r}
              fill={`url(#grad-${i})`}
              className="mix-blend-overlay pointer-events-none"
            />
            <motion.text
              x={c.x}
              y={c.y - c.r - 2}
              textAnchor="middle"
              className="text-[3px] font-black uppercase tracking-widest fill-slate-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              {c.label}
            </motion.text>
          </g>
        ))}

        {/* Counts in intersections (Simple heuristic for 2 and 3) */}
        {n === 2 && (
            <>
                <text x="30" y="50" textAnchor="middle" className="text-[4px] font-black fill-white shadow-sm">{getCount([0])}</text>
                <text x="70" y="50" textAnchor="middle" className="text-[4px] font-black fill-white shadow-sm">{getCount([1])}</text>
                <text x="50" y="50" textAnchor="middle" className="text-[4px] font-black fill-white shadow-sm">{getCount([0,1])}</text>
            </>
        )}
        {n === 3 && (
            <>
                <text x="50" y="30" textAnchor="middle" className="text-[3px] font-black fill-white">{getCount([0])}</text>
                <text x="30" y="70" textAnchor="middle" className="text-[3px] font-black fill-white">{getCount([1])}</text>
                <text x="70" y="70" textAnchor="middle" className="text-[3px] font-black fill-white">{getCount([2])}</text>
                
                {/* Intersections */}
                <text x="40" y="50" textAnchor="middle" className="text-[3px] font-black fill-white">{getCount([0,1])}</text>
                <text x="60" y="50" textAnchor="middle" className="text-[3px] font-black fill-white">{getCount([0,2])}</text>
                <text x="50" y="70" textAnchor="middle" className="text-[3px] font-black fill-white">{getCount([1,2])}</text>
                <text x="50" y="58" textAnchor="middle" className="text-[3px] font-black fill-white">{getCount([0,1,2])}</text>
            </>
        )}
      </svg>
      
      <div className="mt-8 flex flex-wrap justify-center gap-4">
          {accounts.map((acc, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: circles[i]?.color }}></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{acc.profile.handle}</span>
              </div>
          ))}
      </div>
      
      <div className="mt-4 p-4 border-t border-slate-100 w-full text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              {type === 'venn' ? 'Venn-Diagramm: Alle theoretischen Bereiche' : 'Euler-Diagramm: Relative Größen (In Bearbeitung)'}
          </p>
      </div>
    </div>
  );
}
