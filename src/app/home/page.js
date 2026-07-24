'use client';

import { useContext, useState, useEffect, Suspense } from 'react';
import { ThemeContext } from '@/components/ThemeProvider';
import { Shield, Lock, Frown, Meh, Smile, Heart, Star } from 'lucide-react';
import styles from '../page.module.css';
import Link from 'next/link';
import TaskItem from '@/components/TaskItem';
import StudentTimeline from '@/components/StudentTimeline';
import { useToast } from '@/components/ToastProvider';
import MoodSurveyModal from '@/components/MoodSurveyModal';
import GoalReminderModal from '@/components/GoalReminderModal';
import JournalComposer from '@/components/JournalComposer';
import { useSearchParams, useRouter } from 'next/navigation';

function HomeContent() {
  const theme = useContext(ThemeContext);
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [userName, setUserName] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [greeting, setGreeting] = useState('שלום');
  const [initialEditData, setInitialEditData] = useState(null);
  const [guidanceTrack, setGuidanceTrack] = useState('documentation_only');
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
        setUserName(data.firstName || data.fullName.split(' ')[0] || '');
        setAcademicYear(data.tenant?.currentAcademicYear?.name || 'תשפ״ה');
        if (data.tenant?.guidanceTrack) setGuidanceTrack(data.tenant.guidanceTrack);
      }
    }
    fetchTasks();
    fetchProfile();
  }, []);

  useEffect(() => {
    if (editId) {
      async function fetchEntry() {
        try {
          const res = await fetch(`/api/journal/${editId}`);
          if (res.ok) {
            const data = await res.json();
            setInitialEditData(data);
          } else {
            toast.show('לא ניתן לטעון רשומה זו לעריכה', 'error');
            router.replace('/home');
          }
        } catch(e) {
          toast.show('שגיאה בטעינת הרשומה', 'error');
        }
      }
      fetchEntry();
    } else {
      setInitialEditData(null);
    }
  }, [editId, router, toast]);

  const handleMoodSelect = async (moodValue) => {
    try {
      const res = await fetch('/api/student/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratingValue: moodValue, explanation: 'דיווח מהיר ממסך הבית' })
      });
      if (res.ok) {
        toast.show('תודה על השיתוף!', 'success');
      } else {
        toast.show('שגיאה בשמירת מצב הרוח', 'error');
      }
    } catch (e) {
      toast.show('שגיאה בשמירת מצב הרוח', 'error');
    }
  };

  return (
    <div className={styles.container}>
      {/* Refactored Header Section */}
      <header className={styles.header} style={{ paddingBottom: '30px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '20px' }}>
          {/* Right: Logo */}
          <div style={{ width: '60px', textAlign: 'right' }}>
            {theme.logoUrl ? (
              <img src={theme.logoUrl} alt="Logo" style={{width: 50, height: 50, objectFit: 'contain'}} />
            ) : (
              <Shield size={40} color="var(--primary-color)" />
            )}
          </div>
          
          {/* Center: School Name & Slogan */}
          <div style={{ flex: 1, textAlign: 'center', padding: '0 10px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--primary-color)', fontWeight: 'bold' }}>{theme.schoolName}</h2>
            {theme.slogan && <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>{theme.slogan}</p>}
            <div style={{ marginTop: '5px' }}>
              <span style={{ background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                {academicYear}
              </span>
            </div>
          </div>

          {/* Left: App Icon */}
          <div style={{ width: '60px', textAlign: 'left' }}>
            <img src="/icon.png" alt="App Icon" style={{width: 50, height: 50, objectFit: 'contain', borderRadius: '50%'}} />
          </div>
        </div>

        {/* Greeting */}
        <h1 className={styles.greeting} style={{ fontSize: '24px', textAlign: 'center', marginTop: '10px' }}>
          {greeting} {userName}
        </h1>
        
        {/* Arch separating header from content */}
        <div style={{
          position: 'absolute', bottom: '-20px', left: 0, right: 0, height: '40px',
          background: 'var(--bg-color)', borderTopLeftRadius: '50%', borderTopRightRadius: '50%'
        }}></div>
      </header>

      {/* Main Content Area starting under the arch */}
      <div style={{ position: 'relative', zIndex: 1, marginTop: '-10px', padding: '0 15px' }}>
        
        {/* Journal Composer */}
        <JournalComposer initialData={initialEditData} />

        {/* Static Mood Survey */}
        <div style={{
          background: 'white', borderRadius: '16px', padding: '20px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.05)', marginBottom: '30px', textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px' }}>איך המרגש היום?</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button onClick={() => handleMoodSelect(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.2s', fontSize: '32px' }}>😞</button>
            <button onClick={() => handleMoodSelect(2)} style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.2s', fontSize: '32px' }}>😕</button>
            <button onClick={() => handleMoodSelect(3)} style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.2s', fontSize: '32px' }}>😐</button>
            <button onClick={() => handleMoodSelect(4)} style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.2s', fontSize: '32px' }}>🙂</button>
            <button onClick={() => handleMoodSelect(5)} style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.2s', fontSize: '32px' }}>🤩</button>
          </div>
        </div>

        {/* Mood Survey Popup (Reminder) */}
        <MoodSurveyModal />
        <GoalReminderModal />

        {/* Open Activities Section */}
        {guidanceTrack !== 'documentation_only' && (
          <section className={styles.section} style={{ marginTop: '40px' }}>
            <h2 className={styles.sectionTitle} style={{ textAlign: 'center', fontSize: '20px', color: 'var(--primary-color)' }}>משימות פתוחות מהצוות</h2>
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
        )}

        {/* Upcoming Stations Section */}
        <section className={styles.section} style={{ marginTop: '40px' }}>
          <h2 className={styles.sectionTitle} style={{ textAlign: 'center', fontSize: '20px', color: 'var(--primary-color)' }}>ציר הזמן שלי</h2>
          <StudentTimeline />
        </section>

        {/* Vault Section */}
        <section className={styles.section} style={{ textAlign: 'center', marginTop: '40px', marginBottom: '40px' }}>
          <h2 className={styles.sectionTitle} style={{ textAlign: 'center', fontSize: '20px', color: 'var(--primary-color)' }}>דברים שרציתי לשמור</h2>
          <Link href="/vault" style={{textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'center', marginTop: '20px'}}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              padding: '30px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.3s ease',
              width: '80%', maxWidth: '300px'
            }}>
              <div style={{ 
                width: '120px', height: '120px', borderRadius: '30px', background: 'var(--primary-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 15px rgba(0,0,0,0.1)', marginBottom: '20px',
                transform: 'rotate(-5deg)'
              }}>
                <div style={{ transform: 'rotate(5deg)' }}>
                  <Lock size={60} color="white" strokeWidth={1} />
                </div>
              </div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1e293b' }}>הכספת האישית שלך</h3>
              <p style={{ color: '#64748b', margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                לחץ כאן כדי להיכנס ולצפות בכל הרגעים המיוחדים ששמרת במסע.
              </p>
            </div>
          </Link>
        </section>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
