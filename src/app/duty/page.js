'use client';

import { useState, useEffect } from 'react';
import { Shield, Send, CheckCircle2, XCircle, AlertCircle, Calendar } from 'lucide-react';
import styles from './duty.module.css';

export default function DutyStudentDashboard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [motivationMessage, setMotivationMessage] = useState('היי! אל תשכחו להירשם לאירוע הקרוב, מחכים לכם! 🙌');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/duty/dashboard');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMotivation = async () => {
    if (!data?.groupMembers) return;

    // Filter members who haven't RSVP'd as 'attending'
    const missingMembers = data.groupMembers.filter(m => {
      if (!m.eventRSVPs || m.eventRSVPs.length === 0) return true;
      return m.eventRSVPs[0].status !== 'attending';
    });

    if (missingMembers.length === 0) {
      alert('כולם כבר נרשמו!');
      return;
    }

    const targetUserIds = missingMembers.map(m => m.id);

    setIsSending(true);
    try {
      const res = await fetch('/api/duty/motivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserIds, message: motivationMessage })
      });

      if (res.ok) {
        alert('הודעת מוטיבציה נשלחה בהצלחה!');
      } else {
        alert('שגיאה בשליחת ההודעה');
      }
    } catch (err) {
      console.error(err);
      alert('שגיאה בתקשורת השרת');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return <div className={styles.loading}>טוען נתונים...</div>;
  if (!data) return <div className={styles.error}>שגיאה בטעינת נתוני הקבוצה</div>;

  const { activeEvent, groupMembers } = data;

  const totalMembers = groupMembers.length;
  const attendingCount = groupMembers.filter(m => m.eventRSVPs && m.eventRSVPs[0]?.status === 'attending').length;
  const missingCount = totalMembers - attendingCount;
  
  const percentage = totalMembers > 0 ? Math.round((attendingCount / totalMembers) * 100) : 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <Shield size={32} color="white" />
        </div>
        <h1>אזור חניך תורן</h1>
        <p>מעקב ועידוד הרשמה לקבוצה שלך</p>
      </header>

      {activeEvent ? (
        <div className={styles.eventCard}>
          <div className={styles.eventInfo}>
            <h2>האירוע הקרוב: {activeEvent.title}</h2>
            <div className={styles.dateRow}>
              <Calendar size={18} />
              <span>{new Date(activeEvent.date).toLocaleDateString('he-IL')}</span>
            </div>
          </div>

          <div className={styles.statsContainer}>
            <div className={styles.statCircle}>
              <svg viewBox="0 0 36 36" className={styles.circularChart}>
                <path
                  className={styles.circleBg}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={styles.circle}
                  strokeDasharray={`${percentage}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className={styles.percentage}>{percentage}%</text>
              </svg>
              <div className={styles.statLabel}>נרשמו</div>
            </div>

            <div className={styles.statNumbers}>
              <div className={styles.statRow}>
                <CheckCircle2 size={18} color="#10b981" />
                <span><strong>{attendingCount}</strong> מגיעים</span>
              </div>
              <div className={styles.statRow}>
                <AlertCircle size={18} color="#f59e0b" />
                <span><strong>{missingCount}</strong> טרם נרשמו</span>
              </div>
            </div>
          </div>

          {missingCount > 0 && (
            <div className={styles.motivateSection}>
              <h3>שליחת הודעת מוטיבציה למאחרים</h3>
              <textarea 
                className={styles.textarea}
                value={motivationMessage}
                onChange={e => setMotivationMessage(e.target.value)}
                rows={3}
              />
              <button 
                className={styles.sendBtn}
                onClick={handleSendMotivation}
                disabled={isSending}
              >
                <Send size={18} />
                {isSending ? 'שולח...' : `שלח תזכורת ל-${missingCount} חניכים`}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Calendar size={48} color="#cbd5e1" />
          <h2>אין אירועים קרובים</h2>
          <p>אין צורך במעקב הרשמה כרגע.</p>
        </div>
      )}

      <div className={styles.membersList}>
        <h3>פירוט סטטוס הרשמה לקבוצה</h3>
        <div className={styles.list}>
          {groupMembers.map(member => {
            const rsvp = member.eventRSVPs && member.eventRSVPs[0];
            const isAttending = rsvp?.status === 'attending';
            const isDeclined = rsvp?.status === 'not_attending';
            
            return (
              <div key={member.id} className={styles.memberRow}>
                <span className={styles.memberName}>{member.fullName}</span>
                <span className={`${styles.statusBadge} ${isAttending ? styles.success : isDeclined ? styles.danger : styles.warning}`}>
                  {isAttending ? 'מגיע' : isDeclined ? 'לא מגיע' : 'טרם הגיב'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
