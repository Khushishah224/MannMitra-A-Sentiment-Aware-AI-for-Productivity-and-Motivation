import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getPeerPulse } from '../api';

const PeerPulseWidget = ({ refreshMs = 30000, windowMinutes=30, hidden=false }) => {
  const [stats, setStats] = useState(null);
  const [top, setTop] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await getPeerPulse(windowMinutes);
      setStats(data);
      if (data?.distribution) {
        const entries = Object.entries(data.distribution).sort((a,b)=>b[1]-a[1]);
        setTop(entries[0] || null);
      }
    } catch (_) { /* silent */ } finally { setLoading(false); }
  };

  useEffect(()=>{
    if (hidden) return; // do not fetch if widget hidden
    fetchStats();
    const id = setInterval(fetchStats, refreshMs);
    return ()=> clearInterval(id);
  },[hidden, windowMinutes]);

  if (hidden) return null;
  const total = stats?.total || 0;
  const percent = top ? Math.round(top[1]) : 0;
  const label = top ? top[0] : 'active';
  const moods = stats?.mood_distribution ? Object.entries(stats.mood_distribution).sort((a,b)=>b[1]-a[1]).slice(0,3) : [];
  let motivation = '';
  if (stats?.mood_distribution) {
    const topMoodEntry = Object.entries(stats.mood_distribution).sort((a,b)=>b[1]-a[1])[0];
    if (topMoodEntry) {
      const [moodName, val] = topMoodEntry;
      if (moodName.includes('stressed')) motivation = 'Many peers are stressed — a short focused block can stand out now.';
      else if (moodName.includes('tired')) motivation = 'Lots of peers are tired. Gentle progress still counts.';
      else if (moodName.includes('relaxed')) motivation = 'Peers are unwinding. A focused sprint could give you a lead.';
      else if (moodName.includes('productive') || moodName.includes('focused')) motivation = 'Momentum is high — ride the wave and commit a block now.';
      else motivation = 'Join the flow — even a small start builds momentum.';
    }
  }

  return (
    <motion.div
      initial={{opacity:0, y:8}}
      animate={{opacity:1, y:0}}
      className="p-4 rounded-lg bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border border-indigo-500/30 backdrop-blur text-sm flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="text-indigo-600 text-xl">⚡</span>
        {loading ? (
          <span className="text-gray-500">Gathering peer pulse...</span>
        ) : total === 0 ? (
          <span className="text-gray-500">No peer activity yet (be the first!)</span>
        ) : (
          <span className="text-gray-800 font-medium">{percent}% peers {label} now</span>
        )}
      </div>
      {!loading && total>0 && moods.length>0 && (
        <div className="flex flex-wrap gap-2 text-[11px] text-gray-600">
          {moods.map(([m,v]) => (
            <span key={m} className="px-2 py-0.5 rounded-full bg-white/70 border border-indigo-200">
              {m}: {Math.round(v)}%
            </span>
          ))}
        </div>
      )}
      {!loading && total>0 && motivation && (
        <div className="text-[11px] text-indigo-700 font-medium leading-snug">
          {motivation}
        </div>
      )}
    </motion.div>
  );
};

export default PeerPulseWidget;