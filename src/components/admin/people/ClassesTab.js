'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import { Users, Plus, Trash2, Edit2, ShieldAlert } from 'lucide-react';
import styles from '@/app/page.module.css';
import ManageGroupModal from './ManageGroupModal';

export default function ClassesTab() {
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [managingClass, setManagingClass] = useState(null);
  const { show, confirm } = useToast();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/admin/groups?type=class', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setClasses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    try {
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName, type: 'class' })
      });
      if (res.ok) {
        show('הכיתה נוצרה בהצלחה!');
        setNewClassName('');
        setShowCreateForm(false);
        fetchClasses();
      } else {
        show('שגיאה ביצירת כיתה', 'error');
      }
    } catch (err) {
      show('שגיאה בתקשורת', 'error');
    }
  };

  const handleDeleteClass = async (id) => {
    if (await confirm('האם אתה בטוח שברצונך למחוק כיתה זו? תלמידי הכיתה לא יימחקו, אך ישוחררו ממנה.')) {
      try {
        const res = await fetch(`/api/admin/groups/${id}`, { method: 'DELETE' });
        if (res.ok) {
          show('הכיתה נמחקה!');
          fetchClasses();
        } else {
          show('שגיאה במחיקת כיתה', 'error');
        }
      } catch (err) {
        show('שגיאה בתקשורת', 'error');
      }
    }
  };

  if (isLoading) return <div>טוען כיתות...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>ניהול כיתות</h2>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 15px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Plus size={18} /> יצירת כיתה חדשה
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateClass} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="שם הכיתה (למשל: י'1)" 
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            required
          />
          <button type="submit" style={{ padding: '10px 20px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            שמור כיתה
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {classes.map(cls => (
          <div key={cls.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>{cls.name}</h3>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button 
                  onClick={() => handleDeleteClass(cls.id)}
                  style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                  title="מחק כיתה"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '14px', marginBottom: '15px' }}>
              <Users size={16} />
              <span>{cls._count?.classUsers || 0} תלמידים משובצים</span>
            </div>

            <button 
              onClick={() => setManagingClass(cls)}
              style={{ width: '100%', padding: '10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              נהל משתתפים וצוות
            </button>
          </div>
        ))}
        {classes.length === 0 && !isLoading && (
          <p style={{ color: '#64748b', gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>לא נמצאו כיתות. צור את הכיתה הראשונה שלך!</p>
        )}
      </div>

      {managingClass && (
        <ManageGroupModal
          groupId={managingClass.id}
          groupName={managingClass.name}
          groupType="class"
          onClose={() => {
            setManagingClass(null);
            fetchClasses();
          }}
        />
      )}
    </div>
  );
}
