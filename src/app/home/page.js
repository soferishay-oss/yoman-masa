'use client';

import { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '@/components/ThemeProvider';
import { BookOpen, Map, Home as HomeIcon, CheckCircle, Clock, Users, Star, Mail, Flag, User, ImageIcon, ChevronLeft, Shield } from 'lucide-react';
import styles from '../page.module.css';
import Link from 'next/link';
import TaskItem from '@/components/TaskItem';
import StudentTimeline from '@/components/StudentTimeline';
import { useToast } from '@/components/ToastProvider';
import MoodSurveyModal from '@/components/MoodSurveyModal';

export default function Home() {
  const theme = useContext(ThemeContext);
  const [tasks, setTasks] = useState([]);
  const [userName, setUserName] = useState('');
  const [academicYear, setAcademicYear] = useState('');
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
        setUserName(data.firstName || data.fullName);
        setAcademicYear(data.tenant?.currentAcademicYear?.name || 'תשפ״ה');
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
          <p className={styles.schoolName}>
            {theme.schoolName}
            {academicYear && <span className={styles.academicYearBadge}>{academicYear}</span>}
          </p>
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
        <h1 className={styles.greeting} style={{ fontSize: '22px' }}>{greeting} {userName || 'חבר'}, מה מחכה לך היום?</h1>
        <p className={styles.subtitle} style={{ fontSize: '14px' }}>המסע שלך. הסיפור שלך.</p>
      </header>

      {/* Mood Survey Popup */}
      <MoodSurveyModal />

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
