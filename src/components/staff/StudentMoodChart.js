'use client';

import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatAppDateString } from '@/components/AppDate';

export default function StudentMoodChart({ moodChecks }) {
  const [timeframe, setTimeframe] = useState('month');
  const [selectedNote, setSelectedNote] = useState(null);

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
          fullDate: formatAppDateString(d),
          timeStr: d.toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})
        };
      });
  }, [moodChecks, timeframe]);

  if (!moodChecks || moodChecks.length === 0) {
    return <p style={{ color: '#64748b' }}>טרם התקבלו דיווחים מתלמיד זה.</p>;
  }

  // Hover tooltips are removed per user request

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
        <div>
          <div style={{ width: '100%', height: '180px' }} dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={filteredData} 
                margin={{ top: 15, right: 30, left: 20, bottom: 5 }}
                onClick={(state) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    setSelectedNote(state.activePayload[0].payload);
                  }
                }}
              >
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
          {selectedNote && (
            <div style={{ marginTop: '15px', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#0f172a' }}>
                {selectedNote.fullDate} {selectedNote.timeStr} <span style={{ color: '#6366f1' }}>| ציון: {selectedNote.ratingValue}/5</span>
              </p>
              {selectedNote.explanation ? (
                <p style={{ margin: 0, color: '#334155' }}>{selectedNote.explanation}</p>
              ) : (
                <p style={{ margin: 0, color: '#94a3b8', fontStyle: 'italic' }}>לא נכתבה הערה לדיווח זה</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
