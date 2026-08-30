'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';
import { Map, Plus, Trash2, Edit2, Check, Lock, Unlock, ArrowRight, Save, LayoutDashboard, X } from 'lucide-react';
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

  // Editing station state
  const [editingStation, setEditingStation] = useState(null);

  useEffect(() => {
    fetchJourney();
  }, [params.id]);

  const fetchJourney = async () => {
    try {
      const res = await fetch(`/api/staff/journeys/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setJourney(data);
        setStations(data.stations || []);
      } else {
        router.push('/staff/journeys');
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
      const res = await fetch(`/api/staff/journeys/${params.id}/stations`, {
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

  const handleSaveEdit = async () => {
    if (!editingStation || !editingStation.title.trim()) return;
    try {
      const res = await fetch(`/api/staff/journeys/stations/${editingStation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: editingStation.title,
          description: editingStation.description,
          questions: editingStation.questions,
          unlockAt: editingStation.unlockAt
        })
      });
      if (res.ok) {
        toast.show('נשמר בהצלחה');
        setEditingStation(null);
        fetchJourney();
      }
    } catch (e) {
      toast.show('שגיאת רשת', 'error');
    }
  };

  const toggleStationStatus = async (station) => {
    try {
      const res = await fetch(`/api/staff/journeys/stations/${station.id}`, {
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
      const res = await fetch(`/api/staff/journeys/stations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStations(stations.filter(s => s.id !== id));
        toast.show('התחנה נמחקה');
      }
    } catch (e) {}
  };

  const updateEditingQuestion = (index, field, value) => {
    const updatedQs = [...(editingStation.questions || [])];
    updatedQs[index] = { ...updatedQs[index], [field]: value };
    setEditingStation({ ...editingStation, questions: updatedQs });
  };

  const addQuestion = () => {
    const updatedQs = [...(editingStation.questions || [])];
    updatedQs.push({ id: 'q_' + Date.now(), type: 'open', label: 'שאלה חדשה' });
    setEditingStation({ ...editingStation, questions: updatedQs });
  };

  const removeQuestion = (index) => {
    const updatedQs = [...(editingStation.questions || [])];
    updatedQs.splice(index, 1);
    setEditingStation({ ...editingStation, questions: updatedQs });
  };

  if (isLoading) return <div style={{ padding: '20px' }}>טוען...</div>;
  if (!journey) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', paddingBottom: '100px' }}>
      <header style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', cursor: 'pointer', marginBottom: '15px' }} onClick={() => router.push('/staff/journeys')}>
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
            onClick={() => router.push(`/staff/journeys/${journey.id}/dashboard`)}
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
                      onClick={() => setEditingStation(JSON.parse(JSON.stringify(s)))}
                      style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 'bold' }}
                    >
                      <Edit2 size={14} /> ערוך
                    </button>
                    <button 
                      onClick={() => toggleStationStatus(s)}
                      style={{ background: s.isOpen ? '#fef2f2' : '#ecfdf5', color: s.isOpen ? '#ef4444' : '#10b981', border: `1px solid ${s.isOpen ? '#fca5a5' : '#6ee7b7'}`, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 'bold' }}
                    >
                      {s.isOpen ? <><Lock size={14} /> נעל תחנה</> : <><Unlock size={14} /> שחרר לתלמידים</>}
                    </button>
                    <button 
                      onClick={() => deleteStation(s.id)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                {s.description && (
                  <div style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '14px' }}>
                    {s.description}
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#475569', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                  <div><strong>מספר שאלות:</strong> {s.questions ? (Array.isArray(s.questions) ? s.questions.length : 0) : 0}</div>
                  <div><strong>תשובות שהוגשו:</strong> {s._count?.responses || 0}</div>
                  {s.unlockAt && !s.isOpen && <div><strong>מתוזמן ל:</strong> {new Date(s.unlockAt).toLocaleString('he-IL')}</div>}
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

      {editingStation && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>עריכת תחנה</h2>
              <button onClick={() => setEditingStation(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#64748b" /></button>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>שם התחנה</label>
              <input 
                type="text" 
                value={editingStation.title || ''} 
                onChange={e => setEditingStation({...editingStation, title: e.target.value})}
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>תזמון שחרור אוטומטי (אופציונלי)</label>
              <input 
                type="datetime-local" 
                value={editingStation.unlockAt ? new Date(new Date(editingStation.unlockAt).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} 
                onChange={e => setEditingStation({...editingStation, unlockAt: e.target.value ? new Date(e.target.value).toISOString() : null})}
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontFamily: 'inherit' }}
              />
              <p style={{ fontSize: '12px', color: '#64748b', margin: '5px 0 0 0' }}>אם תגדיר תאריך ושעה, התחנה תיפתח אוטומטית בזמן הזה ולא תצטרך ללחוץ על 'שחרר'.</p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>הנחיות לתלמיד (אופציונלי)</label>
              <textarea 
                value={editingStation.description || ''} 
                onChange={e => setEditingStation({...editingStation, description: e.target.value})}
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '60px' }}
              />
            </div>

            <div style={{ marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>שאלות משו"ב</h3>
                <button 
                  onClick={addQuestion}
                  style={{ background: 'white', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}
                >
                  <Plus size={14} /> הוסף שאלה
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(editingStation.questions || []).map((q, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ flex: 1 }}>
                      <input 
                        type="text" 
                        value={q.label || ''} 
                        onChange={e => updateEditingQuestion(idx, 'label', e.target.value)}
                        placeholder="נוסח השאלה..."
                        style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '5px' }}
                      />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <select 
                          value={q.type || 'open'} 
                          onChange={e => updateEditingQuestion(idx, 'type', e.target.value)}
                          style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                        >
                          <option value="open">שאלה פתוחה (טקסט)</option>
                          <option value="rating">דירוג (1-5)</option>
                        </select>
                        <input 
                          type="text" 
                          value={q.id || ''} 
                          onChange={e => updateEditingQuestion(idx, 'id', e.target.value)}
                          placeholder="מזהה פנימי (למשל mood)"
                          style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', width: '150px' }}
                          title="מזהה למערכת (באנגלית). למשל 'mood' ישפיע על מצב הרוח, 'goal_1' ישפיע על יעדים."
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => removeQuestion(idx)}
                      style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {(!editingStation.questions || editingStation.questions.length === 0) && (
                  <p style={{ margin: 0, color: '#64748b', fontSize: '14px', textAlign: 'center' }}>אין שאלות. התלמיד יראה רק את ההנחיות.</p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 'auto' }}>
              <button 
                onClick={() => setEditingStation(null)}
                style={{ padding: '12px 20px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ביטול
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={!editingStation.title.trim()}
                style={{ padding: '12px 20px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Save size={18} /> שמור שינויים
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
