'use client';

import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentMoodChart({ moodChecks }) {
  const [timeframe, setTimeframe] = useState('month');

  const filteredData = useMemo(() => {
    if (!moodChecks || moodChecks.length === 0) return [];
    
    const now = new Date();
    let cutoff = new Date();
    
    switch (timeframe) {
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        cutoff.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
      default:
        cutoff.setMonth(now.getMonth() - 1);
    }

    // Filter, sort chronologically, and format
    return moodChecks
      .filter(m => new Date(m.createdAt) >= cutoff)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(m => {
        const d = new Date(m.createdAt);
        return {
          ...m,
          // Format date for X axis
          dateStr: `${d.getDate()}/${d.getMonth() + 1}`,
          fullDate: d.toLocaleDateString('he-IL'),
          timeStr: d.toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})
        };
      });
  }, [moodChecks, timeframe]);

  if (!moodChecks || moodChecks.length === 0) {
    return <p style={{ color: '#64748b' }}>טרם התקבלו דיווחים מתלמיד זה.</p>;
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: 'white', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{data.fullDate} {data.timeStr}</p>
          <p style={{ margin: 0, color: payload[0].color }}>ציון: {data.ratingValue} / 5</p>
          {data.explanation && <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#64748b' }}>{data.explanation}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <select 
          value={timeframe} 
          onChange={e => setTimeframe(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: 'white' }}
        >
          <option value="week">שבוע אחרון</option>
          <option value="month">חודש אחרון</option>
          <option value="3months">3 חודשים אחרונים</option>
          <option value="year">שנה אחרונה</option>
        </select>
      </div>

      {filteredData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          אין דיווחים בטווח הזמן שנבחר.
        </div>
      ) : (
        <div style={{ width: '100%', height: '300px' }} dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="dateStr" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                domain={[1, 5]} 
                ticks={[1, 2, 3, 4, 5]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="ratingValue" 
                stroke="#6366f1" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: 'white' }} 
                activeDot={{ r: 6, fill: '#4f46e5' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
