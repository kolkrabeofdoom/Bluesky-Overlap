import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface BioWordCloudProps {
  mutualFollowers: any[];
}

const STOP_WORDS = new Set([
    'und', 'die', 'der', 'das', 'ist', 'ich', 'ein', 'eine', 'mit', 'auf', 'für', 'von', 'den', 'dem', 'zu', 'nicht', 'mit', 'auch', 'als', 'an', 'im', 'in', 'des', 'am', 'aus', 'the', 'and', 'to', 'of', 'in', 'is', 'for', 'with', 'on', 'at', 'by'
]);

export default function BioWordCloud({ mutualFollowers }: BioWordCloudProps) {
  const words = useMemo(() => {
    const counts: Record<string, number> = {};
    
    mutualFollowers.forEach(f => {
      if (!f.description) return;
      
      // Clean and split description
      const bioWords = f.description
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .split(/\s+/);
        
      bioWords.forEach((w: string) => {
        if (w.length > 3 && !STOP_WORDS.has(w)) {
          counts[w] = (counts[w] || 0) + 1;
        }
      });
    });
    
    return Object.entries(counts)
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);
  }, [mutualFollowers]);

  if (words.length === 0) return null;

  const maxCount = Math.max(...words.map(w => w.count));

  return (
    <div className="bg-slate-50 p-6 md:p-8 border-t border-slate-200">
      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Bio-Mining: Häufigste Begriffe im Overlap</h3>
      <div className="flex flex-wrap gap-x-6 gap-y-4 items-center justify-center max-w-4xl mx-auto">
        {words.map((word, i) => {
          const fontSize = 10 + (word.count / maxCount) * 20;
          const opacity = 0.3 + (word.count / maxCount) * 0.7;
          
          return (
            <motion.span
              key={word.text}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              style={{ fontSize: `${fontSize}px`, opacity }}
              className="font-black uppercase tracking-tight text-slate-900 cursor-default hover:text-blue-600 transition-colors"
              title={`${word.count} Nennungen`}
            >
              {word.text}
            </motion.span>
          );
        })}
      </div>
      <p className="text-[9px] text-slate-400 text-center mt-8 uppercase font-bold tracking-widest opacity-50">
        Basierend auf {mutualFollowers.length} analysierten Biografien
      </p>
    </div>
  );
}
