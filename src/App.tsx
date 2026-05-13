import { useState, useRef, useEffect } from 'react';
import { BskyAgent } from '@atproto/api';
import { ProfileView } from '@atproto/api/dist/client/types/app/bsky/actor/defs';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import NetworkGraph, { NetworkNode, NetworkLink } from './components/NetworkGraph';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, AlertCircle, RefreshCw, StopCircle, Plus, X, Search, ExternalLink, ChevronDown } from 'lucide-react';
import VisualizationSelector from './components/VisualizationSelector';
import VennEulerDiagram from './components/visualizations/VennEulerDiagram';
import UpSetPlot from './components/visualizations/UpSetPlot';
import MosaicPlot from './components/visualizations/MosaicPlot';
import SpecializedDiagrams from './components/visualizations/SpecializedDiagrams';
import TemporalAnalysis from './components/visualizations/TemporalAnalysis';

const agent = new BskyAgent({ service: 'https://public.api.bsky.app' });

type FollowerData = {
  profile: any;
  followers: ProfileView[];
};

export type VizType = 'venn' | 'euler' | 'edwards' | 'johnston' | 'upset' | 'kv' | 'mosaic' | 'temporal';

type ComparisonResult = {
  accounts: FollowerData[];
  mutual: ProfileView[];
  intersections: { name: string; count: number; membership: number[] }[];
  membershipCounts: Record<string, number>;
  networkLinks: NetworkLink[];
};

export default function App() {
  const [handles, setHandles] = useState<string[]>(['', '']);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ fetchCount: number; totalEstimated: number; handle: string }[]>([]);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [activeVizType, setActiveVizType] = useState<VizType>('venn');
  const [visibleLimit, setVisibleLimit] = useState(50);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const accs = searchParams.get('accounts');
    if (accs) {
      const split = accs.split(',').filter(Boolean);
      if (split.length >= 2) setHandles(split);
    } else {
      const a1 = searchParams.get('alpha');
      const a2 = searchParams.get('beta');
      if (a1 && a2) setHandles([a1, a2]);
    }
  }, []);

  const formatHandle = (input: string) => {
    let handle = input.trim().toLowerCase();
    if (handle.startsWith('@')) handle = handle.substring(1);
    if (!handle.includes('.')) handle = `${handle}.bsky.social`;
    return handle;
  };

  const updateHandle = (index: number, value: string) => {
    const newHandles = [...handles];
    newHandles[index] = value;
    setHandles(newHandles);
  };

  const addHandle = () => {
    setHandles([...handles, '']);
  };

  const removeHandle = (index: number) => {
    if (handles.length <= 2) return;
    const newHandles = [...handles];
    newHandles.splice(index, 1);
    setHandles(newHandles);
  };

  const fetchFollowers = async (
    targetHandle: string,
    index: number,
    onProgress: (index: number, count: number, total: number) => void,
    signal: AbortSignal
  ): Promise<FollowerData> => {
    const handle = formatHandle(targetHandle);
    const profileRes = await agent.getProfile({ actor: handle });
    const profile = profileRes.data;
    const estimatedTotal = profile.followersCount || 0;
    
    let cursor: string | undefined = undefined;
    const followers: ProfileView[] = [];
    
    onProgress(index, 0, estimatedTotal);
    
    do {
      if (signal.aborted) throw new Error("Abgebrochen vom Nutzer");
      
      const res = await agent.api.app.bsky.graph.getFollowers({ actor: handle, limit: 100, cursor });
      followers.push(...res.data.followers);
      cursor = res.data.cursor;
      
      onProgress(index, followers.length, estimatedTotal);
      
      await new Promise(r => setTimeout(r, 80));
    } while (cursor);
    
    return { profile, followers };
  };

  const handleStartComparison = async () => {
    const validHandles = handles.filter(h => h.trim() !== '');
    if (validHandles.length < 2) {
      setError("Bitte mindestens zwei Accounts angeben.");
      return;
    }
    const unique = new Set(validHandles.map(h => formatHandle(h)));
    if (unique.size !== validHandles.length) {
      setError("Bitte unterschiedliche Accounts zum Vergleich eingeben.");
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('accounts', validHandles.join(','));
    window.history.replaceState({}, '', `${window.location.pathname}?${searchParams.toString()}`);

    setError(null);
    setResult(null);
    setIsComparing(true);
    setVisibleLimit(50);
    setProgress(validHandles.map(h => ({ fetchCount: 0, totalEstimated: 0, handle: h })));
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const fetchPromises = validHandles.map((h, i) => 
        fetchFollowers(h, i, (idx, load, total) => {
          setProgress(prev => {
            const next = [...prev];
            if(next[idx]) {
                next[idx] = { ...next[idx], fetchCount: load, totalEstimated: total };
            }
            return next;
          });
        }, signal)
      );

      const accountsData = await Promise.all(fetchPromises);

      // Compute mutuals (All)
      let mutualList = accountsData[0].followers;
      for (let i = 1; i < accountsData.length; i++) {
        const didSet = new Set(accountsData[i].followers.map(f => f.did));
        mutualList = mutualList.filter(f => didSet.has(f.did));
      }
      mutualList.sort((a, b) => (b.displayName || '').localeCompare(a.displayName || ''));

      // Enrich mutual followers with creation dates (Batched)
      const toEnrich = mutualList.slice(0, 100);
      const enrichedMutuals: any[] = [...mutualList];
      
      if (toEnrich.length > 0) {
        const batchSize = 25;
        for (let i = 0; i < toEnrich.length; i += batchSize) {
          const batch = toEnrich.slice(i, i + batchSize).map(f => f.did);
          try {
            const profilesRes = await agent.getProfiles({ actors: batch });
            profilesRes.data.profiles.forEach(fullProfile => {
              const idx = enrichedMutuals.findIndex(f => f.did === fullProfile.did);
              if (idx !== -1) {
                enrichedMutuals[idx] = { ...enrichedMutuals[idx], createdAt: (fullProfile as any).createdAt };
              }
            });
          } catch (e) {
            console.error("Batch enrichment failed", e);
          }
        }
      }

      // Compute Intersections
      const userMemberships: Record<string, number[]> = {};
      accountsData.forEach((data, index) => {
         data.followers.forEach(f => {
             if (!userMemberships[f.did]) userMemberships[f.did] = [];
             userMemberships[f.did].push(index);
         });
      });

      const membershipCounts: Record<string, number> = {};
      Object.values(userMemberships).forEach(indices => {
         const key = indices.join(',');
         membershipCounts[key] = (membershipCounts[key] || 0) + 1;
      });

      const intersections = Object.entries(membershipCounts).map(([key, count]) => {
          const membership = key.split(',').map(Number);
          const names = membership.map(idx => accountsData[idx].profile.handle.split('.')[0]);
          return { name: names.join(' & '), count, membership };
      }).sort((a, b) => b.count - a.count);

      // Interactions (Network Links)
      const networkLinks: NetworkLink[] = [];
      accountsData.forEach((sourceData, sourceIdx) => {
        accountsData.forEach((targetData, targetIdx) => {
          if (sourceIdx === targetIdx) return;
          // Does source follow target? i.e. is source in target's followers?
          const sourceFollowsTarget = targetData.followers.some(f => f.did === sourceData.profile.did);
          if (sourceFollowsTarget) {
            networkLinks.push({ source: sourceData.profile.did, target: targetData.profile.did });
          }
        });
      });

      setResult({
        accounts: accountsData,
        mutual: enrichedMutuals,
        intersections,
        membershipCounts,
        networkLinks
      });
      
    } catch (err: any) {
      if (err.message === "Abgebrochen vom Nutzer") {
        setError("Vorgang wurde abgebrochen.");
      } else {
         setError(`Fehler beim Abrufen: ${err.message}`);
      }
    } finally {
      setIsComparing(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
  };

  const handleExportCSV = () => {
    if (!result) return;
    const headers = ['Handle', 'Display Name', 'Description', 'Profile URL'];
    const rows = result.mutual.map(p => [
      p.handle,
      `"${(p.displayName || '').replace(/"/g, '""')}"`,
      `"${(p.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `https://bsky.app/profile/${p.handle}`
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `overlap_mutual.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200 flex flex-col">
      <nav className="px-6 md:px-10 py-6 flex flex-col sm:flex-row justify-between items-center sm:items-baseline border-b border-slate-200 bg-white gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500"></div>
          <span className="font-black text-xl md:text-2xl tracking-tighter uppercase whitespace-nowrap">Bluesky Overlap</span>
        </div>
        <div className="flex gap-8 font-bold text-sm uppercase tracking-widest">
          <span className="text-blue-600 border-b-2 border-blue-600 pb-1">Vergleich</span>
        </div>
      </nav>

      <main className="flex-1 flex flex-col bg-slate-50">
        <div className="p-4 md:p-6 border-b border-slate-200 bg-white">
          <h1 className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">Erweiterte Analyse</h1>
          <p className="text-lg md:text-xl font-bold tracking-tight text-slate-900 max-w-3xl leading-snug">
             Analysiere Überschneidungen und Interaktionen beliebig vieler Accounts.
          </p>
        </div>

        {/* Inputs */}
        <div className="bg-slate-200 border-b border-slate-200 p-px">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px text-slate-900">
             {handles.map((handle, i) => (
                <div key={i} className="bg-white p-4 md:p-6 flex flex-col relative focus-within:z-10 focus-within:ring-2 focus-within:ring-blue-500 min-h-[100px]">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Account {i+1}</span>
                     {handles.length > 2 && (
                        <button onClick={() => removeHandle(i)} className="text-slate-300 hover:text-red-500 transition"><X size={14} /></button>
                     )}
                   </div>
                   <div className="flex items-center relative flex-1">
                     <span className="absolute left-0 text-slate-300 font-black text-lg">@</span>
                     <input
                       type="text"
                       placeholder="handle.bsky.social"
                       value={handle}
                       onChange={(e) => updateHandle(i, e.target.value)}
                       disabled={isComparing}
                       className="w-full pl-6 py-1 text-lg font-black tracking-tight text-blue-600 outline-none placeholder:text-slate-200 bg-transparent disabled:opacity-50"
                       onKeyDown={e => e.key === 'Enter' && handleStartComparison()}
                     />
                   </div>
                </div>
             ))}
             {handles.length < 5 && (
                <div 
                   onClick={!isComparing ? addHandle : undefined} 
                   className={cn("bg-slate-100/50 p-4 md:p-6 flex items-center justify-center border-dashed border-2 border-slate-300 m-2 cursor-pointer hover:bg-slate-100 transition min-h-[100px]", isComparing && "opacity-50 cursor-not-allowed")}
                >
                   <div className="flex flex-col items-center text-slate-400 gap-1">
                      <Plus size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Hinzufügen</span>
                   </div>
                </div>
             )}
          </div>
          
          <div className="bg-white p-4 md:px-8 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
             {error && (
               <div className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-3 py-2 border border-red-200 flex-1">
                 Systemfehler: {error}
               </div>
             )}
             <div className="flex-1"></div>
             {!isComparing ? (
                <button
                  onClick={handleStartComparison}
                  className="w-full sm:w-auto px-6 py-3 border-2 border-slate-900 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-colors whitespace-nowrap"
                >
                  Analysieren
                </button>
             ) : (
                <button
                  onClick={handleStop}
                  className="w-full sm:w-auto px-6 py-3 border-2 border-red-600 text-red-600 text-[10px] border-dashed font-black uppercase tracking-widest hover:bg-red-50 transition-colors whitespace-nowrap"
                >
                  Abbrechen
                </button>
             )}
          </div>
        </div>

        <AnimatePresence>
          {isComparing && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-b border-slate-200 bg-slate-50">
              <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200">
                {progress.map((p, i) => (
                   <div key={i} className="bg-white p-4 md:p-6 flex flex-col justify-center min-h-[90px]">
                     <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 truncate">
                       Fetching {formatHandle(p.handle)}
                     </div>
                     <div className="text-lg font-black tracking-tight text-slate-900 mb-2">
                       {p.fetchCount.toLocaleString()} <span className="text-slate-400">/ {p.totalEstimated.toLocaleString()}</span>
                     </div>
                     <div className="w-full h-1 bg-slate-100 relative">
                       <div className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${Math.min(100, Math.max(2, (p.fetchCount / (p.totalEstimated || 1)) * 100))}%` }}></div>
                     </div>
                   </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && !isComparing && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col">
              
              {/* Overlap Stat */}
              <div className="flex flex-col border-b border-slate-200 bg-white">
                <div className="p-4 sm:p-6 lg:p-8 flex flex-row items-center justify-center gap-8 text-center sm:text-left">
                  <div className="relative inline-block">
                    <span className="text-[40px] sm:text-[60px] md:text-[80px] font-black leading-none tracking-tighter text-slate-900">
                      {result.mutual.length.toLocaleString()}
                    </span>
                    <div className="absolute -bottom-1 left-0 w-full h-1 bg-blue-500"></div>
                  </div>
                  <div className="flex flex-col items-start">
                    <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Mutual Overlap</h2>
                    <p className="text-sm font-bold leading-tight text-slate-500">
                        <span className="text-slate-900 italic">{result.mutual.length.toLocaleString()} Personen</span> folgen <strong>allen</strong> Accounts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Visualization Section */}
              <div className="flex flex-col bg-slate-50 border-b border-slate-200">
                <VisualizationSelector 
                  activeType={activeVizType} 
                  onChange={setActiveVizType} 
                />
                
                <div className="p-4 md:p-6 lg:p-8 flex flex-col items-center">
                  <div className="w-full max-w-5xl aspect-video md:aspect-[21/9]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeVizType}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full"
                      >
                        {activeVizType === 'venn' && (
                          <VennEulerDiagram accounts={result.accounts} membershipCounts={result.membershipCounts} type="venn" />
                        )}
                        {activeVizType === 'euler' && (
                          <VennEulerDiagram accounts={result.accounts} membershipCounts={result.membershipCounts} type="euler" />
                        )}
                        {activeVizType === 'upset' && (
                          <UpSetPlot accounts={result.accounts} intersections={result.intersections} />
                        )}
                        {activeVizType === 'mosaic' && (
                          <MosaicPlot intersections={result.intersections} />
                        )}
                        {(activeVizType === 'edwards' || activeVizType === 'johnston' || activeVizType === 'kv') && (
                          <SpecializedDiagrams accounts={result.accounts} membershipCounts={result.membershipCounts} type={activeVizType} />
                        )}
                        {activeVizType === 'temporal' && (
                          <TemporalAnalysis mutualFollowers={result.mutual} />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Data Visualization Grid (Secondary/Stats) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-slate-200 border-b border-slate-200">
                 
                 {/* Bar Chart representing Schnittmengen (Intersections) */}
                 <div className="bg-white p-6 md:p-10 flex flex-col">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-8">Schnittmengen Statistik</h3>
                    <div className="flex-1 min-h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={result.intersections.slice(0, 10)} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                          <XAxis 
                             dataKey="name" 
                             tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                             angle={-45} 
                             textAnchor="end"
                             interval={0}
                          />
                          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                          <Tooltip 
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                          />
                          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                            {result.intersections.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#6366f1'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                 </div>

                 {/* Network Graph representing Interactions */}
                 <div className="bg-slate-50 p-4 md:p-6 flex flex-col border-l border-slate-200">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Interaktionen Graph</h3>
                    <div className="flex-1 w-full relative min-h-[300px] border border-slate-200 bg-white rounded-xl overflow-hidden">
                       <NetworkGraph 
                         nodes={result.accounts.map(acc => ({
                           id: acc.profile.did,
                           label: acc.profile.handle,
                           radius: 30,
                           image: acc.profile.avatar
                         }))}
                         links={result.networkLinks}
                       />
                       <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 shadow-sm border border-slate-200 rounded">
                         Pfeile = "Folgt"
                       </div>
                    </div>
                 </div>
              </div>

              {/* Match List */}
              <div className="flex-1 bg-white flex flex-col">
                <div className="p-4 md:px-6 md:py-4 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
                   <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter text-slate-900">
                     Gemeinsame Follower ({result.mutual.length})
                   </h3>
                   {result.mutual.length > 0 && (
                      <button 
                         onClick={handleExportCSV}
                         className="px-3 py-1.5 border-2 border-slate-900 text-[9px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white transition-colors"
                      >
                         CSV
                      </button>
                   )}
                </div>
                
                {result.mutual.length === 0 ? (
                  <div className="p-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Keine gemeinsamen Follower gefunden.
                  </div>
                ) : (
                  <div className="flex text-slate-900 flex-col">
                    {result.mutual.slice(0, visibleLimit).map((profile) => (
                      <div key={profile.did} className="p-4 md:p-6 border-b border-slate-200 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start gap-4">
                        {profile.avatar ? (
                          <img src={profile.avatar} alt={profile.displayName || profile.handle} className="w-12 h-12 md:w-14 md:h-14 bg-slate-200 object-cover flex-shrink-0 grayscale hover:grayscale-0 transition-all duration-300" />
                        ) : (
                          <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                             <span className="font-black text-xl">?</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                            <div className="overflow-hidden w-full">
                              <h4 className="font-black text-slate-900 text-base md:text-lg uppercase tracking-tight truncate">
                                {profile.displayName || profile.handle}
                              </h4>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">@{profile.handle}</p>
                            </div>
                            <a 
                              href={`https://bsky.app/profile/${profile.handle}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-3 py-1.5 border-2 border-slate-900 text-[9px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white transition-colors whitespace-nowrap self-start"
                            >
                              Profil
                            </a>
                          </div>
                          {profile.description && (
                            <p className="text-xs font-medium text-slate-600 leading-relaxed max-w-3xl border-l-2 border-slate-300 pl-3 py-0.5 italic mt-2">
                              {profile.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {visibleLimit < result.mutual.length && (
                  <div className="p-10 text-center bg-white flex justify-center border-t border-slate-200">
                    <button
                      onClick={() => setVisibleLimit(prev => prev + 50)}
                      className="px-8 py-4 border-2 border-slate-900 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-colors"
                    >
                      Mehr Anzeigen ({Math.min(50, result.mutual.length - visibleLimit)})
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
