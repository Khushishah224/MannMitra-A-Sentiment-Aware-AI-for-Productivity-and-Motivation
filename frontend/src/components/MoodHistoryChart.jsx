import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';

// Map mood strings to a simple numeric score for visualization
const moodToScore = (mood) => {
  const map = {
    very_sad: -2,
    sad: -1,
    anxious: -1,
    stressed: -1,
    neutral: 0,
    lazy: 0,
    content: 1,
    happy: 2,
    motivated: 2,
  };
  return map[mood?.toLowerCase?.()] ?? 0;
};

const MoodHistoryChart = ({ data = [] }) => {
  const chartData = data
    .slice()
    .reverse() // oldest to newest
    .map((m) => {
      // Ensure we have a valid mood value from either mood_type or mood field
      const moodValue = m.mood_type || m.mood || "neutral";
      return {
        time: new Date(m.created_at || m.timestamp || new Date()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: moodToScore(moodValue),
        mood: moodValue,
      };
    })
    .filter(item => item !== null);

  console.log("Mood chart data:", chartData);
  
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <defs>
            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f472b6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeWidth={1} />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 11, fill: '#94a3b8' }} 
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis 
            domain={[-2, 2]} 
            ticks={[-2, -1, 0, 1, 2]} 
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={{ stroke: '#e2e8f0' }}
          />
          <Tooltip
            contentStyle={{ 
              borderRadius: 16, 
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              backdropFilter: 'blur(10px)',
              fontSize: '12px',
              fontWeight: '500'
            }}
            formatter={(value, name) => [
              <span style={{ color: '#f472b6' }}>{value > 0 ? '+' : ''}{value}</span>, 
              'Mood Score'
            ]}
            labelFormatter={(label, payload) => {
              const item = payload?.[0]?.payload;
              return (
                <div style={{ color: '#64748b', fontWeight: '600' }}>
                  {label} • <span style={{ textTransform: 'capitalize' }}>{item?.mood?.replace('_', ' ')}</span>
                </div>
              );
            }}
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="#f472b6" 
            strokeWidth={2.5}
            fill="url(#moodGradient)"
            dot={{ fill: '#f472b6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#f472b6', strokeWidth: 3, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MoodHistoryChart;