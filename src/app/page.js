'use client';

import { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '@/components/ThemeProvider';
import { Map, Users, Star, Mail, Flag, User, BookOpen, ImageIcon, ChevronLeft, Shield } from 'lucide-react';
import styles from './page.module.css';
import Link from 'next/link';
import TaskItem from '@/components/TaskItem';
import StudentTimeline from '@/components/StudentTimeline';
import { useToast } from '@/components/ToastProvider';

export default function Home() {
  const theme = useContext(ThemeContext);
  const [tasks, setTasks] = useState([]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodExplanation, setMoodExplanation] = useState('');
  const [showMoodOptions, setShowMoodOptions] = useState(false);
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('שלום');
  const toast = useToast();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('בוקר טוב');
    else if (hour >= 12 && hour < 17) setGreeting('צהריים טובים');
    else if (hour >= 17 && hour < 21) setGreeting('ערב טוב');
    else setGreeting('לילה טוב');
    
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
            {theme.logoUrl ? (
              <img src={theme.logoUrl} alt="Logo" style={{width: 40, height: 40, objectFit: 'contain', marginBottom: 5}} />
            ) : (
              <Shield className={styles.logoIcon} size={28} />
            )}
            <br/>
            {theme.slogan}
          </div>
        </div>
        <h1 className={styles.greeting}>{greeting} {userName || 'חבר'}, מה מחכה לך היום?</h1>
        <p className={styles.subtitle}>המסע שלך. הסיפור שלך.</p>
      </header>

      {/* Mood Tracker */}
      <section className={styles.section} style={{marginTop: '20px'}}>
        <div className={styles.card} style={{padding: '20px', textAlign: 'center'}}>
          <h3 style={{marginBottom: '15px'}}>איך המרגש היום?</h3>
          {!showMoodOptions ? (
            <div style={{display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '5px'}}>
              {[
                { val: 1, emoji: '😞' },
                { val: 2, emoji: '😕' },
                { val: 3, emoji: '😐' },
                { val: 4, emoji: '🙂' },
                { val: 5, emoji: '🤩' },
              ].map(item => (
                <div 
                  key={item.val}
                  onClick={() => {
                    setSelectedMood(item.val);
                    setShowMoodOptions(true);
                  }}
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
          ) : (
            <div>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>
                { [null, '😞', '😕', '😐', '🙂', '🤩'][selectedMood] }
              </div>
              <textarea
                placeholder="רוצה לשתף קצת יותר? (לא חובה)"
                value={moodExplanation}
                onChange={e => setMoodExplanation(e.target.value)}
                style={{ width: '100%', minHeight: '60px', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px', fontFamily: 'inherit', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowMoodOptions(false);
                    setSelectedMood(null);
                    setMoodExplanation('');
                  }} 
                  style={{ background: '#e2e8f0', color: '#475569', padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  החלף
                </button>
                <button 
                  type="button" 
                  onClick={async () => {
                    if(!selectedMood) return;
                    const res = await fetch('/api/student/mood', {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ ratingValue: selectedMood, explanation: moodExplanation || 'דיווח מהאפליקציה' })
                    });
                    if (res.ok) {
                      if (toast?.show) toast.show('נשמר בהצלחה, תודה על השיתוף!', 'success');
                      else alert('נשמר בהצלחה, תודה על השיתוף!');
                      setShowMoodOptions(false);
                      setSelectedMood(null);
                      setMoodExplanation('');
                    } else {
                      if (toast?.show) toast.show('שגיאה בעדכון מצב רוח', 'error');
                      else alert('שגיאה בעדכון מצב רוח');
                    }
                  }} 
                  style={{ background: 'var(--primary-color)', color: 'white', padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', flex: 1, fontWeight: 'bold' }}
                >
                  שמור
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Open Activities Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>משימות פתוחות מהצוות</h2>
        <div className={styles.activitiesList}>
          
          {tasks.map(assignment => (
            <TaskItem 
              key={assignment.id} 
              assignment={assignment} 
              onComplete={async (assignmentId, checklistState) => {
                const res = await fetch('/api/student/tasks', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ assignmentId, status: 'completed', checklistState })
                });
                if(res.ok) {
                  if (toast?.show) toast.show('כל הכבוד! המשימה הושלמה.', 'success');
                  else alert('כל הכבוד! המשימה הושלמה.');
                  setTasks(tasks.filter(t => t.id !== assignmentId));
                }
              }}
              onProgress={async (assignmentId, checklistState, status) => {
                await fetch('/api/student/tasks', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ assignmentId, status, checklistState })
                });
                setTasks(tasks.map(t => t.id === assignmentId ? { ...t, status, checklistState } : t));
              }}
            />
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
        <h2 className={styles.sectionTitle}>ציר הזמן שלי</h2>
        <StudentTimeline />
      </section>

      {/* Your Journal Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>היומן שלך</h2>
        <Link href="/vault" style={{textDecoration: 'none', color: 'inherit'}}>
          <div className={styles.journalCard}>
            <div className={styles.journalImagePlaceholder}>
              <ImageIcon size={32} color="var(--text-muted)" />
            </div>
            <div className={styles.journalContent}>
              <h3>תיבת הזיכרונות</h3>
              <p className={styles.journalMeta}>הכספת האישית שלך</p>
              <p className={styles.journalSnippet}>לחץ כאן כדי לצפות ברגעים ששמרת...</p>
            </div>
            <ChevronLeft className={styles.chevron} size={20} />
          </div>
        </Link>
      </section>
      
    </div>
  );
}
