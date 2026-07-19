'use client';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ToastProvider';
import { GraduationCap, Plus, Upload, Trash2, Edit2, X, Star } from 'lucide-react';
import ExcelImportModal from './ExcelImportModal';
import StudentEditModal from './StudentEditModal';
import styles from '@/app/page.module.css';

export default function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [showBulkClassModal, setShowBulkClassModal] = useState(false);
  const [bulkTargetClass, setBulkTargetClass] = useState('');
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



  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(students.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!await confirm(`האם אתה בטוח שברצונך למחוק ${selectedIds.length} תלמידים?`)) return;
    setIsBulkLoading(true);
    try {
      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', userIds: selectedIds })
      });
      if (res.ok) {
        show(`נמחקו ${selectedIds.length} תלמידים בהצלחה!`);
        setSelectedIds([]);
        fetchData();
      } else {
        show('שגיאה במחיקה', 'error');
      }
    } catch (err) {
      show('שגיאה בתקשורת', 'error');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkChangeClass = async () => {
    if (!bulkTargetClass) {
      show('אנא בחר כיתת יעד', 'error');
      return;
    }
    setIsBulkLoading(true);
    try {
      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_class', userIds: selectedIds, classId: bulkTargetClass === 'none' ? null : bulkTargetClass })
      });
      if (res.ok) {
        show(`הועברו ${selectedIds.length} תלמידים בהצלחה!`);
        setShowBulkClassModal(false);
        setSelectedIds([]);
        fetchData();
      } else {
        show('שגיאה בהעברת כיתה', 'error');
      }
    } catch (err) {
      show('שגיאה בתקשורת', 'error');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const openEditModal = (student) => {
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

      {selectedIds.length > 0 && (
        <div style={{ background: '#e0f2fe', padding: '10px 20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #bae6fd' }}>
          <div style={{ fontWeight: 'bold', color: '#0284c7' }}>{selectedIds.length} תלמידים נבחרו</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowBulkClassModal(true)} disabled={isBulkLoading} style={{ background: '#38bdf8', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>העבר כיתה</button>
            <button onClick={handleBulkDelete} disabled={isBulkLoading} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>מחק נבחרים</button>
          </div>
        </div>
      )}

      {editingStudent && (
        <StudentEditModal
          student={editingStudent}
          classes={classes}
          onClose={() => setEditingStudent(null)}
          onSaved={() => {
            setEditingStudent(null);
            fetchData();
          }}
        />
      )}

      <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
        <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>
              <th style={{ padding: '15px', width: '40px' }}><input type="checkbox" checked={selectedIds.length === students.length && students.length > 0} onChange={handleSelectAll} /></th>
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
                <td style={{ padding: '15px' }}><input type="checkbox" checked={selectedIds.includes(student.id)} onChange={() => handleSelectOne(student.id)} /></td>
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
              <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>לא נמצאו תלמידים. הוסף ידנית או ייבא מקובץ.</td></tr>
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

      {showBulkClassModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '25px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>העברת כיתה ל-{selectedIds.length} תלמידים</h2>
              <button onClick={() => setShowBulkClassModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#334155' }}>בחר כיתה חדשה:</label>
              <select value={bulkTargetClass} onChange={e => setBulkTargetClass(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <option value="">-- בחר כיתה --</option>
                <option value="none">הסר שיוך לכיתה</option>
                {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowBulkClassModal(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>ביטול</button>
              <button onClick={handleBulkChangeClass} disabled={isBulkLoading || !bulkTargetClass} className={styles.primaryButton}>העבר</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
