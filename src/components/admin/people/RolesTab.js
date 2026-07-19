'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import { Shield, Plus, Trash2, Edit2, X, Check, Users, UserCheck } from 'lucide-react';
import styles from '@/app/page.module.css';

const AVAILABLE_PERMISSIONS_STAFF = [
  { id: 'manage_settings', label: 'ניהול הגדרות מערכת' },
  { id: 'manage_moderation', label: 'ניהול סינון תכנים' },
  { id: 'create_events', label: 'יצירת אירועים ואישורים' },
  { id: 'manage_tasks', label: 'ניהול משימות תלמידים' },
  { id: 'manage_people', label: 'ניהול קהילה (משתמשים וקבוצות)' },
  { id: 'view_reports', label: 'צפייה בדוחות אנליטיקה' },
];

const AVAILABLE_PERMISSIONS_DUTY = [
  { id: 'duty_send_messages', label: 'שליחת הודעות לקבוצה/כיתה' },
  { id: 'duty_view_trips', label: 'צפייה בהרשמה לטיול' },
  { id: 'duty_bus_boarding', label: 'ניהול עלייה לאוטובוס' },
];

export default function RolesTab() {
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [activeView, setActiveView] = useState('staff'); // 'staff' or 'duty_student'
  
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const { show, confirm } = useToast();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles');
      if (res.ok) {
        setRoles(await res.json());
      } else {
        show('שגיאה בטעינת תפקידים', 'error');
      }
    } catch (err) {
      show('שגיאה בתקשורת', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setRoleName('');
    setSelectedPermissions([]);
    setShowModal(true);
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setRoleName(role.name);
    try {
      setSelectedPermissions(JSON.parse(role.permissions || '[]'));
    } catch (e) {
      setSelectedPermissions([]);
    }
    setShowModal(true);
  };

  const handleTogglePermission = (permId) => {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permId));
    } else {
      setSelectedPermissions([...selectedPermissions, permId]);
    }
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      show('יש להזין שם תפקיד', 'error');
      return;
    }

    try {
      const url = editingRole ? `/api/admin/roles/${editingRole.id}` : '/api/admin/roles';
      const method = editingRole ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: roleName, 
          permissions: selectedPermissions,
          type: activeView 
        })
      });

      if (res.ok) {
        show(editingRole ? 'תפקיד עודכן בהצלחה!' : 'תפקיד נוצר בהצלחה!');
        setShowModal(false);
        fetchRoles();
      } else {
        const errData = await res.json();
        show(errData.error || 'שגיאה בשמירה', 'error');
      }
    } catch (err) {
      show('שגיאה בתקשורת', 'error');
    }
  };

  const handleDelete = async (role) => {
    if (role.type === 'staff' && role._count?.users > 0) {
      show('לא ניתן למחוק תפקיד שמשויך לאנשי צוות', 'error');
      return;
    }

    if (!await confirm(`האם אתה בטוח שברצונך למחוק את התפקיד "${role.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/roles/${role.id}`, { method: 'DELETE' });
      if (res.ok) {
        show('תפקיד נמחק בהצלחה!');
        fetchRoles();
      } else {
        const errData = await res.json();
        show(errData.error || 'שגיאה במחיקה', 'error');
      }
    } catch (err) {
      show('שגיאה בתקשורת', 'error');
    }
  };

  const currentRoles = roles.filter(r => (r.type || 'staff') === activeView);
  const currentAvailablePermissions = activeView === 'staff' ? AVAILABLE_PERMISSIONS_STAFF : AVAILABLE_PERMISSIONS_DUTY;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield color="var(--primary-color)" />
          תפקידים והרשאות
        </h2>
        <button className={styles.primaryButton} onClick={openCreateModal}>
          <Plus size={18} /> תפקיד {activeView === 'staff' ? 'צוות' : 'תורן'} חדש
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveView('staff')}
          style={{ 
            padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
            background: activeView === 'staff' ? '#e0f2fe' : '#f1f5f9',
            color: activeView === 'staff' ? '#0284c7' : '#64748b'
          }}
        >
          <Users size={18} /> תפקידי צוות
        </button>
        <button 
          onClick={() => setActiveView('duty_student')}
          style={{ 
            padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
            background: activeView === 'duty_student' ? '#e0f2fe' : '#f1f5f9',
            color: activeView === 'duty_student' ? '#0284c7' : '#64748b'
          }}
        >
          <UserCheck size={18} /> תפקידי תורנים
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>
          {activeView === 'staff' 
            ? 'כאן תוכלו להגדיר תפקידים (כמו "מחנך", "מדריך", "מנהל"), ולשייך לכל תפקיד הרשאות ספציפיות במערכת.'
            : 'כאן תוכלו להגדיר תפקידים לתורנים (כמו "תורן קבוע", "תורן זמני"), ולשייך לכל תפקיד תורן הרשאות ספציפיות.'
          }
        </p>

        {isLoading ? (
          <p>טוען תפקידים...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {currentRoles.map(role => {
              const perms = JSON.parse(role.permissions || '[]');
              return (
                <div key={role.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#1e293b' }}>{role.name}</h3>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => openEditModal(role)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(role)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: (role.type === 'staff' && role._count?.users > 0) ? '#cbd5e1' : '#ef4444' }} title={(role.type === 'staff' && role._count?.users > 0) ? "תפקיד בשימוש" : "מחק תפקיד"}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {role.type === 'staff' && (
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>
                      {role._count?.users} אנשי צוות משויכים
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: role.type === 'staff' ? 0 : '10px' }}>
                    {currentAvailablePermissions.map(ap => {
                      const hasPerm = perms.includes(ap.id);
                      if (!hasPerm) return null;
                      return (
                        <div key={ap.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#0f172a' }}>
                          <Check size={14} color="#10b981" /> {ap.label}
                        </div>
                      );
                    })}
                    {perms.length === 0 && <span style={{ fontSize: '13px', color: '#94a3b8' }}>אין הרשאות מוגדרות.</span>}
                  </div>
                </div>
              );
            })}
            
            {currentRoles.length === 0 && (
              <p style={{ color: '#64748b', gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>לא הוגדרו תפקידים מסוג זה. הוסף תפקיד ראשון כדי להתחיל.</p>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '25px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>{editingRole ? 'עריכת תפקיד' : `תפקיד ${activeView === 'staff' ? 'צוות' : 'תורן'} חדש`}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#334155' }}>
                  שם התפקיד (למשל: {activeView === 'staff' ? "'מחנך י\"א'" : "'תורן זמני'"})
                </label>
                <input 
                  type="text" 
                  value={roleName}
                  onChange={e => setRoleName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  placeholder="הזן שם תפקיד..."
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#334155' }}>הרשאות מערכת:</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', maxHeight: '200px', overflowY: 'auto' }}>
                  {currentAvailablePermissions.map(perm => (
                    <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => handleTogglePermission(perm.id)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span style={{ color: '#1e293b' }}>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>ביטול</button>
                <button onClick={handleSave} className={styles.primaryButton}>שמור תפקיד</button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
