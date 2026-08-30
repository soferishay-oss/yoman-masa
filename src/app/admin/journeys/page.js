'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { Map, Plus, Trash2, ArrowRight } from 'lucide-react';

export default function AdminJourneysPage() {
  const router = useRouter();
  const toast = useToast();
  const [journeys, setJourneys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    fetchJourneys();
  }, []);

  const fetchJourneys = async () => {
    try {
      const res = await fetch('/api/admin/journeys');
      if (res.ok) {
        setJourneys(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch('/api/admin/journeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDesc })
      });
      if (res.ok) {
        const created = await res.json();
        setJourneys([created, ...journeys]);
        setShowCreateModal(false);
        setNewTitle('');
        setNewDesc('');
        router.push(`/admin/journeys/${created.id}`);
      } else {
        toast.show('שגיאה ביצירת מסע', 'error');
      }
    } catch (e) {
      toast.show('שגיאת רשת', 'error');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('האם אתה בטוח? כל התחנות והתשובות יימחקו!')) return;
    try {
      const res = await fetch(`/api/admin/journeys/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setJourneys(journeys.filter(j => j.id !== id));
        toast.show('נמחק בהצלחה');
      }
    } catch (e) {}
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', paddingBottom: '100px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <Map color="var(--primary-color)" /> ניהול מסעות
        </h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
        >
          <Plus size={18} /> מסע חדש
        </button>
      </header>

      {isLoading ? (
        <p>טוען...</p>
      ) : journeys.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', background: '#f8fafc', borderRadius: '8px' }}>
          <h3>אין מסעות פעילים</h3>
          <p>צור את מסע הפתיחה או את המסע המתגלגל הראשון שלך!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {journeys.map(j => (
            <div 
              key={j.id} 
              onClick={() => router.push(`/admin/journeys/${j.id}`)}
              style={{ background: 'white', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
            >
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{j.title}</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{j.description}</p>
                <div style={{ marginTop: '10px', fontSize: '13px', color: '#3b82f6', fontWeight: 'bold' }}>
                  {j._count?.stations || 0} תחנות
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button 
                  onClick={(e) => handleDelete(e, j.id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}
                  title="מחק מסע"
                >
                  <Trash2 size={20} />
                </button>
                <ArrowRight color="#cbd5e1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
            <h2 style={{ marginTop: 0 }}>יצירת מסע חדש</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>שם המסע</label>
              <input 
                type="text" 
                value={newTitle} 
                onChange={e => setNewTitle(e.target.value)}
                placeholder='לדוגמה: יומן מסע פתיחה תשפ"ז'
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>תיאור (אופציונלי)</label>
              <textarea 
                value={newDesc} 
                onChange={e => setNewDesc(e.target.value)}
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
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                style={{ padding: '10px 15px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', opacity: !newTitle.trim() ? 0.5 : 1 }}
              >
                צור מסע והמשך לעריכה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
