import { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import styles from '@/app/page.module.css';
import { useToast } from '@/components/ToastProvider';

export default function StudentEditModal({ student, classes, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    fullName: student.fullName || '',
    phoneNumber: student.phoneNumber || '',
    email: student.email || '',
    classId: student.classId || '',
    nationalId: student.nationalId || ''
  });
  const [fullStudent, setFullStudent] = useState(student);
  const [isLoading, setIsLoading] = useState(true);
  const { show } = useToast();

  useEffect(() => {
    const fetchFullStudent = async () => {
      try {
        const res = await fetch(`/api/admin/users/${student.id}`);
        if (res.ok) {
          const data = await res.json();
          setFullStudent(data);
          setFormData({
            fullName: data.fullName || '',
            phoneNumber: data.phoneNumber || '',
            email: data.email || '',
            classId: data.classId || '',
            nationalId: data.nationalId || ''
          });
        }
      } catch (err) {
        console.error('Failed to fetch full student', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFullStudent();
  }, [student.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.classId === '') payload.classId = null;

      const res = await fetch(`/api/admin/users/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        show('התלמיד עודכן בהצלחה!');
        onSaved();
      } else {
        const err = await res.json();
        show('שגיאה: ' + (err.error || ''), 'error');
      }
    } catch (err) {
      show('שגיאה בתקשורת', 'error');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '25px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>עריכת תלמיד</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
        </div>
        
        {isLoading ? (
          <p>טוען פרטים...</p>
        ) : (
          <>
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
            {fullStudent.groupMemberships?.map(gm => (
              <span key={gm.id} style={{ padding: '4px 8px', background: '#fef3c7', color: '#92400e', borderRadius: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {gm.isDutyStudent && <Star size={12} color="#d97706" fill="#d97706" />}
                {gm.group?.name}
              </span>
            ))}
            {(!fullStudent.groupMemberships || fullStudent.groupMemberships.length === 0) && (
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>לא משובץ לקבוצות (מלבד כיתת האם).</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>ביטול</button>
          <button type="submit" className={styles.primaryButton}>שמור שינויים</button>
        </div>
        </>
        )}
      </form>
    </div>
  );
}
