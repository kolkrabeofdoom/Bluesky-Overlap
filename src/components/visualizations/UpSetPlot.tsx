import React from 'react';
import { motion } from 'motion/react';

interface UpSetPlotProps {
  accounts: { profile: any }[];
  intersections: { name: string; count: number; membership: number[] }[];
}

export default function UpSetPlot({ accounts, intersections }: UpSetPlotProps) {
  const maxCount = Math.max(...intersections.map(d => d.count));
  const sortedIntersections = [...intersections].sort((a, b) => b.count - a.count).slice(0, 15);

  return (
    <div className="w-full h-full p-8 bg-white rounded-xl shadow-inner border border-slate-100 flex flex-col min-h-[500px]">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Bar Chart Part */}
        <div className="h-2/3 flex items-end gap-2 px-32 pb-4">
          {sortedIntersections.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center group relative">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(d.count / maxCount) * 100}%` }}
                className="w-full bg-blue-500 rounded-t-sm group-hover:bg-blue-600 transition-colors"
              />
              <div className="absolute -top-6 text-[10px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {d.count.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Matrix Part */}
        <div className="h-1/3 flex flex-col gap-2 mt-4">
          {accounts.map((acc, accIdx) => (
            <div key={accIdx} className="flex items-center gap-4 h-6">
              <div className="w-28 text-[10px] font-black uppercase text-slate-400 tracking-widest truncate text-right">
                {acc.profile.handle.split('.')[0]}
              </div>
              <div className="flex-1 flex gap-2 h-full">
                {sortedIntersections.map((d, interIdx) => {
                  const isMember = d.membership.includes(accIdx);
                  return (
                    <div key={interIdx} className="flex-1 flex items-center justify-center relative">
                      <div className={cn(
                        "w-3 h-3 rounded-full transition-all duration-300",
                        isMember ? "bg-slate-900 scale-110" : "bg-slate-100"
                      )} />
                      {/* Vertical connector if member */}
                      {isMember && (
                          <div className="absolute top-0 w-0.5 h-full bg-slate-900 -z-10" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              UpSet-Plot: Mengenbeziehungen in der Matrix-Darstellung
          </p>
      </div>
    </div>
  );
}

// Utility to merge classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
