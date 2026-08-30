'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, LayoutDashboard, Search, Image as ImageIcon, Mic } from 'lucide-react';
import AppDate from '@/components/AppDate';

export default function AdminJourneyDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const [journey, setJourney] = useState(null);
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStation, setFilterStation] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [jRes, rRes] = await Promise.all([
        fetch(`/api/staff/journeys/${params.id}`),
        fetch(`/api/staff/journeys/${params.id}/responses`)
      ]);
      
      if (jRes.ok && rRes.ok) {
        setJourney(await jRes.json());
        setResponses(await rRes.json());
      } else {
        router.push('/staff/journeys');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div style={{ padding: '20px' }}>טוען...</div>;
  if (!journey) return null;

  const filteredResponses = responses.filter(r => {
    if (filterStation !== 'all' && r.station.id !== filterStation) return false;
    if (searchQuery && !r.user.fullName.includes(searchQuery)) return false;
    return true;
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', paddingBottom: '100px' }}>
      <header style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', cursor: 'pointer', marginBottom: '15px' }} onClick={() => router.push(`/staff/journeys/${journey.id}`)}>
          <ArrowRight size={16} /> חזרה לעריכת מסע
        </div>
        
        <h1 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LayoutDashboard color="#3b82f6" /> דשבורד תשובות: {journey.title}
        </h1>
        <p style={{ margin: 0, color: '#475569' }}>צפה בכל התשובות והחוויות של התלמידים מהמסע</p>
      </header>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>סינון לפי תחנה</label>
          <select 
            value={filterStation}
            onChange={e => setFilterStation(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="all">כל התחנות</option>
            {journey.stations.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
        
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#475569' }}>חיפוש תלמיד</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', right: '10px', top: '10px', color: '#94a3b8' }} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="שם התלמיד..."
              style={{ width: '100%', padding: '10px 35px 10px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '15px' }}>
        {filteredResponses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            <p style={{ color: '#64748b' }}>לא נמצאו תשובות התואמות לחיפוש.</p>
          </div>
        ) : (
          filteredResponses.map(r => (
            <div key={r.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{r.user.fullName}</h3>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    {r.user.class?.name || 'ללא כיתה'} | תחנה: {r.station.title}
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  <AppDate date={r.createdAt} />
                </div>
              </div>

              {/* Render answers */}
              <div style={{ marginBottom: '15px' }}>
                {Object.entries(r.answers || {}).map(([key, val]) => {
                  const question = (r.station.questions || []).find(q => q.id === key);
                  const label = question ? question.label : (key === 'q1' ? 'תשובה' : key);
                  return (
                    <div key={key} style={{ marginBottom: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#475569', marginBottom: '5px' }}>{label}</div>
                      <div style={{ whiteSpace: 'pre-wrap', color: '#1e293b' }}>{val || 'לא השיב'}</div>
                    </div>
                  );
                })}
              </div>

              {/* Render Media */}
              {r.mediaUrls && r.mediaUrls.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f1f5f9' }}>
                  {r.mediaUrls.map((url, i) => {
                    const isAudio = url.match(/\.(webm|mp4|mp3|wav|ogg)$/i) || url.startsWith('blob:');
                    if (isAudio) {
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f8fafc', padding: '8px 12px', borderRadius: '20px', fontSize: '13px', color: '#475569' }}>
                          <Mic size={16} color="#3b82f6" />
                          <audio src={url} controls style={{ height: '30px', width: '200px' }} />
                        </div>
                      );
                    } else {
                      return (
                        <a key={i} href={url} target="_blank" rel="noreferrer" style={{ display: 'block', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                          <img src={url} alt="Attachment" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                        </a>
                      );
                    }
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
