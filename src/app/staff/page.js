'use client';

import { Users, Activity, MessageCircle, User } from 'lucide-react';
import styles from './staff.module.css';

export default function StaffDashboard() {
  const students = [
    { id: 1, name: 'ישראל ישראלי', mood: 'טוב', trend: 'up' },
    { id: 2, name: 'אברהם כהן', mood: 'זקוק לתשומת לב', trend: 'down' },
    { id: 3, name: 'יצחק לוי', mood: 'מצוין', trend: 'up' },
  ];

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
            {students.map(student => (
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
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
