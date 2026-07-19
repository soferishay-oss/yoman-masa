'use client';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ToastProvider';
import { Shield, Plus, Upload, Trash2, Edit2, X } from 'lucide-react';
import ExcelImportModal from './ExcelImportModal';
import styles from '@/app/page.module.css';

export default function StaffTab() {
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const { show, confirm } = useToast();

  const [formData, setFormData] = useState({
    fullName: '', phoneNumber: '', email: '', role: 'staff', nationalId: '', customRoleId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/admin/users?role=non_student'),
        fetch('/api/admin/roles')
      ]);
      
      if (usersRes.ok) {
        setStaff(await usersRes.json());
      }
      if (rolesRes.ok) {
        setRoles(await rolesRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        show('איש הצוות נוסף בהצלחה!');
        setFormData({ fullName: '', phoneNumber: '', email: '', role: 'staff', nationalId: '', customRoleId: '' });
        setShowAddForm(false);
        fetchData();
      } else {
        const err = await res.json();
        show('שגיאה: ' + (err.error || ''), 'error');
      }
    } catch (err) {
      show('שגיאה בתקשורת', 'error');
    }
  };

  const handleEditStaff = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.customRoleId === '') {
        payload.customRoleId = null;
      }
      
      const res = await fetch(`/api/admin/users/${editingStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        show('איש הצוות עודכן בהצלחה!');
        setEditingStaff(null);
        fetchData();
      } else {
        const err = await res.json();
        show('שגיאה: ' + (err.error || ''), 'error');
      }
    } catch (err) {
      show('שגיאה בתקשורת', 'error');
    }
  };

  const openEditModal = (user) => {
    setFormData({
      fullName: user.fullName,
      phoneNumber: user.phoneNumber || '',
      email: user.email || '',
      role: user.role,
      nationalId: user.nationalId || '',
      customRoleId: user.customRoleId || ''
    });
    setEditingStaff(user);
  };

  const handleDelete = async (id) => {
    if (await confirm('למחוק איש צוות זה לחלוטין מהמערכת?')) {
      try {
        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
          show('איש צוות נמחק!');
          fetchData();
        } else {
          show('שגיאה במחיקה', 'error');
        }
      } catch (err) {
        show('שגיאה בתקשורת', 'error');
      }
    }
  };

  const handleImportComplete = () => {
    setShowExcelImport(false);
    fetchData();
  };

  if (isLoading) return <div>טוען אנשי צוות...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>מאגר אנשי צוות</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowExcelImport(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 15px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Upload size={18} /> ייבוא מאקסל
          </button>
          <button 
            onClick={() => {
              setFormData({ fullName: '', phoneNumber: '', email: '', role: 'staff', nationalId: '', customRoleId: '' });
              setShowAddForm(!showAddForm);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 15px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Plus size={18} /> הוסף איש צוות
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateStaff} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3>הוספת איש צוות חדש</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <input type="text" placeholder="שם מלא *" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            <input type="text" placeholder="תעודת זהות (אופציונלי)" value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            <input type="tel" placeholder="מספר טלפון *" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            <input type="email" placeholder="אימייל (אופציונלי)" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            <select value={formData.customRoleId} onChange={e => setFormData({...formData, customRoleId: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <option value="">-- בחר הגדרת תפקיד --</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <button type="submit" style={{ padding: '12px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>שמור איש צוות</button>
        </form>
      )}

      {editingStaff && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <form onSubmit={handleEditStaff} style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', padding: '25px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>עריכת איש צוות</h2>
              <button type="button" onClick={() => setEditingStaff(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>שם מלא</label>
                <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>תעודת זהות</label>
                <input type="text" value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>טלפון</label>
                <input type="tel" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>מייל</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>הגדרת תפקיד (שואב הרשאות)</label>
                <select value={formData.customRoleId} onChange={e => setFormData({...formData, customRoleId: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <option value="">-- ללא תפקיד מוגדר --</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: 'bold' }}>משובץ לקבוצות וכיתות:</label>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {editingStaff.managedGroups?.map(g => (
                  <span key={g.id} style={{ padding: '4px 8px', background: '#e0e7ff', color: '#3730a3', borderRadius: '4px', fontSize: '12px' }}>{g.name}</span>
                ))}
                {(!editingStaff.managedGroups || editingStaff.managedGroups.length === 0) && (
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>לא משובץ לאף מסגרת. (יש להוסיף אותו דרך ניהול הכיתה/קבוצה)</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={() => setEditingStaff(null)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>ביטול</button>
              <button type="submit" className={styles.primaryButton}>שמור שינויים</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
        <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>
              <th style={{ padding: '15px' }}>שם מלא</th>
              <th style={{ padding: '15px' }}>תפקיד והרשאות</th>
              <th style={{ padding: '15px' }}>התקשרות</th>
              <th style={{ padding: '15px' }}>משובץ ל-</th>
              <th style={{ padding: '15px' }}>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '50%' }}><Shield size={16} /></div>
                    <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{user.fullName}</span>
                  </div>
                </td>
                <td style={{ padding: '15px' }}>
                  {user.customRole ? (
                    <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>{user.customRole.name}</span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>{user.role === 'admin' ? 'מנהל ראשי (ללא תפקיד)' : 'ללא תפקיד מוגדר'}</span>
                  )}
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ fontSize: '13px' }}>
                    <div dir="ltr" style={{ textAlign: 'right' }}>{user.phoneNumber}</div>
                    {user.email && <div style={{ color: '#64748b' }}>{user.email}</div>}
                  </div>
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {user.managedGroups?.slice(0, 3).map(g => (
                      <span key={g.id} style={{ background: '#f1f5f9', fontSize: '12px', padding: '2px 6px', borderRadius: '4px' }}>{g.name}</span>
                    ))}
                    {user.managedGroups?.length > 3 && <span style={{ fontSize: '12px', color: '#64748b' }}>+{user.managedGroups.length - 3} נוספים</span>}
                    {(!user.managedGroups || user.managedGroups.length === 0) && <span style={{ fontSize: '12px', color: '#cbd5e1' }}>-</span>}
                  </div>
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => openEditModal(user)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(user.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>לא נמצאו אנשי צוות.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showExcelImport && (
        <ExcelImportModal 
          role="staff" 
          onImportComplete={handleImportComplete} 
          onClose={() => setShowExcelImport(false)} 
        />
      )}
    </div>
  );
}
