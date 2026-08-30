'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Map, ArrowRight, CheckCircle2 } from 'lucide-react';


export default function StudentJourneysPage() {
  const router = useRouter();
  const [journeys, setJourneys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJourneys();
  }, []);

  const fetchJourneys = async () => {
    try {
      const res = await fetch('/api/student/journeys');
      if (res.ok) {
        setJourneys(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div style={{ padding: '20px' }}>טוען...</div>;

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 5px 0' }}>
          <Map color="var(--primary-color)" /> המסעות שלי
        </h1>
        <p style={{ margin: 0, color: '#64748b' }}>עקוב ותעד את החוויות מהמסעות השונים</p>
      </header>

      {journeys.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <p style={{ color: '#475569' }}>אין מסעות פעילים כרגע.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {journeys.map(j => (
            <div key={j.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h2 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{j.title}</h2>
              <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '14px' }}>{j.description}</p>

              {j.stations?.length === 0 ? (
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                  טרם נפתחו תחנות למסע זה.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {j.stations.map((s, idx) => {
                    const hasAnswered = s.responses && s.responses.length > 0;
                    const responseDate = hasAnswered ? new Date(s.responses[0].createdAt) : null;
                    const isEditable = !hasAnswered || (responseDate && responseDate.toDateString() === new Date().toDateString());
                    
                    return (
                      <div 
                        key={s.id}
                        onClick={() => {
                          if (isEditable) router.push(`/journeys/${s.id}`);
                        }}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: hasAnswered ? '#f0fdf4' : '#f8fafc', padding: '15px', borderRadius: '12px', cursor: isEditable ? 'pointer' : 'default', border: `1px solid ${hasAnswered ? '#bbf7d0' : '#e2e8f0'}`, opacity: isEditable ? 1 : 0.7 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div style={{ background: hasAnswered ? '#22c55e' : 'var(--primary-color)', color: 'white', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {idx + 1}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, color: '#334155' }}>{s.title}</h4>
                            {hasAnswered && (
                              <span style={{ fontSize: '12px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                                <CheckCircle2 size={12} /> הושלם {isEditable ? '(ניתן לעריכה היום)' : 'בהצלחה'}
                              </span>
                            )}
                          </div>
                        </div>
                        {isEditable && <ArrowRight color={hasAnswered ? '#22c55e' : '#cbd5e1'} size={20} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
