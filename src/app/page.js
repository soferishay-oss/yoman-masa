'use client';

import { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '@/components/ThemeProvider';
import { Map, Users, Star, Mail, Flag, User, BookOpen, ImageIcon, ChevronLeft, Shield } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  const theme = useContext(ThemeContext);
  const [tasks, setTasks] = useState([]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    async function fetchTasks() {
      const res = await fetch('/api/student/tasks');
      if(res.ok) setTasks(await res.json());
    }
    async function fetchProfile() {
      const res = await fetch('/api/profile');
      if(res.ok) {
        const data = await res.json();
        setUserName(data.fullName);
      }
    }
    fetchTasks();
    fetchProfile();
  }, []);

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <p className={styles.schoolName}>{theme.schoolName}</p>
          <div className={styles.logoBadge}>
            <Shield className={styles.logoIcon} size={28} />
            <br/>
            {theme.slogan}
          </div>
        </div>
        <h1 className={styles.greeting}>שלום {userName || 'חבר'}, מה מחכה לך היום?</h1>
        <p className={styles.subtitle}>המסע שלך. הסיפור שלך.</p>
      </header>

      {/* Mood Tracker */}
      <section className={styles.section} style={{marginTop: '20px'}}>
        <div className={styles.card} style={{padding: '20px', textAlign: 'center'}}>
          <h3 style={{marginBottom: '15px'}}>איך המרגש היום?</h3>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if(!selectedMood) return;
            const res = await fetch('/api/student/mood', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ ratingValue: selectedMood, explanation: 'דיווח מדאשבורד' })
            });
            if (res.ok) alert('נשמר בהצלחה, תודה על השיתוף!');
            else alert('שגיאה בעדכון מצב רוח');
          }}>
            <div style={{display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '15px'}}>
              {[
                { val: 1, emoji: '😞' },
                { val: 2, emoji: '😕' },
                { val: 3, emoji: '😐' },
                { val: 4, emoji: '🙂' },
                { val: 5, emoji: '🤩' },
              ].map(item => (
                <div 
                  key={item.val}
                  onClick={() => setSelectedMood(item.val)}
                  style={{
                    cursor: 'pointer',
                    fontSize: '30px',
                    padding: '5px',
                    borderRadius: '50%',
                    background: selectedMood === item.val ? '#e2e8f0' : 'transparent',
                    transform: selectedMood === item.val ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.2s'
                  }}
                >
                  {item.emoji}
                </div>
              ))}
            </div>
            <button type="submit" className={styles.btnPrimary} style={{background: 'var(--primary-color)', color: 'white', padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer'}} disabled={!selectedMood}>שמור</button>
          </form>
        </div>
      </section>

      {/* Open Activities Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>משימות פתוחות מהצוות</h2>
        <div className={styles.activitiesList}>
          
          {tasks.map(task => (
            <div key={task.id} className={styles.activityCard} onClick={async () => {
              if (window.confirm('האם סיימת את המשימה?')) {
                const res = await fetch('/api/student/tasks', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ taskId: task.id })
                });
                if(res.ok) {
                  alert('כל הכבוד!');
                  setTasks(tasks.filter(t => t.id !== task.id));
                }
              }
            }}>
              <div className={`${styles.iconWrapper} ${styles.bgOrange}`}>
                 <Star size={24} color="var(--primary-color)" />
              </div>
              <div className={styles.activityContent}>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
              </div>
              <span className={`${styles.statusTag} ${styles.tagOpen}`}>לביצוע</span>
              <ChevronLeft className={styles.chevron} size={20} />
            </div>
          ))}

          {tasks.length === 0 && (
            <div style={{padding: '20px', color: '#64748b', textAlign: 'center'}}>
              אין משימות פתוחות כרגע.
            </div>
          )}

        </div>
      </section>

      {/* Upcoming Stations Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>התחנות הבאות</h2>
        <div className={styles.stationsScroll}>
          <div className={styles.stationCard}>
            <div className={styles.stationIcon}><Flag size={24} color="white" /></div>
            <h4>מסע סיכום</h4>
            <p>15.07.25</p>
          </div>
          <div className={styles.stationCard}>
            <div className={styles.stationIcon}><User size={24} color="white" /></div>
            <h4>שיחת סיום</h4>
            <p>22.07.25</p>
          </div>
          <div className={styles.stationCard}>
            <div className={styles.stationIcon}><BookOpen size={24} color="white" /></div>
            <h4>טקס סיום שנה</h4>
            <p>05.08.25</p>
          </div>
        </div>
      </section>

      {/* Your Journal Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>היומן שלך</h2>
        <div className={styles.journalCard}>
          <div className={styles.journalImagePlaceholder}>
            <ImageIcon size={32} color="var(--text-muted)" />
          </div>
          <div className={styles.journalContent}>
            <h3>זיכרונות מהדרך</h3>
            <p className={styles.journalMeta}>מסע יהודה • 22.05.25</p>
            <p className={styles.journalSnippet}>"רגעים פשוטים שהפכו למשמעותיים..."</p>
          </div>
          <ChevronLeft className={styles.chevron} size={20} />
        </div>
      </section>
      
    </div>
  );
}
