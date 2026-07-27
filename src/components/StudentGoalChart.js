'use client';

import AppDate from './AppDate';

export default function StudentGoalChart({ goal }) {
  if (!goal.updates || goal.updates.length === 0) {
    return <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>טרם עודכן.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', paddingRight: '5px' }}>
      {goal.updates.map(update => (
        <div key={update.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '20px' }}>
            {update.rating === 1 ? '🔴' : update.rating === 2 ? '🟡' : update.rating === 3 ? '🟢' : '⚪'}
          </div>
          <div style={{ flex: 1, fontSize: '14px', color: '#334155' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
              <AppDate date={update.createdAt} />
            </div>
            <div>{update.reflection || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>ללא מלל</span>}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
