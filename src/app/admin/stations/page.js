'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Calendar } from 'lucide-react';
import styles from '../users/users.module.css'; // Reusing admin styles

export default function AdminStationsPage() {
  const [stations, setStations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    stationType: 'milestone',
    dateMode: 'fixed',
    scheduledDate: '',
    orderIndex: 0
  });

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const res = await fetch('/api/admin/stations');
      if (res.ok) {
        const data = await res.json();
        setStations(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStation = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('תחנה נוצרה בהצלחה');
        setFormData({ name: '', stationType: 'milestone', dateMode: 'fixed', scheduledDate: '', orderIndex: stations.length + 1 });
        setShowAddForm(false);
        fetchStations();
      } else {
        alert('שגיאה ביצירת תחנה');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div style={{padding:'20px'}}>טוען...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1><MapPin size={28} style={{display:'inline', verticalAlign:'middle'}}/> מחולל מסעות ותחנות</h1>
        <p>הגדרת התחנות שיופיעו ביומן המסע של החניכים לאורך השנה</p>
      </header>

      <div className={styles.actionsBar}>
        <button onClick={() => setShowAddForm(!showAddForm)} className={styles.btnPrimary}>
          <Plus size={18} /> הוספת תחנה חדשה
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateStation} className={styles.addForm}>
          <h3>הגדרת תחנה למסע</h3>
          <div className={styles.formGrid}>
            <input type="text" placeholder="שם התחנה (למשל: מסע בראשית)" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            
            <select value={formData.stationType} onChange={e => setFormData({...formData, stationType: e.target.value})}>
              <option value="milestone">אבן דרך (מסע/סמינריון)</option>
              <option value="routine">שגרה (שבת חניכים)</option>
              <option value="content">תוכן/נושא חודשי</option>
            </select>
            
            <select value={formData.dateMode} onChange={e => setFormData({...formData, dateMode: e.target.value})}>
              <option value="fixed">תאריך קבוע</option>
              <option value="relative">תאריך יחסי</option>
              <option value="manual">ללא תאריך (ידני)</option>
            </select>
            
            {formData.dateMode === 'fixed' && (
              <input type="date" value={formData.scheduledDate} onChange={e => setFormData({...formData, scheduledDate: e.target.value})} required />
            )}
            
            <input type="number" placeholder="סדר (מספר)" value={formData.orderIndex} onChange={e => setFormData({...formData, orderIndex: e.target.value})} required />
          </div>
          <button type="submit" className={styles.btnPrimary}>שמור תחנה</button>
        </form>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>סדר</th>
              <th>שם התחנה</th>
              <th>סוג</th>
              <th>תאריך מתוכנן</th>
              <th>סטטוס</th>
            </tr>
          </thead>
          <tbody>
            {stations.map((s, index) => (
              <tr key={s.id}>
                <td>{s.orderIndex}</td>
                <td style={{fontWeight: 500}}>{s.name}</td>
                <td>{s.stationType === 'milestone' ? 'אבן דרך' : s.stationType === 'routine' ? 'שגרה' : 'תוכן'}</td>
                <td>{s.scheduledDate ? new Date(s.scheduledDate).toLocaleDateString('he-IL') : 'לא נקבע'}</td>
                <td>
                  <span style={{color: s.status === 'active' ? 'green' : 'gray'}}>{s.status === 'active' ? 'פעיל' : 'כבוי'}</span>
                </td>
              </tr>
            ))}
            {stations.length === 0 && (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>אין תחנות במסע. לחץ על 'הוספת תחנה חדשה'.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
