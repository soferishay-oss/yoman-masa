'use client';

import { useState, useEffect } from 'react';
import { Users, Activity, MessageCircle, User } from 'lucide-react';
import styles from './staff.module.css';

export default function StaffDashboard() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    fetchStudents();
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/staff/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

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

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      const res = await fetch('/api/staff/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          scheduleType: 'once',
          dueDate: data.dueDate,
          targetAudience: data.groupId ? { groupId: data.groupId } : { type: 'all' }
        })
      });
      if (res.ok) {
        alert('המשימה נשלחה בהצלחה!');
        e.target.reset();
      } else {
        alert('שגיאה בשליחת המשימה');
      }
    } catch (err) {
      console.error(err);
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
            <div className={styles.statNumber}>{students.length}</div>
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
                    <h3>{student.fullName}</h3>
                    <p>עדכון אחרון: {student.journalPosts?.[0] ? new Date(student.journalPosts[0].createdAt).toLocaleDateString('he-IL') : 'אין עדכונים'}</p>
                  </div>
                  <div className={styles.moodIndicator} style={{backgroundColor: student.journalPosts?.[0]?.mood?.ratingValue > 3 ? '#10b981' : '#f59e0b'}}>
                    {student.journalPosts?.[0]?.mood?.ratingValue || '?'}
                  </div>
                </div>
              ))
            ) : (
              <p style={{padding:'20px'}}>לא נמצאו חניכים פעילים או שאינך משויך לקבוצה.</p>
            )}
          </div>
        </div>
      </section>

      <section className={styles.section} style={{marginTop: '30px'}}>
        <h2 className={styles.sectionTitle}><MessageCircle size={20} style={{display:'inline', verticalAlign:'middle'}}/> שליחת משימה חדשה</h2>
        <div className={styles.card} style={{padding: '20px'}}>
          <form onSubmit={handleCreateTask}>
            <div style={{display:'flex', gap:'10px', marginBottom: '10px'}}>
              <input name="title" type="text" placeholder="כותרת המשימה" required style={{flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc'}} />
              <input name="dueDate" type="date" style={{padding: '10px', borderRadius: '8px', border: '1px solid #ccc'}} />
            </div>
            <div style={{marginBottom: '10px'}}>
              <select name="groupId" style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc'}}>
                <option value="">-- כל החניכים (כללי) --</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <textarea name="description" placeholder="תיאור מפורט..." style={{width:'100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '10px'}}></textarea>
            <button type="submit" style={{padding: '10px 20px', borderRadius: '8px', background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer'}}>שלח משימה לחניכים</button>
          </form>
        </div>
      </section>
    </div>
  );
}
