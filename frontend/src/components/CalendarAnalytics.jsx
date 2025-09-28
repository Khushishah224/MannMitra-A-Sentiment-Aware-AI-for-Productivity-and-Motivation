import { useEffect, useState } from 'react';
import { getPlanCalendarHistory } from '../api';

const WEEK_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const CalendarAnalytics = ({ onSelectDate, selectedDate }) => {
  const today = new Date();
  const [m, setM] = useState(today.getMonth()+1); // 1-12
  const [y, setY] = useState(today.getFullYear());
  const [data, setData] = useState({ days: {}, summary: {} });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid'); // grid | list

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      const res = await getPlanCalendarHistory(m, y);
      setData(res);
      setLoading(false);
    })();
  },[m,y]);

  const changeMonth = (delta) => {
    setLoading(true);
    let nm = m + delta; let ny = y;
    if (nm < 1) { nm = 12; ny -=1; }
    if (nm > 12) { nm = 1; ny +=1; }
    setM(nm); setY(ny);
  };

  if (loading) return <div className="text-sm text-gray-500">Loading calendar analytics...</div>;

  const monthLabel = new Date(y, m-1, 1).toLocaleString(undefined,{month:'long', year:'numeric'});
  const dayEntries = data.days || {};
  // Build heatmap matrix for month
  const first = new Date(y, m-1, 1);
  const last = new Date(y, m, 0);
  const daysInMonth = last.getDate();
  const cells = [];
  for (let d=1; d<=daysInMonth; d++) {
    const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const stats = dayEntries[dateStr];
    const rate = stats ? Math.round(stats.minutes_completion_rate || stats.completion_rate || 0) : 0;
    let intensity = 'bg-gray-100';
    if (rate>0) intensity = rate<40 ? 'bg-red-300' : rate<70 ? 'bg-yellow-300' : 'bg-green-400';
    cells.push({ dateStr, d, stats, rate, intensity });
  }
  // Determine offset for first day
  const offset = first.getDay();
  for (let i=0;i<offset;i++) cells.unshift({ empty:true, key:`pad-${i}` });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <button onClick={()=>changeMonth(-1)} className="px-2 py-1 border rounded hover:bg-gray-50">◀</button>
          <span className="font-medium">{monthLabel}</span>
          <button onClick={()=>changeMonth(1)} className="px-2 py-1 border rounded hover:bg-gray-50">▶</button>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setView('grid')} className={`px-2 py-1 border rounded ${view==='grid'?'bg-indigo-100 border-indigo-300':'hover:bg-gray-50'}`}>Grid</button>
          <button onClick={()=>setView('list')} className={`px-2 py-1 border rounded ${view==='list'?'bg-indigo-100 border-indigo-300':'hover:bg-gray-50'}`}>List</button>
        </div>
      </div>
      {view==='grid' ? (
        <div className="space-y-1">
          <div className="grid grid-cols-7 text-[10px] text-gray-500">
            {WEEK_DAYS.map(d=> <div key={d} className="text-center py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((c,idx)=> c.empty ? <div key={c.key} /> : (
              <div
                key={c.dateStr}
                className={`relative aspect-square rounded flex items-center justify-center text-[10px] font-medium cursor-pointer group ${c.intensity} ${selectedDate===c.dateStr ? 'ring-2 ring-indigo-600 ring-offset-1' : ''}`}
                title={`${c.dateStr}\n${c.rate}%`}
                onClick={()=> onSelectDate && onSelectDate(c.dateStr)}
              > 
                {c.d}
                {c.stats && (
                  <div className="hidden group-hover:block absolute z-10 -top-1 left-1/2 -translate-x-1/2 bg-white border rounded p-1 shadow text-[10px] w-28">
                    <div className="font-semibold mb-1">{c.rate}%</div>
                    <div>{c.stats.completed} / {c.stats.total} tasks</div>
                    <div>{c.stats.completed_minutes}/{c.stats.planned_minutes} min</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[10px]">
            <span className="px-2 py-1 rounded bg-gray-100">0%</span>
            <span className="px-2 py-1 rounded bg-red-300">&lt;40%</span>
            <span className="px-2 py-1 rounded bg-yellow-300">40-69%</span>
            <span className="px-2 py-1 rounded bg-green-400">70%+</span>
          </div>
        </div>
      ) : (
        <div className="max-h-48 overflow-auto border rounded divide-y">
          {Object.entries(dayEntries).sort((a,b)=>a[0].localeCompare(b[0])).map(([dStr, st]) => (
            <div key={dStr} className="px-2 py-1 flex items-center justify-between text-[11px]">
              <span>{dStr}</span>
              <span className="font-medium">{Math.round(st.minutes_completion_rate || st.completion_rate)}%</span>
              <span>{st.completed}/{st.total}</span>
              <span>{st.completed_minutes}/{st.planned_minutes} min</span>
            </div>
          ))}
        </div>
      )}
      <div className="text-[11px] text-gray-600">
        Tasks: {data.summary.total_tasks || 0} • Completed: {data.summary.completed || 0} • Overall {Math.round(data.summary.overall_completion_rate||0)}%
        <br />Minutes: {data.summary.completed_minutes || 0}/{data.summary.total_planned_minutes || 0} ({Math.round(data.summary.overall_minutes_completion_rate || 0)}% utilization)
      </div>
    </div>
  );
};

export default CalendarAnalytics;