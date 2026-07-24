'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AppDate from './AppDate';

export default function StudentGoalChart({ goal }) {
  // We need to format the goal updates for the chart
  // goal.updates is sorted descending, we need ascending for the chart
  const data = (goal.updates || []).slice().reverse().map(update => {
    const d = new Date(update.createdAt);
    return {
      dateObj: d,
      displayDate: d.toLocaleDateString('he-IL', { month: 'numeric', day: 'numeric' }),
      rating: update.rating,
      reflection: update.reflection
    };
  });

  if (data.length === 0) {
    return <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>אין מספיק נתונים להצגת גרף.</div>;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ fontWeight: 'bold', color: '#1e293b' }}><AppDate date={p.dateObj} /></div>
          <div style={{ color: 'var(--primary-color)' }}>רמה: {p.rating} מתוך 5</div>
          {p.reflection && (
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px', maxWidth: '200px', whiteSpace: 'pre-wrap' }}>
              "{p.reflection}"
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 250 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="rating" stroke="var(--primary-color)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary-color)' }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
