'use client';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ToastProvider';
import { GraduationCap, Plus, Upload, Trash2, Edit2, X, Star } from 'lucide-react';
import ExcelImportModal from './ExcelImportModal';
import styles from '@/app/page.module.css';

export default function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const { show, confirm } = useToast();

  const [formData, setFormData] = useState({
    fullName: '', phoneNumber: '', email: '', classId: '', nationalId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, classesRes] = await Promise.all([
        fetch('/api/admin/users?role=student', { cache: 'no-store' }),
        fetch('/api/admin/groups?type=class', { cache: 'no-store' })
      ]);
      if (usersRes.ok) setStudents(await usersRes.json());
      if (classesRes.ok) setClasses(await classesRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'student' })
      });
      if (res.ok) {
        show('התלמיד נוסף בהצלחה!');
        setFormData({ fullName: '', phoneNumber: '', email: '', classId: '', nationalId: '' });
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

  const handleEditStudent = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.classId === '') payload.classId = null;

      const res = await fetch(`/api/admin/users/${editingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        show('התלמיד עודכן בהצלחה!');
        setEditingStudent(null);
        fetchData();
      } else {
        const err = await res.json();
        show('שגיאה: ' + (err.error || ''), 'error');
      }
    } catch (err) {
      show('שגיאה בתקשורת', 'error');
    }
  };

  const openEditModal = (student) => {
    setFormData({
      fullName: student.fullName,
      phoneNumber: student.phoneNumber || '',
      email: student.email || '',
      classId: student.classId || '',
      nationalId: student.nationalId || ''
    });
    setEditingStudent(student);
  };

  const handleDelete = async (id) => {
    if (await confirm('למחוק תלמיד זה לחלוטין מהמערכת?')) {
      try {
        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
          show('התלמיד נמחק!');
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

  if (isLoading) return <div>טוען תלמידים...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>מאגר תלמידים</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowExcelImport(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 15px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            title="ייבוא תלמידים מקובץ אקסל"
          >
            <Upload size={18} /> ייבוא מאקסל
          </button>
          <button 
            onClick={() => {
              setFormData({ fullName: '', phoneNumber: '', email: '', classId: '', nationalId: '' });
              setShowAddForm(!showAddForm);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 15px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Plus size={18} /> הוסף תלמיד
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateStudent} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3>הוספת תלמיד חדש</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <input type="text" placeholder="שם מלא *" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            <input type="text" placeholder="תעודת זהות (אופציונלי)" value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            <input type="tel" placeholder="מספר טלפון *" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            <input type="email" placeholder="אימייל (אופציונלי)" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            <select value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <option value="">-- בחר כיתה (אופציונלי) --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button type="submit" style={{ padding: '12px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>שמור תלמיד</button>
        </form>
      )}

      {editingStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <form onSubmit={handleEditStudent} style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '25px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>עריכת תלמיד</h2>
              <button type="button" onClick={() => setEditingStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>שם מלא</label>
                <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>תעודת זהות</label>
                <input type="text" value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>כיתת אם</label>
                <select value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <option value="">-- ללא כיתה --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>טלפון</label>
                <input type="tel" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>מייל</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: 'bold' }}>משובץ לקבוצות פעילות:</label>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {editingStudent.groupMemberships?.map(gm => (
                  <span key={gm.id} style={{ padding: '4px 8px', background: '#fef3c7', color: '#92400e', borderRadius: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {gm.isDutyStudent && <Star size={12} color="#d97706" fill="#d97706" />}
                    {gm.group?.name}
                  </span>
                ))}
                {(!editingStudent.groupMemberships || editingStudent.groupMemberships.length === 0) && (
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>לא משובץ לקבוצות (מלבד כיתת האם).</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={() => setEditingStudent(null)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>ביטול</button>
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
              <th style={{ padding: '15px' }}>כיתת אם</th>
              <th style={{ padding: '15px' }}>קבוצות ותורנויות</th>
              <th style={{ padding: '15px' }}>התקשרות</th>
              <th style={{ padding: '15px' }}>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '50%' }}><GraduationCap size={16} /></div>
                    <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{student.fullName}</span>
                  </div>
                </td>
                <td style={{ padding: '15px' }}>
                  {student.class ? (
                    <span style={{ background: '#dbeafe', color: '#1e3a8a', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>{student.class.name}</span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>לא משובץ</span>
                  )}
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {student.groupMemberships?.map(gm => (
                      <span key={gm.id} style={{ background: gm.isDutyStudent ? '#fef08a' : '#f1f5f9', color: gm.isDutyStudent ? '#854d0e' : '#475569', fontSize: '12px', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', border: gm.isDutyStudent ? '1px solid #fde047' : 'none' }} title={gm.isDutyStudent ? "חניך תורן" : ""}>
                        {gm.isDutyStudent && <Star size={10} color="#ca8a04" fill="#ca8a04" />}
                        {gm.group?.name}
                      </span>
                    ))}
                    {(!student.groupMemberships || student.groupMemberships.length === 0) && <span style={{ fontSize: '12px', color: '#cbd5e1' }}>-</span>}
                  </div>
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ fontSize: '13px' }}>
                    <div dir="ltr" style={{ textAlign: 'right' }}>{student.phoneNumber}</div>
                  </div>
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => openEditModal(student)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(student.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>לא נמצאו תלמידים. הוסף ידנית או ייבא מקובץ.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showExcelImport && (
        <ExcelImportModal 
          role="student" 
          onImportComplete={handleImportComplete} 
          onClose={() => setShowExcelImport(false)} 
        />
      )}
    </div>
  );
}
