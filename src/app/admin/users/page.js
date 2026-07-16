'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Plus, Users, Save } from 'lucide-react';
import styles from './users.module.css';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Single User Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', phoneNumber: '', email: '', role: 'student', groupId: '', managedGroupIds: []
  });

  // Edit User State
  const [editingUserId, setEditingUserId] = useState(null);
  const [editData, setEditData] = useState({});

  // Bulk Actions State
  const [selectedUserIds, setSelectedUserIds] = useState([]);

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
        setFormData({ fullName: '', phoneNumber: '', email: '', role: 'student', groupId: '', managedGroupIds: [] });
        setShowAddForm(false);
        fetchUsers();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert('שגיאה ביצירת משתמש: ' + (errData.error || res.statusText));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [showAddGroup, setShowAddGroup] = useState(false);
  const [groupData, setGroupData] = useState({ name: '', type: 'class' });

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData)
      });
      if (res.ok) {
        alert('קבוצה נוצרה בהצלחה');
        setGroupData({ name: '', type: 'class' });
        setShowAddGroup(false);
        fetchGroups();
      } else {
        alert('שגיאה ביצירת קבוצה');
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

  const handleBulkAction = async (action, data = {}) => {
    if (selectedUserIds.length === 0) return;
    
    if (action === 'delete') {
      if (!window.confirm(`האם אתה בטוח שברצונך למחוק ${selectedUserIds.length} משתמשים? המידע שלהם יימחק מתצוגת בית הספר אך יישמר בענן.`)) return;
    }

    try {
      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUserIds, action, data })
      });
      if (res.ok) {
        alert('הפעולה בוצעה בהצלחה');
        setSelectedUserIds([]);
        fetchUsers();
      } else {
        alert('שגיאה בביצוע הפעולה');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUserIds(users.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (id) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter(userId => userId !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const parsedData = data.map(row => ({
          fullName: row['שם מלא'] || row['name'] || '',
          phoneNumber: row['טלפון'] || row['פלאפון'] || row['phone'] || null,
          email: row['אימייל'] || row['email'] || null,
          role: row['תפקיד'] === 'צוות' || row['תפקיד'] === 'staff' ? 'staff' : 'student'
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
      } catch (err) {
        console.error(err);
        alert('שגיאה בקריאת הקובץ');
      }
    };
    reader.readAsBinaryString(file);
  };

  if (isLoading) return <div style={{padding:'20px'}}>טוען...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1><Users size={28} style={{display:'inline', verticalAlign:'middle'}}/> ניהול משתמשים</h1>
        <p>קליטת תלמידים וצוות, שיוך לקבוצות ועריכת פרטים</p>
      </header>

      <div className={styles.header}>
        <h1>ניהול משתמשים וקבוצות</h1>
        <div style={{display: 'flex', gap: '10px'}}>
          <button className={styles.btnAdd} onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={18} /> משתמש חדש
          </button>
          <button className={styles.btnAdd} onClick={() => setShowAddGroup(!showAddGroup)} style={{backgroundColor: '#4f46e5'}}>
            <Users size={18} /> קבוצה חדשה
          </button>
          <label className={styles.btnUpload}>
            <Upload size={18} /> ייבוא קובץ
            <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" style={{display:'none'}} onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      {showAddGroup && (
        <form onSubmit={handleCreateGroup} className={styles.addForm}>
          <h3>הוספת קבוצה חדשה</h3>
          <div className={styles.formGrid}>
            <input type="text" placeholder="שם הקבוצה (למשל: כיתה ט'1)" value={groupData.name} onChange={e => setGroupData({...groupData, name: e.target.value})} required />
            <select value={groupData.type} onChange={e => setGroupData({...groupData, type: e.target.value})}>
              <option value="class">כיתה אורגנית</option>
              <option value="group">קבוצת עבודה/מגמה</option>
            </select>
          </div>
          <button type="submit" className={styles.btnPrimary}>שמור קבוצה</button>
        </form>
      )}

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
              <option value="admin">מנהל</option>
            </select>
            {formData.role === 'student' ? (
              <select value={formData.groupId} onChange={e => setFormData({...formData, groupId: e.target.value})}>
                <option value="">-- שייך לכיתה/קבוצה --</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            ) : (
              <div>
                <small style={{display:'block', marginBottom:'5px', color:'#64748b'}}>ניתן לבחור מספר כיתות עם Ctrl</small>
                <select multiple value={formData.managedGroupIds} onChange={e => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setFormData({...formData, managedGroupIds: values});
                }} style={{ height: '80px', width: '100%' }}>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <button type="submit" className={styles.btnPrimary}>שמור</button>
        </form>
      )}

      <div className={styles.tableContainer}>
        {selectedUserIds.length > 0 && (
          <div style={{ padding: '10px', backgroundColor: '#f1f5f9', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <strong>פעולות ל-{selectedUserIds.length} משתמשים:</strong>
            <button onClick={() => handleBulkAction('delete')} style={{ backgroundColor: '#ef4444', color: 'white', padding: '5px 10px', borderRadius: '5px', border: 'none' }}>מחק</button>
            <select onChange={(e) => { if(e.target.value) handleBulkAction('update_group', { groupId: e.target.value }) }} style={{ padding: '5px' }}>
              <option value="">-- שייך לקבוצה --</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <select onChange={(e) => { if(e.target.value) handleBulkAction('update_status', { status: e.target.value }) }} style={{ padding: '5px' }}>
              <option value="">-- שנה סטטוס --</option>
              <option value="active">פעיל</option>
              <option value="suspended">מושהה</option>
            </select>
          </div>
        )}
        <table className={styles.table}>
          <thead>
            <tr>
              <th><input type="checkbox" onChange={handleSelectAll} checked={selectedUserIds.length === users.length && users.length > 0} /></th>
              <th>שם מלא</th>
              <th>תפקיד</th>
              <th>קבוצה/כיתה</th>
              <th>טלפון</th>
              <th>סטטוס</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ opacity: u.status === 'suspended' ? 0.6 : 1 }}>
                <td><input type="checkbox" checked={selectedUserIds.includes(u.id)} onChange={() => handleSelectUser(u.id)} /></td>
                <td>
                  {editingUserId === u.id ? (
                    <input type="text" value={editData[u.id]?.fullName ?? u.fullName} onChange={e => setEditData({...editData, [u.id]: {...editData[u.id], fullName: e.target.value}})} style={{width: '100px'}} />
                  ) : u.fullName}
                </td>
                <td>
                  {editingUserId === u.id ? (
                    <select value={editData[u.id]?.role ?? u.role} onChange={e => setEditData({...editData, [u.id]: {...editData[u.id], role: e.target.value}})}>
                      <option value="student">חניך</option>
                      <option value="staff">צוות</option>
                      <option value="admin">מנהל</option>
                    </select>
                  ) : (u.role === 'student' ? 'חניך' : u.role === 'staff' ? 'צוות' : 'מנהל')}
                </td>
                <td>
                  {editingUserId === u.id ? (
                    (editData[u.id]?.role ?? u.role) === 'student' ? (
                      <select 
                        value={editData[u.id]?.groupId || u.groupId || ''}
                        onChange={e => setEditData({...editData, [u.id]: {...editData[u.id], groupId: e.target.value}})}
                      >
                        <option value="">-- בחר --</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    ) : (
                      <select 
                        multiple 
                        value={editData[u.id]?.managedGroupIds ?? (u.managedGroups?.map(mg => mg.id) || [])}
                        onChange={e => {
                          const values = Array.from(e.target.selectedOptions, option => option.value);
                          setEditData({...editData, [u.id]: {...editData[u.id], managedGroupIds: values}});
                        }}
                        style={{ height: '60px' }}
                      >
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    )
                  ) : (
                    u.role === 'student' ? (u.group?.name || '-') : (u.managedGroups?.map(mg => mg.name).join(', ') || 'הכל')
                  )}
                </td>
                <td>
                  {editingUserId === u.id ? (
                    <input 
                      type="text" 
                      value={editData[u.id]?.phoneNumber ?? u.phoneNumber ?? ''} 
                      onChange={e => setEditData({...editData, [u.id]: {...editData[u.id], phoneNumber: e.target.value}})}
                      style={{width: '100px'}}
                    />
                  ) : (
                    u.phoneNumber || '-'
                  )}
                </td>
                <td>
                  {editingUserId === u.id ? (
                    <select value={editData[u.id]?.status ?? u.status} onChange={e => setEditData({...editData, [u.id]: {...editData[u.id], status: e.target.value}})}>
                      <option value="active">פעיל</option>
                      <option value="suspended">מושהה</option>
                    </select>
                  ) : (u.status === 'suspended' ? <span style={{color: 'red'}}>מושהה</span> : 'פעיל')}
                </td>
                <td>
                  {editingUserId === u.id ? (
                    <button onClick={() => handleUpdateUser(u.id)} className={styles.btnAction}><Save size={16}/></button>
                  ) : (
                    <button onClick={() => { setEditingUserId(u.id); setEditData({...editData, [u.id]: u}); }} className={styles.btnAction}>ערוך</button>
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
