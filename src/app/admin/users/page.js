'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Upload, Plus, Users, Save } from 'lucide-react';
import styles from './users.module.css';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Single User Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', phoneNumber: '', email: '', role: 'student', groupId: ''
  });

  // Edit User State
  const [editingUserId, setEditingUserId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/admin/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('משתמש נוצר בהצלחה');
        setFormData({ fullName: '', phoneNumber: '', email: '', role: 'student', groupId: '' });
        setShowAddForm(false);
        fetchUsers();
      } else {
        alert('שגיאה ביצירת משתמש');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUser = async (id) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData[id])
      });
      if (res.ok) {
        alert('עודכן בהצלחה');
        setEditingUserId(null);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async function(results) {
        const parsedData = results.data.map(row => ({
          fullName: row['שם מלא'] || row['name'] || '',
          phoneNumber: row['טלפון'] || row['phone'] || null,
          email: row['אימייל'] || row['email'] || null,
          role: row['תפקיד'] === 'צוות' ? 'staff' : 'student'
        }));

        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedData)
        });

        if (res.ok) {
          const resData = await res.json();
          alert(resData.message);
          fetchUsers();
        } else {
          alert('שגיאה בהעלאת קובץ');
        }
      }
    });
  };

  if (isLoading) return <div style={{padding:'20px'}}>טוען...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1><Users size={28} style={{display:'inline', verticalAlign:'middle'}}/> ניהול משתמשים</h1>
        <p>קליטת תלמידים וצוות, שיוך לקבוצות ועריכת פרטים</p>
      </header>

      <div className={styles.actionsBar}>
        <button onClick={() => setShowAddForm(!showAddForm)} className={styles.btnPrimary}>
          <Plus size={18} /> הוסף משתמש בודד
        </button>
        
        <label className={styles.btnSecondary}>
          <Upload size={18} /> ייבוא מאקסל (CSV)
          <input type="file" accept=".csv" style={{display:'none'}} onChange={handleFileUpload} />
        </label>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateUser} className={styles.addForm}>
          <h3>הוספת משתמש חדש</h3>
          <div className={styles.formGrid}>
            <input type="text" placeholder="שם מלא" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required />
            <input type="text" placeholder="טלפון" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
            <input type="email" placeholder="אימייל" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="student">חניך</option>
              <option value="staff">איש צוות</option>
            </select>
            <select value={formData.groupId} onChange={e => setFormData({...formData, groupId: e.target.value})}>
              <option value="">-- ללא קבוצה --</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <button type="submit" className={styles.btnPrimary}>שמור</button>
        </form>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>שם מלא</th>
              <th>תפקיד</th>
              <th>קבוצה/כיתה</th>
              <th>טלפון</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.fullName}</td>
                <td>{u.role === 'student' ? 'חניך' : u.role === 'staff' ? 'צוות' : 'מנהל'}</td>
                <td>
                  {editingUserId === u.id ? (
                    <select 
                      value={editData[u.id]?.groupId || u.groupId || ''}
                      onChange={e => setEditData({...editData, [u.id]: {...editData[u.id], groupId: e.target.value}})}
                    >
                      <option value="">-- בחר --</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  ) : (
                    u.group?.name || '-'
                  )}
                </td>
                <td>
                  {editingUserId === u.id ? (
                    <input 
                      type="text" 
                      value={editData[u.id]?.phoneNumber ?? u.phoneNumber ?? ''} 
                      onChange={e => setEditData({...editData, [u.id]: {...editData[u.id], phoneNumber: e.target.value}})}
                    />
                  ) : (
                    u.phoneNumber || '-'
                  )}
                </td>
                <td>
                  {editingUserId === u.id ? (
                    <button onClick={() => handleUpdateUser(u.id)} className={styles.btnAction}><Save size={16}/></button>
                  ) : (
                    <button onClick={() => setEditingUserId(u.id)} className={styles.btnAction}>ערוך</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
