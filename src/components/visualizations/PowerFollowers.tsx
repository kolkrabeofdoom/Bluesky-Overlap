import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Users } from 'lucide-react';

interface PowerFollowersProps {
  followers: any[];
}

export default function PowerFollowers({ followers }: PowerFollowersProps) {
  // Sort by follower count and take top 10
  const powerFollowers = [...followers]
    .filter(f => f.followersCount !== undefined)
    .sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0))
    .slice(0, 10);

  if (powerFollowers.length === 0) return null;

  return (
    <div className="w-full bg-white border-b border-slate-200">
      <div className="px-4 md:px-6 py-4 flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
          <Users size={12} className="text-blue-500" />
          Power-Follower (Top Influencer im Overlap)
        </h3>
      </div>
      
      <div className="px-4 md:px-6 pb-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-4 min-w-max">
          {powerFollowers.map((profile, idx) => (
            <motion.div 
              key={profile.did}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="w-48 bg-slate-50 border border-slate-200 p-4 group hover:border-blue-400 transition-colors flex flex-col gap-3 relative overflow-hidden"
            >
              {/* Rank Badge */}
              <div className="absolute top-0 right-0 bg-slate-900 text-white text-[8px] font-black px-2 py-0.5">
                #{idx + 1}
              </div>

              <div className="flex items-center gap-3">
                {profile.avatar ? (
                  <img 
                    src={profile.avatar} 
                    alt={profile.handle} 
                    className="w-10 h-10 rounded-none grayscale group-hover:grayscale-0 transition-all"
                  />
                ) : (
                  <div className="w-10 h-10 bg-slate-200 flex items-center justify-center text-slate-400 font-black">
                    ?
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-black uppercase tracking-tight truncate text-slate-900">
                    {profile.displayName || profile.handle.split('.')[0]}
                  </h4>
                  <p className="text-[8px] font-bold text-slate-400 truncate">@{profile.handle}</p>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Follower</span>
                  <span className="text-sm font-black text-blue-600">
                    {(profile.followersCount || 0).toLocaleString()}
                  </span>
                </div>
                <a 
                  href={`https://bsky.app/profile/${profile.handle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-400 transition-all"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
