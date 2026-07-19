'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import { Users, Plus, Trash2 } from 'lucide-react';
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
      const res = await fetch('/api/admin/groups?type=group', { cache: 'no-store' });
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
                  onClick={() => handleDeleteGroup(group.id)}
                  style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                  title="מחק קבוצה"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '14px', marginBottom: '15px' }}>
              <Users size={16} />
              <span>{group._count?.groupMembers || 0} משתתפים משובצים</span>
            </div>

            <button 
              onClick={() => setManagingGroup(group)}
              style={{ width: '100%', padding: '10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              נהל משתתפים וצוות
            </button>
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
