'use client';

import { useState, useEffect } from 'react';
import { Users, Activity, MessageCircle, User, CheckSquare, BarChart } from 'lucide-react';
import styles from './staff.module.css';
import TaskBuilder from '@/components/TaskBuilder';
import TaskTracker from '@/components/TaskTracker';
import MoodDashboard from '@/components/MoodDashboard';
import EventBuilder from '@/components/EventBuilder';
import { CalendarDays } from 'lucide-react';

export default function StaffDashboard() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('שלום');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('בוקר טוב');
    else if (hour >= 12 && hour < 17) setGreeting('צהריים טובים');
    else if (hour >= 17 && hour < 21) setGreeting('ערב טוב');
    else setGreeting('לילה טוב');

    fetchProfile();
    fetchStudents();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setUserName(data.fullName);
      }
    } catch (e) {
      console.error(e);
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{greeting} {userName || 'איש צוות'}!</h1>
        <p>אזור ניהול והדרכת חניכים</p>
      </header>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveTab('overview')} 
          style={{ flex: 1, minWidth: '120px', padding: '12px', borderRadius: '8px', border: 'none', background: activeTab === 'overview' ? 'var(--primary-color)' : '#e2e8f0', color: activeTab === 'overview' ? 'white' : '#475569', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
        >
          <BarChart size={18} /> דאשבורד מצבי רוח
        </button>
        <button 
          onClick={() => setActiveTab('task_builder')} 
          style={{ flex: 1, minWidth: '120px', padding: '12px', borderRadius: '8px', border: 'none', background: activeTab === 'task_builder' ? 'var(--primary-color)' : '#e2e8f0', color: activeTab === 'task_builder' ? 'white' : '#475569', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
        >
          <MessageCircle size={18} /> יצירת משימה
        </button>
        <button 
          onClick={() => setActiveTab('task_tracker')} 
          style={{ flex: 1, minWidth: '120px', padding: '12px', borderRadius: '8px', border: 'none', background: activeTab === 'task_tracker' ? 'var(--primary-color)' : '#e2e8f0', color: activeTab === 'task_tracker' ? 'white' : '#475569', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
        >
          <CheckSquare size={18} /> מעקב משימות
        </button>
        <button 
          onClick={() => setActiveTab('events')} 
          style={{ flex: 1, minWidth: '120px', padding: '12px', borderRadius: '8px', border: 'none', background: activeTab === 'events' ? 'var(--primary-color)' : '#e2e8f0', color: activeTab === 'events' ? 'white' : '#475569', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
        >
          <CalendarDays size={18} /> לוח אירועים
        </button>
      </div>

      {activeTab === 'overview' && (
        <section className={styles.section}>
          <MoodDashboard isAdmin={false} />
        </section>
      )}

      {activeTab === 'task_builder' && (
        <section className={styles.section}>
          <TaskBuilder onTaskCreated={() => setActiveTab('task_tracker')} />
        </section>
      )}

      {activeTab === 'task_tracker' && (
        <section className={styles.section}>
          <TaskTracker />
        </section>
      )}

      {activeTab === 'events' && (
        <section className={styles.section}>
          <EventBuilder />
        </section>
      )}

    </div>
  );
}
