'use client';

import { useState, useEffect } from 'react';
import { Users, Edit, Plus, Trash2, Shield, UserCheck } from 'lucide-react';
import styles from './groups.module.css';

export default function AdminGroups() {
  const [groups, setGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  
  // Modal state
  const [formData, setFormData] = useState({
    name: '',
    type: 'class',
    description: '',
    managerIds: [],
    studentIds: [],
    dutyStudentIds: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [groupsRes, usersRes] = await Promise.all([
        fetch('/api/admin/groups'),
        fetch('/api/admin/users')
      ]);
      
      if (groupsRes.ok && usersRes.ok) {
        setGroups(await groupsRes.json());
        setAllUsers(await usersRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const staffUsers = allUsers.filter(u => u.role === 'staff' || u.role === 'admin');
  const studentUsers = allUsers.filter(u => u.role === 'student');

  const handleOpenModal = (group = null) => {
    if (group) {
      setEditingGroup(group);
      
      // Find students belonging to this group
      const groupStudents = studentUsers.filter(u => u.groupId === group.id);
      
      setFormData({
        name: group.name,
        type: group.type,
        description: group.description || '',
        managerIds: group.managers ? group.managers.map(m => m.id) : [],
        studentIds: groupStudents.map(s => s.id),
        dutyStudentIds: groupStudents.filter(s => s.isDutyStudent).map(s => s.id)
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: '',
        type: 'class',
        description: '',
        managerIds: [],
        studentIds: [],
        dutyStudentIds: []
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
  };

  const toggleSelection = (field, id) => {
    setFormData(prev => {
      const arr = prev[field];
      if (arr.includes(id)) {
        return { ...prev, [field]: arr.filter(item => item !== id) };
      } else {
        return { ...prev, [field]: [...arr, id] };
      }
    });
  };

  const handleSave = async () => {
    try {
      if (editingGroup) {
        // Update
        const res = await fetch(`/api/admin/groups/${editingGroup.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          fetchData();
          handleCloseModal();
        }
      } else {
        // Create
        // Note: Our POST /api/admin/groups currently only accepts name, type, description
        // For a full fix, we create it first, then update it with the relations
        const res = await fetch('/api/admin/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name, type: formData.type, description: formData.description })
        });
        
        if (res.ok) {
          const newGroup = await res.json();
          // Now update it with relations
          await fetch(`/api/admin/groups/${newGroup.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              managerIds: formData.managerIds,
              studentIds: formData.studentIds,
              dutyStudentIds: formData.dutyStudentIds
            })
          });
          fetchData();
          handleCloseModal();
        }
      }
    } catch (err) {
      console.error(err);
      alert('שגיאה בשמירת הקבוצה');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק קבוצה זו? הפעולה לא תמחק את המשתמשים, אלא רק תסיר את שיוכם לקבוצה.')) return;
    try {
      const res = await fetch(`/api/admin/groups/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className={styles.loading}>טוען קבוצות...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>ניהול קבוצות וכיתות</h1>
          <p>הגדר כיתות, שייך אנשי צוות וסמן חניכים תורנים</p>
        </div>
        <button className={styles.addBtn} onClick={() => handleOpenModal()}>
          <Plus size={20} /> קבוצה חדשה
        </button>
      </header>

      <div className={styles.grid}>
        {groups.map(group => (
          <div key={group.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>{group.name}</h2>
              <span className={styles.badge}>{group.type === 'class' ? 'כיתה' : 'קבוצה'}</span>
            </div>
            {group.description && <p className={styles.desc}>{group.description}</p>}
            
            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <Users size={16} />
                <span>{group._count?.users || 0} חניכים</span>
              </div>
              <div className={styles.statItem}>
                <Shield size={16} />
                <span>{group.managers?.length || 0} אנשי צוות</span>
              </div>
            </div>

            <div className={styles.managersList}>
              {group.managers && group.managers.map(m => (
                <span key={m.id} className={styles.managerTag}>{m.fullName}</span>
              ))}
            </div>

            <div className={styles.cardActions}>
              <button className={styles.iconBtn} onClick={() => handleOpenModal(group)} title="ערוך">
                <Edit size={18} /> ערוך הרכבים
              </button>
              <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => handleDelete(group.id)} title="מחק">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{editingGroup ? 'עריכת קבוצה' : 'קבוצה חדשה'}</h2>
            
            <div className={styles.modalScrollable}>
              <div className={styles.formGroup}>
                <label>שם הקבוצה</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={styles.input} />
              </div>
              
              <div className={styles.formGroup}>
                <label>סוג</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className={styles.input}>
                  <option value="class">כיתה או שכבה</option>
                  <option value="group">קבוצת פעילות / סיירת</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>תיאור (אופציונלי)</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={styles.input} />
              </div>

              <hr className={styles.divider} />
              
              <div className={styles.selectionSection}>
                <h3><Shield size={18} style={{display:'inline', verticalAlign:'middle'}}/> שיוך אנשי צוות מנהלים</h3>
                <p className={styles.hint}>אנשי צוות אלו יוכלו לראות את הדשבורד של חניכי הקבוצה ולשלוח להם התראות.</p>
                <div className={styles.checkboxGrid}>
                  {staffUsers.map(user => (
                    <label key={user.id} className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        checked={formData.managerIds.includes(user.id)}
                        onChange={() => toggleSelection('managerIds', user.id)}
                      />
                      {user.fullName}
                    </label>
                  ))}
                </div>
              </div>

              <hr className={styles.divider} />

              <div className={styles.selectionSection}>
                <h3><Users size={18} style={{display:'inline', verticalAlign:'middle'}}/> שיוך חניכים לקבוצה</h3>
                <p className={styles.hint}>בחר חניכים שישויכו לקבוצה זו.</p>
                <div className={styles.checkboxGrid}>
                  {studentUsers.map(user => (
                    <label key={user.id} className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        checked={formData.studentIds.includes(user.id)}
                        onChange={() => toggleSelection('studentIds', user.id)}
                      />
                      {user.fullName} {user.groupId && user.groupId !== editingGroup?.id && <small style={{color:'red'}}>(משויך כרגע לקבוצה אחרת)</small>}
                    </label>
                  ))}
                </div>
              </div>

              <hr className={styles.divider} />

              <div className={styles.selectionSection}>
                <h3><UserCheck size={18} style={{display:'inline', verticalAlign:'middle'}}/> הגדרת "חניך תורן"</h3>
                <p className={styles.hint}>בחר חניך תורן מתוך החניכים המשויכים לקבוצה. הם יקבלו גישה לדוחות נוכחות ויוכלו לשלוח הודעות לחברים.</p>
                <div className={styles.checkboxGrid}>
                  {studentUsers.filter(u => formData.studentIds.includes(u.id)).length === 0 ? (
                    <span className={styles.hint}>יש לשייך תחילה חניכים לקבוצה</span>
                  ) : (
                    studentUsers.filter(u => formData.studentIds.includes(u.id)).map(user => (
                      <label key={`duty-${user.id}`} className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          checked={formData.dutyStudentIds.includes(user.id)}
                          onChange={() => toggleSelection('dutyStudentIds', user.id)}
                        />
                        {user.fullName}
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={handleCloseModal}>ביטול</button>
              <button className={styles.saveBtn} onClick={handleSave}>שמור שינויים</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
