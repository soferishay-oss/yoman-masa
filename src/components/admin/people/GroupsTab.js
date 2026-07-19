'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import { Users, Plus, Trash2, Copy, Edit2 } from 'lucide-react';
import styles from '@/app/page.module.css';
import ManageGroupModal from './ManageGroupModal';

export default function GroupsTab() {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [managingGroup, setManagingGroup] = useState(null);
  const { show, confirm } = useToast();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/admin/groups?type=group&includeMembers=true', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setGroups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName, type: 'group' })
      });
      if (res.ok) {
        show('הקבוצה נוצרה בהצלחה!');
        setNewGroupName('');
        setShowCreateForm(false);
        fetchGroups();
      } else {
        show('שגיאה ביצירת קבוצה', 'error');
      }
    } catch (err) {
      show('שגיאה בתקשורת', 'error');
    }
  };

  const handleDeleteGroup = async (id) => {
    if (await confirm('האם אתה בטוח שברצונך למחוק קבוצה זו?')) {
      try {
        const res = await fetch(`/api/admin/groups/${id}`, { method: 'DELETE' });
        if (res.ok) {
          show('הקבוצה נמחקה!');
          fetchGroups();
        } else {
          show('שגיאה במחיקת קבוצה', 'error');
        }
      } catch (err) {
        show('שגיאה בתקשורת', 'error');
      }
    }
  const handleEditName = async (group) => {
    const newName = window.prompt('ערוך שם קבוצה:', group.name);
    if (!newName || newName.trim() === group.name) return;

    try {
      const res = await fetch(`/api/admin/groups/${group.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      });
      if (res.ok) {
        show('שם הקבוצה עודכן!');
        fetchGroups();
      } else {
        show('שגיאה בעדכון השם', 'error');
      }
    } catch (err) {
      show('שגיאה בתקשורת', 'error');
    }
  };

  const handleCloneGroup = async (group) => {
    const newName = window.prompt('בחר שם לקבוצה המשוכפלת:', `${group.name} (עותק)`);
    if (!newName) return; // User cancelled

    try {
      const res = await fetch('/api/admin/groups/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: group.id, newName })
      });
      if (res.ok) {
        show('הקבוצה שוכפלה בהצלחה!');
        fetchGroups();
      } else {
        show('שגיאה בשכפול הקבוצה', 'error');
      }
    } catch (err) {
      show('שגיאה בתקשורת', 'error');
    }
  };

  if (isLoading) return <div>טוען קבוצות...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>ניהול קבוצות פעילות</h2>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 15px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Plus size={18} /> יצירת קבוצה חדשה
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateGroup} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="שם הקבוצה (למשל: חוג תיאטרון)" 
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            required
          />
          <button type="submit" style={{ padding: '10px 20px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            שמור קבוצה
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {groups.map(group => (
          <div key={group.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>{group.name}</h3>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button 
                  onClick={() => handleEditName(group)}
                  style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                  title="ערוך שם קבוצה"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleCloneGroup(group)}
                  style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                  title="שכפל קבוצה"
                >
                  <Copy size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteGroup(group.id)}
                  style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                  title="מחק קבוצה"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
              <Users size={16} />
              <span>{group._count?.groupMembers || 0} משתתפים משובצים</span>
            </div>

            {group.managers && group.managers.length > 0 && (
              <div style={{ fontSize: '13px', color: '#334155', marginBottom: '5px' }}>
                <strong style={{ color: '#475569' }}>צוות מנהל:</strong> {group.managers.map(m => m.fullName).join(', ')}
              </div>
            )}

            {group.groupMembers && group.groupMembers.some(gm => gm.isDutyStudent) && (
              <div style={{ fontSize: '12px', color: '#b45309', marginBottom: '15px', fontWeight: 'bold' }}>
                תורנים: {group.groupMembers.filter(gm => gm.isDutyStudent).map(gm => gm.user?.fullName).filter(Boolean).join(', ')}
              </div>
            )}
            
            <div style={{ marginTop: 'auto', paddingTop: '15px' }}>
              <button 
                onClick={() => setManagingGroup(group)}
                style={{ width: '100%', padding: '10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                נהל משתתפים וצוות
              </button>
            </div>
          </div>
        ))}
        {groups.length === 0 && !isLoading && (
          <p style={{ color: '#64748b', gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>לא נמצאו קבוצות.</p>
        )}
      </div>

      {managingGroup && (
        <ManageGroupModal
          groupId={managingGroup.id}
          groupName={managingGroup.name}
          groupType="group"
          onClose={() => {
            setManagingGroup(null);
            fetchGroups();
          }}
        />
      )}
    </div>
  );
}
