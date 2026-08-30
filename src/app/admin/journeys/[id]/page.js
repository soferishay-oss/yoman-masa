'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { Map, Plus, Trash2, Edit2, Check, Lock, Unlock, ArrowRight, Save, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function AdminJourneyEditorPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const [journey, setJourney] = useState(null);
  const [stations, setStations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // New station state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStationTitle, setNewStationTitle] = useState('');
  const [newStationDesc, setNewStationDesc] = useState('');

  useEffect(() => {
    fetchJourney();
  }, [params.id]);

  const fetchJourney = async () => {
    try {
      const res = await fetch(`/api/admin/journeys/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setJourney(data);
        setStations(data.stations || []);
      } else {
        router.push('/admin/journeys');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStation = async () => {
    if (!newStationTitle.trim()) return;
    try {
      const res = await fetch(`/api/admin/journeys/${params.id}/stations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newStationTitle, 
          description: newStationDesc,
          questions: [
            { id: 'q1', type: 'textarea', label: 'סכם את היום במילים שלך' }
          ]
        })
      });
      if (res.ok) {
        toast.show('תחנה נוצרה בהצלחה');
        setShowCreateModal(false);
        setNewStationTitle('');
        setNewStationDesc('');
        fetchJourney();
      }
    } catch (e) {
      toast.show('שגיאת רשת', 'error');
    }
  };

  const toggleStationStatus = async (station) => {
    try {
      const res = await fetch(`/api/admin/journeys/stations/${station.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: !station.isOpen })
      });
      if (res.ok) {
        setStations(stations.map(s => s.id === station.id ? { ...s, isOpen: !s.isOpen } : s));
        toast.show(station.isOpen ? 'התחנה ננעלה' : 'התחנה נפתחה לתלמידים!');
      }
    } catch (e) {}
  };

  const deleteStation = async (id) => {
    if (!window.confirm('האם אתה בטוח? כל תשובות התלמידים לתחנה זו יימחקו!')) return;
    try {
      const res = await fetch(`/api/admin/journeys/stations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStations(stations.filter(s => s.id !== id));
        toast.show('התחנה נמחקה');
      }
    } catch (e) {}
  };

  if (isLoading) return <div style={{ padding: '20px' }}>טוען...</div>;
  if (!journey) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', paddingBottom: '100px' }}>
      <header style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', cursor: 'pointer', marginBottom: '15px' }} onClick={() => router.push('/admin/journeys')}>
          <ArrowRight size={16} /> חזרה לכל המסעות
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Map color="var(--primary-color)" /> {journey.title}
            </h1>
            <p style={{ margin: 0, color: '#475569' }}>{journey.description}</p>
          </div>
          
          <button 
            onClick={() => router.push(`/admin/journeys/${journey.id}/dashboard`)}
            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
          >
            <LayoutDashboard size={18} /> דשבורד תשובות
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>תחנות המסע ({stations.length})</h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          style={{ background: 'white', color: 'var(--primary-color)', border: '2px solid var(--primary-color)', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
        >
          <Plus size={18} /> הוסף תחנה/יום
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {stations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            <p style={{ color: '#64748b' }}>עדיין לא נוצרו תחנות למסע זה.</p>
          </div>
        ) : (
          stations.map((s, index) => (
            <div key={s.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', gap: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: s.isOpen ? '#dcfce7' : '#f1f5f9', color: s.isOpen ? '#166534' : '#475569', width: '50px', height: '50px', borderRadius: '50%', fontWeight: 'bold', fontSize: '18px', flexShrink: 0 }}>
                {index + 1}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: '0 0 5px 0' }}>{s.title}</h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => toggleStationStatus(s)}
                      style={{ background: s.isOpen ? '#fef2f2' : '#ecfdf5', color: s.isOpen ? '#ef4444' : '#10b981', border: `1px solid ${s.isOpen ? '#fca5a5' : '#6ee7b7'}`, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 'bold' }}
                    >
                      {s.isOpen ? <><Lock size={14} /> נעל תחנה</> : <><Unlock size={14} /> שחרר תחנה</>}
                    </button>
                    <button 
                      onClick={() => deleteStation(s.id)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <p style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '14px' }}>{s.description || 'ללא תיאור'}</p>
                
                <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#475569', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                  <div><strong>מספר שאלות:</strong> {s.questions?.length || 0}</div>
                  <div><strong>תשובות שהוגשו:</strong> {s._count?.responses || 0}</div>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
            <h2 style={{ marginTop: 0 }}>הוספת תחנה / יום</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>שם התחנה</label>
              <input 
                type="text" 
                value={newStationTitle} 
                onChange={e => setNewStationTitle(e.target.value)}
                placeholder='לדוגמה: היום הראשון - הרי אילת'
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>הנחיות לתלמיד (אופציונלי)</label>
              <textarea 
                value={newStationDesc} 
                onChange={e => setNewStationDesc(e.target.value)}
                placeholder="הסבר קצר על מה שעברנו היום"
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '80px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '10px 15px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ביטול
              </button>
              <button 
                onClick={handleCreateStation}
                disabled={!newStationTitle.trim()}
                style={{ padding: '10px 15px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', opacity: !newStationTitle.trim() ? 0.5 : 1 }}
              >
                שמור תחנה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
