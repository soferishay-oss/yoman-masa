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
    </div>
  );
}
