import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Info, Zap, Shield, Search, BarChart3, Users, Clock } from 'lucide-react';

interface HelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpOverlay({ isOpen, onClose }: HelpOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-900/80 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-4xl max-h-[90vh] bg-white rounded-none border-4 border-slate-900 shadow-[20px_20px_0px_0px_rgba(15,23,42,1)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b-4 border-slate-900 flex justify-between items-center bg-blue-500 text-white">
              <div className="flex items-center gap-3">
                <Info size={24} strokeWidth={3} />
                <h2 className="text-xl font-black uppercase tracking-tighter">System-Dokumentation & Hilfe</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/20 transition-colors border-2 border-white"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 bg-white">
              
              {/* Introduction */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <Zap size={20} fill="currentColor" />
                  <h3 className="text-sm font-black uppercase tracking-[0.2em]">Grundlagen</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                  Der <strong>Bluesky Overlap Analyzer</strong> ist ein forensisches Werkzeug zur Analyse von sozialen Netzwerken. 
                  Er identifiziert Schnittmengen zwischen Follower-Listen, erkennt koordinierte Verhaltensmuster und visualisiert 
                  Community-Strukturen durch mathematische Diagramme.
                </p>
              </section>

              {/* Diagrams */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 text-indigo-600">
                  <BarChart3 size={20} />
                  <h3 className="text-sm font-black uppercase tracking-[0.2em]">Visualisierungs-Modi</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-black uppercase text-slate-900 tracking-widest border-l-4 border-blue-500 pl-2">Venn & Euler</h4>
                    <p className="text-[12px] text-slate-500 leading-relaxed">
                      Die klassischen Mengen-Diagramme. Venn zeigt alle theoretischen Überschneidungen, 
                      während Euler leere Mengen ausblendet, um die Übersichtlichkeit zu erhöhen.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-black uppercase text-slate-900 tracking-widest border-l-4 border-indigo-500 pl-2">Edwards-Venn</h4>
                    <p className="text-[12px] text-slate-500 leading-relaxed">
                      Eine zahnradförmige, symmetrische Darstellung. Besonders nützlich bei 4+ Accounts, 
                      da sie komplexe Schnittmengen topologisch präzise abbildet.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-black uppercase text-slate-900 tracking-widest border-l-4 border-slate-900 pl-2">UpSet-Plot</h4>
                    <p className="text-[12px] text-slate-500 leading-relaxed">
                      Matrix-basierte Ansicht. Ideal für große Datenmengen. Jede Zeile im unteren Bereich 
                      entspricht einer spezifischen Kombination von Accounts.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-black uppercase text-slate-900 tracking-widest border-l-4 border-emerald-500 pl-2">KV-Diagramm</h4>
                    <p className="text-[12px] text-slate-500 leading-relaxed">
                      Karnaugh-Veitch-Diagramme zeigen die logische Verteilung als Binär-Matrix. 
                      Perfekt für die Analyse von "Mintermen" in Follower-Strukturen.
                    </p>
                  </div>
                </div>
              </section>

              {/* Forensics */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 text-red-600">
                  <Shield size={20} />
                  <h3 className="text-sm font-black uppercase tracking-[0.2em]">Forensische Funktionen</h3>
                </div>

                <div className="space-y-8">
                  <div className="flex gap-4 p-4 bg-slate-50 border-l-4 border-red-500">
                    <Clock className="text-red-500 shrink-0" size={24} />
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-slate-900">Zeitliche Analyse & Bot-Waves</h4>
                      <p className="text-[12px] text-slate-500 leading-relaxed">
                        Visualisiert das Erstellungsdatum der Accounts im Overlap. 
                        <strong>Rote Segmente</strong> markieren verdächtige Konten (neu erstellt, kein Avatar/Bio). 
                        Häufungen deuten auf koordinierte Kampagnen ("Bot-Wellen") hin.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 bg-slate-50 border-l-4 border-blue-500">
                    <Users className="text-blue-500 shrink-0" size={24} />
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-slate-900">Power-Follower (Influencer)</h4>
                      <p className="text-[12px] text-slate-500 leading-relaxed">
                        Identifiziert die einflussreichsten Konten innerhalb der Schnittmenge. 
                        Personen, die mehreren Ziel-Accounts folgen und selbst eine hohe Reichweite haben, 
                        agieren oft als Brücken oder Multiplikatoren.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 bg-slate-50 border-l-4 border-emerald-500">
                    <Search className="text-emerald-500 shrink-0" size={24} />
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-slate-900">Bio-WordCloud</h4>
                      <p className="text-[12px] text-slate-500 leading-relaxed">
                        Analysiert die Selbstbeschreibungen der gemeinsamen Follower. 
                        Dient zur Identifikation von Interessen-Clustern (z.B. politische Gesinnung, Hobbys, Berufsfelder).
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Data Notice */}
              <section className="p-6 bg-amber-50 border-2 border-amber-200">
                <div className="flex items-center gap-2 text-amber-700 mb-2">
                  <Info size={16} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Wichtiger Hinweis</h4>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed italic">
                  Um Rate-Limits zu respektieren und die Performance zu sichern, werden detaillierte Zeitdaten 
                  und Follower-Zahlen nur für die ersten 100 gemeinsamen Follower abgerufen. 
                  Die Schnittmengen-Berechnung selbst basiert jedoch immer auf der vollständigen Datenbasis.
                </p>
              </section>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t-4 border-slate-900 flex justify-center">
              <button 
                onClick={onClose}
                className="px-10 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-colors shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] hover:shadow-none translate-x-[-4px] translate-y-[-4px] hover:translate-x-0 hover:translate-y-0 transition-all"
              >
                Verstanden
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
