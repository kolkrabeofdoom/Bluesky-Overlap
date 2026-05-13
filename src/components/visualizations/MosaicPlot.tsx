import React from 'react';
import { motion } from 'motion/react';

interface MosaicPlotProps {
  intersections: { name: string; count: number; membership: number[] }[];
}

export default function MosaicPlot({ intersections }: MosaicPlotProps) {
  const total = intersections.reduce((sum, d) => sum + d.count, 0);
  const sorted = [...intersections].sort((a, b) => b.count - a.count);

  let currentX = 0;

  return (
    <div className="w-full h-full p-8 bg-white rounded-xl shadow-inner border border-slate-100 flex flex-col min-h-[500px]">
      <div className="flex-1 w-full bg-slate-50 rounded-lg overflow-hidden flex shadow-inner">
        {sorted.map((d, i) => {
          const width = (d.count / total) * 100;
          if (width < 0.5) return null; // Skip tiny segments

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: `${width}%` }}
              className="h-full border-r border-white/20 relative group overflow-hidden"
              style={{ backgroundColor: `hsl(${i * (360 / sorted.length)}, 60%, 50%)` }}
            >
              <div className="absolute inset-0 flex items-center justify-center p-2 text-center pointer-events-none">
                {width > 5 && (
                  <span className="text-[10px] font-black text-white/90 uppercase tracking-tighter leading-none break-all">
                    {d.name}
                  </span>
                )}
              </div>
              
              {/* Tooltip */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-help flex flex-col items-center justify-center p-4">
                  <div className="bg-white p-4 shadow-2xl rounded text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{d.name}</p>
                      <p className="text-xl font-black text-slate-900">{d.count.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">{((d.count / total) * 100).toFixed(1)}%</p>
                  </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Mosaic-Plot: Proportionale Flächenverteilung der Schnittmengen
          </p>
      </div>
    </div>
  );
}
