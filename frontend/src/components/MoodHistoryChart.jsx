import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
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
    .map((m) => ({
      time: new Date(m.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: moodToScore(m.mood_type || m.mood),
      mood: m.mood_type || m.mood,
    }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={[-2, 2]} ticks={[-2, -1, 0, 1, 2]} />
          <Tooltip formatter={(value) => [value, 'score']} labelFormatter={(label, payload) => {
            const item = payload?.[0]?.payload;
            return `${label} • ${item?.mood}`;
          }} />
          <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MoodHistoryChart;
