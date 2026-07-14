'use client';

import { useState, useEffect } from 'react';
import { Users, Activity, MessageCircle, User } from 'lucide-react';
import styles from './staff.module.css';

export default function StaffDashboard() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/staff/group');
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>אזור צוות</h1>
        <p>מעקב והדרכת חניכים</p>
      </header>

      <section className={styles.section}>
        <div className={styles.statGrid}>
          <div className={styles.statBox}>
            <div className={styles.statNumber}>24</div>
            <div className={styles.statLabel}>חניכים פעילים</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statNumber}>18</div>
            <div className={styles.statLabel}>רשומות יומן השבוע</div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><Activity size={20} style={{display:'inline', verticalAlign:'middle'}}/> מדד מצב רוח</h2>
        <div className={styles.card}>
          <div className={styles.studentList}>
            {isLoading ? (
              <p style={{padding:'20px'}}>טוען חניכים...</p>
            ) : students.length > 0 ? (
              students.map(student => (
                <div key={student.id} className={styles.studentCard}>
                  <div className={styles.studentAvatar}>
                    <User size={20} />
                  </div>
                  <div className={styles.studentInfo}>
                    <div className={styles.studentName}>{student.name}</div>
                    <div className={`${styles.studentMood} ${student.trend === 'down' ? styles.moodWarning : styles.moodGood}`}>
                      {student.trend === 'down' ? '⚠️' : '✅'} {student.mood}
                    </div>
                  </div>
                  <button style={{background:'none', border:'none', color:'var(--primary-light)', cursor:'pointer'}}>
                    <MessageCircle size={20} />
                  </button>
                </div>
              ))
            ) : (
              <p style={{padding:'20px'}}>אין חניכים בקבוצה זו.</p>
            )}
          </div>
        </div>
      </section>
      <section className={styles.section} style={{marginTop: '30px'}}>
        <h2 className={styles.sectionTitle}><Activity size={20} style={{display:'inline', verticalAlign:'middle'}}/> ניהול משימות אישיות (Task Builder)</h2>
        <div className={styles.card} style={{padding: '20px'}}>
          <p style={{marginBottom: '15px'}}>שלח משימה אישית לחניך או לקבוצה.</p>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const res = await fetch('/api/staff/tasks', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                title: formData.get('title'),
                description: formData.get('description'),
                scheduleType: 'once',
                dueDate: formData.get('dueDate') || null
              })
            });
            if (res.ok) {
              alert('משימה נוצרה בהצלחה!');
              e.target.reset();
            } else {
              alert('שגיאה ביצירת משימה');
            }
          }}>
            <div style={{display:'flex', gap:'10px', marginBottom: '10px'}}>
              <input name="title" type="text" placeholder="כותרת המשימה" required style={{flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc'}} />
              <input name="dueDate" type="date" style={{padding: '10px', borderRadius: '8px', border: '1px solid #ccc'}} />
            </div>
            <textarea name="description" placeholder="תיאור מפורט..." style={{width:'100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '10px'}}></textarea>
            <button type="submit" style={{padding: '10px 20px', borderRadius: '8px', background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer'}}>שלח משימה לחניכים</button>
          </form>
        </div>
      </section>
    </div>
  );
}
