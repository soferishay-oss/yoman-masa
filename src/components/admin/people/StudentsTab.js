'use client';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ToastProvider';
import { GraduationCap, Plus, Upload, Trash2, Edit } from 'lucide-react';
import styles from '@/app/page.module.css';

export default function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef(null);
  const { show, confirm } = useToast();

  const [formData, setFormData] = useState({
    fullName: '', phoneNumber: '', email: '', classId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, classesRes] = await Promise.all([
        fetch('/api/admin/users?role=student'),
        fetch('/api/admin/groups?type=class')
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
        setFormData({ fullName: '', phoneNumber: '', email: '', classId: '' });
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = text.split('\n').map(row => row.trim()).filter(row => row);
      if (rows.length < 2) {
        show('קובץ לא חוקי או ריק', 'error');
        return;
      }
      
      const headers = rows[0].split(',');
      const studentsToImport = rows.slice(1).map(row => {
        const values = row.split(',');
        const obj = {};
        headers.forEach((header, i) => {
          obj[header.trim()] = values[i]?.trim() || '';
        });
        return obj;
      });

      show('מייבא נתונים, אנא המתן...', 'info');
      
      try {
        const res = await fetch('/api/admin/users/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: studentsToImport, role: 'student' })
        });
        
        if (res.ok) {
          const result = await res.json();
          show(`יובאו בהצלחה ${result.count} תלמידים חדשים!`);
          fetchData();
        } else {
          const err = await res.json();
          show('שגיאה בייבוא: ' + (err.error || ''), 'error');
        }
      } catch (error) {
        show('שגיאה בתקשורת', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (isLoading) return <div>טוען תלמידים...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>מאגר תלמידים</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
          <button 
            onClick={() => fileInputRef.current.click()}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 15px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            title="ייבוא תלמידים מקובץ CSV (עמודות נדרשות: שם מלא, טלפון. אפשרויות: אימייל, כיתה)"
          >
            <Upload size={18} /> ייבוא מ-CSV
          </button>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
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

      <div style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
        <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>
              <th style={{ padding: '15px' }}>שם מלא</th>
              <th style={{ padding: '15px' }}>כיתה</th>
              <th style={{ padding: '15px' }}>טלפון</th>
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
                <td style={{ padding: '15px' }}>{student.class?.name || <span style={{ color: '#94a3b8' }}>לא משובץ</span>}</td>
                <td style={{ padding: '15px' }} dir="ltr" align="right">{student.phoneNumber}</td>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleDelete(student.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>לא נמצאו תלמידים. הוסף ידנית או ייבא מקובץ.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
