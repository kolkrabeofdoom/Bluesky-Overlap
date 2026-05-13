import React from 'react';
import { cn } from '../lib/utils';
import { VizType } from '../App';
import { 
  CircleDot, 
  Orbit, 
  Grid3X3, 
  ListTree, 
  LayoutGrid, 
  Activity,
  Layers
} from 'lucide-react';

interface VisualizationSelectorProps {
  activeType: VizType;
  onChange: (type: VizType) => void;
}

const vizOptions: { type: VizType; label: string; description: string; icon: any }[] = [
  { 
    type: 'venn', 
    label: 'Venn-Diagramm', 
    description: 'Klassische Überlappungen aller Mengen.',
    icon: CircleDot
  },
  { 
    type: 'euler', 
    label: 'Euler-Diagramm', 
    description: 'Nur tatsächlich vorhandene Beziehungen.',
    icon: Orbit
  },
  { 
    type: 'edwards', 
    label: 'Edwards-Venn', 
    description: 'Symmetrische Darstellung für viele Mengen.',
    icon: Activity
  },
  { 
    type: 'johnston', 
    label: 'Johnston', 
    description: 'Logische Prüfung von Schnittmengen.',
    icon: Layers
  },
  { 
    type: 'upset', 
    label: 'UpSet-Plot', 
    description: 'Matrix-Darstellung für große Datensätze.',
    icon: ListTree
  },
  { 
    type: 'kv', 
    label: 'KV-Diagramm', 
    description: 'Tabellarische Optimierung logischer Funktionen.',
    icon: Grid3X3
  },
  { 
    type: 'mosaic', 
    label: 'Mosaic-Plot', 
    description: 'Proportionale Rechteck-Darstellung.',
    icon: LayoutGrid
  }
];

export default function VisualizationSelector({ activeType, onChange }: VisualizationSelectorProps) {
  return (
    <div className="flex flex-col gap-px bg-slate-200 border-b border-slate-200">
      <div className="bg-white px-6 md:px-10 py-4">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Visualisierungsmodus wählen</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-px">
        {vizOptions.map((opt) => {
          const Icon = opt.icon;
          const isActive = activeType === opt.type;
          return (
            <button
              key={opt.type}
              onClick={() => onChange(opt.type)}
              className={cn(
                "group relative p-6 flex flex-col items-center gap-3 transition-all duration-300",
                isActive 
                  ? "bg-blue-600 text-white" 
                  : "bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon size={24} className={cn("transition-transform group-hover:scale-110", isActive ? "text-white" : "text-blue-500")} />
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-black uppercase tracking-tight text-center">{opt.label}</span>
                {isActive && (
                    <motion-div layoutId="active-viz" className="absolute bottom-0 left-0 w-full h-1 bg-white/30" />
                )}
              </div>
              
              {/* Tooltip on hover */}
              {!isActive && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center shadow-xl">
                  {opt.description}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
