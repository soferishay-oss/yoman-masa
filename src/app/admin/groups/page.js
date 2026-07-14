'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, LayoutGrid } from 'lucide-react';
import styles from '../users/users.module.css';

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'class', description: '' });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/admin/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('קבוצה נוצרה בהצלחה');
        setFormData({ name: '', type: 'class', description: '' });
        setShowAddForm(false);
        fetchGroups();
      } else {
        alert('שגיאה ביצירת קבוצה');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div style={{padding:'20px'}}>טוען...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1><LayoutGrid size={28} style={{display:'inline', verticalAlign:'middle'}}/> ניהול קבוצות וכיתות</h1>
        <p>הקמת קבוצות לימוד, כיתות או קבוצות משימה מיוחדות</p>
      </header>

      <div className={styles.actionsBar}>
        <button onClick={() => setShowAddForm(!showAddForm)} className={styles.btnPrimary}>
          <Plus size={18} /> יצירת קבוצה חדשה
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateGroup} className={styles.addForm}>
          <h3>הוספת קבוצה חדשה</h3>
          <div className={styles.formGrid}>
            <input type="text" placeholder="שם הקבוצה (למשל: כיתה ט' 1)" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option value="class">כיתה אורגנית</option>
              <option value="group">קבוצת פרויקט/מסע</option>
              <option value="staff">קבוצת צוות</option>
            </select>
            <input type="text" placeholder="תיאור קצר (אופציונלי)" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <button type="submit" className={styles.btnPrimary}>שמור</button>
        </form>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>שם קבוצה/כיתה</th>
              <th>סוג</th>
              <th>תיאור</th>
              <th>מספר חברים</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(g => (
              <tr key={g.id}>
                <td style={{fontWeight: 500}}>{g.name}</td>
                <td>{g.type === 'class' ? 'כיתה' : g.type === 'staff' ? 'צוות' : 'קבוצה'}</td>
                <td>{g.description || '-'}</td>
                <td>
                  <span style={{display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#e2e8f0', padding: '3px 10px', borderRadius: '20px'}}>
                    <Users size={14}/> {g._count?.users || 0}
                  </span>
                </td>
              </tr>
            ))}
            {groups.length === 0 && (
              <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>אין קבוצות במערכת</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
