import { useState, useRef, useEffect } from 'react';
import { BskyAgent } from '@atproto/api';
import { ProfileView } from '@atproto/api/dist/client/types/app/bsky/actor/defs';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import NetworkGraph, { NetworkNode, NetworkLink } from './components/NetworkGraph';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, AlertCircle, RefreshCw, StopCircle, Plus, X, Search, ExternalLink } from 'lucide-react';

const agent = new BskyAgent({ service: 'https://public.api.bsky.app' });

type FollowerData = {
  profile: any;
  followers: ProfileView[];
};

type ComparisonResult = {
  accounts: FollowerData[];
  mutual: ProfileView[];
  intersections: { name: string; count: number }[];
  networkLinks: NetworkLink[];
};

export default function App() {
  const [handles, setHandles] = useState<string[]>(['', '']);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ fetchCount: number; totalEstimated: number; handle: string }[]>([]);
  const [result, setResult] = useState<ComparisonResult | null>(null);
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
          const names = key.split(',').map(idx => accountsData[parseInt(idx)].profile.handle.split('.')[0]);
          return { name: names.join(' & '), count };
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
        mutual: mutualList,
        intersections,
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
        <div className="p-6 md:p-10 border-b border-slate-200 bg-white">
          <h1 className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-4">Erweiterte Analyse</h1>
          <p className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 max-w-3xl leading-snug">
             Analysiere Überschneidungen und Interaktionen beliebig vieler Accounts.
          </p>
        </div>

        {/* Inputs */}
        <div className="bg-slate-200 border-b border-slate-200 p-px">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px text-slate-900">
             {handles.map((handle, i) => (
                <div key={i} className="bg-white p-6 md:p-8 flex flex-col relative focus-within:z-10 focus-within:ring-2 focus-within:ring-blue-500 min-h-[140px]">
                   <div className="flex justify-between items-center mb-4">
                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Account {i+1}</span>
                     {handles.length > 2 && (
                        <button onClick={() => removeHandle(i)} className="text-slate-300 hover:text-red-500 transition"><X size={16} /></button>
                     )}
                   </div>
                   <div className="flex items-center relative flex-1">
                     <span className="absolute left-0 text-slate-300 font-black text-xl md:text-2xl">@</span>
                     <input
                       type="text"
                       placeholder="handle.bsky.social"
                       value={handle}
                       onChange={(e) => updateHandle(i, e.target.value)}
                       disabled={isComparing}
                       className="w-full pl-8 py-2 text-xl md:text-2xl font-black tracking-tight text-blue-600 outline-none placeholder:text-slate-200 bg-transparent disabled:opacity-50"
                       onKeyDown={e => e.key === 'Enter' && handleStartComparison()}
                     />
                   </div>
                </div>
             ))}
             {handles.length < 5 && (
                <div 
                   onClick={!isComparing ? addHandle : undefined} 
                   className={cn("bg-slate-100/50 p-6 md:p-8 flex items-center justify-center border-dashed border-2 border-slate-300 m-4 cursor-pointer hover:bg-slate-100 transition min-h-[140px]", isComparing && "opacity-50 cursor-not-allowed")}
                >
                   <div className="flex flex-col items-center text-slate-400 gap-2">
                      <Plus size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Account Hinzufügen</span>
                   </div>
                </div>
             )}
          </div>
          
          <div className="bg-white p-6 md:px-10 flex flex-col sm:flex-row gap-6 justify-between sm:items-center">
             {error && (
               <div className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-4 py-3 border border-red-200 flex-1">
                 Systemfehler: {error}
               </div>
             )}
             <div className="flex-1"></div>
             {!isComparing ? (
                <button
                  onClick={handleStartComparison}
                  className="w-full sm:w-auto px-8 py-4 border-2 border-slate-900 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-colors whitespace-nowrap"
                >
                  Follower Analysieren
                </button>
             ) : (
                <button
                  onClick={handleStop}
                  className="w-full sm:w-auto px-8 py-4 border-2 border-red-600 text-red-600 text-[10px] border-dashed font-black uppercase tracking-widest hover:bg-red-50 transition-colors whitespace-nowrap"
                >
                  Vorgang Abbrechen
                </button>
             )}
          </div>
        </div>

        <AnimatePresence>
          {isComparing && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-b border-slate-200 bg-slate-50">
              <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200">
                {progress.map((p, i) => (
                   <div key={i} className="bg-white p-6 md:p-8 flex flex-col justify-center min-h-[120px]">
                     <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 truncate">
                       Fetching {formatHandle(p.handle)}
                     </div>
                     <div className="text-xl font-black tracking-tight text-slate-900 mb-4">
                       {p.fetchCount.toLocaleString()} <span className="text-slate-400">/ {p.totalEstimated.toLocaleString()}</span>
                     </div>
                     <div className="w-full h-2 bg-slate-100 relative">
                       <div className="absolute top-0 left-0 h-2 bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${Math.min(100, Math.max(2, (p.fetchCount / (p.totalEstimated || 1)) * 100))}%` }}></div>
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
                <div className="p-6 sm:p-10 lg:p-16 flex flex-col justify-center text-center">
                  <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Mutual Follower Overlap</h2>
                  <div className="relative inline-block self-center">
                    <span className="text-[60px] sm:text-[100px] md:text-[140px] font-black leading-none tracking-tighter text-slate-900">
                      {result.mutual.length.toLocaleString()}
                    </span>
                    <div className="absolute -bottom-2 md:-bottom-4 left-0 w-full h-2 md:h-4 bg-blue-500"></div>
                  </div>
                  <p className="mt-8 md:mt-12 text-xl font-bold leading-tight max-w-xl mx-auto text-slate-500">
                    Es gibt <span className="text-slate-900 italic">{result.mutual.length.toLocaleString()} Personen</span>, die <strong>allen</strong> analysierten Accounts folgen.
                  </p>
                </div>
              </div>

              {/* Data Visualization Grid */}
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
                 <div className="bg-slate-50 p-6 md:p-10 flex flex-col border-l border-slate-200">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-8">Account Interaktionen Graph</h3>
                    <div className="flex-1 w-full relative min-h-[400px] border border-slate-200 bg-white rounded-xl overflow-hidden">
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
                <div className="p-6 md:px-10 md:py-8 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
                   <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-slate-900">
                     Gemeinsame Follower ({result.mutual.length})
                   </h3>
                   {result.mutual.length > 0 && (
                      <button 
                         onClick={handleExportCSV}
                         className="px-4 py-2 border-2 border-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white transition-colors"
                      >
                         Export CSV
                      </button>
                   )}
                </div>
                
                {result.mutual.length === 0 ? (
                  <div className="p-16 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Keine gemeinsamen Follower gefunden.
                  </div>
                ) : (
                  <div className="flex text-slate-900 flex-col">
                    {result.mutual.slice(0, visibleLimit).map((profile) => (
                      <div key={profile.did} className="p-6 md:p-10 border-b border-slate-200 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start gap-4 md:gap-8">
                        {profile.avatar ? (
                          <img src={profile.avatar} alt={profile.displayName || profile.handle} className="w-16 h-16 md:w-20 md:h-20 bg-slate-200 object-cover flex-shrink-0 grayscale hover:grayscale-0 transition-all duration-300" />
                        ) : (
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                             <span className="font-black text-2xl">?</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="overflow-hidden w-full">
                              <h4 className="font-black text-slate-900 text-lg md:text-xl uppercase tracking-tight truncate mb-1">
                                {profile.displayName || profile.handle}
                              </h4>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 truncate">@{profile.handle}</p>
                            </div>
                            <a 
                              href={`https://bsky.app/profile/${profile.handle}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-4 py-2 border-2 border-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white transition-colors whitespace-nowrap self-start"
                            >
                              Open Profile
                            </a>
                          </div>
                          {profile.description && (
                            <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-3xl border-l-2 border-slate-300 pl-4 py-1 italic mt-2">
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
