import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { motion } from 'motion/react';
import { format, parseISO, startOfMonth, startOfYear } from 'date-fns';

interface TemporalAnalysisProps {
  mutualFollowers: any[];
}

export default function TemporalAnalysis({ mutualFollowers }: TemporalAnalysisProps) {
  // Filter for followers that actually have a createdAt timestamp
  const datedFollowers = mutualFollowers.filter(f => f.createdAt);

  if (datedFollowers.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-slate-100 shadow-inner min-h-[500px]">
        <div className="text-slate-300 mb-4">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center max-w-xs">
          Keine Zeitdaten verfügbar. Die Erstellungsdaten werden nur für die ersten 100 gemeinsamen Follower abgerufen.
        </p>
      </div>
    );
  }

  // Group by month
  const groupedData: Record<string, number> = {};
  datedFollowers.forEach(f => {
    try {
        const date = parseISO(f.createdAt);
        const key = format(startOfMonth(date), 'yyyy-MM');
        groupedData[key] = (groupedData[key] || 0) + 1;
    } catch (e) {
        console.error("Date parsing error", e);
    }
  });

  const chartData = Object.entries(groupedData)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Detect spikes
  const average = chartData.reduce((acc, curr) => acc + curr.count, 0) / (chartData.length || 1);
  const spikes = chartData.filter(d => d.count > average * 2.5);

  return (
    <div className="w-full h-full flex flex-col gap-6 bg-white p-6 rounded-xl border border-slate-100 shadow-inner min-h-[450px]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 border border-blue-100">
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-1 block">Profile</span>
            <span className="text-2xl font-black text-blue-600">{datedFollowers.length}</span>
        </div>
        <div className="bg-indigo-50 p-4 border border-indigo-100">
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1 block">Zeitspanne</span>
            <span className="text-base font-black text-indigo-600">
                {chartData.length > 0 ? `${chartData[0].date} - ${chartData[chartData.length-1].date}` : 'N/A'}
            </span>
        </div>
        <div className="bg-red-50 p-4 border border-red-100">
            <span className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-1 block">Wellen</span>
            <span className="text-2xl font-black text-red-600">{spikes.length}</span>
        </div>
      </div>

      <div className="flex-1 min-h-[250px] flex flex-col">
        <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">Account-Erstellung (Overlap)</h4>
        <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis 
                        tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ fontWeight: 'black', color: '#0f172a', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={entry.count > average * 2.5 ? '#ef4444' : '#3b82f6'} 
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-50 p-6 border border-slate-200">
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong className="text-slate-900 uppercase text-[10px] tracking-widest block mb-1">Forensik-Hinweis:</strong>
          Rote Balken markieren Zeiträume, in denen ungewöhnlich viele Accounts aus dem Overlap erstellt wurden. 
          Dies kann auf koordinierte Bot-Kampagnen oder spezifische Werbe-Events hindeuten.
        </p>
      </div>
    </div>
  );
}
