'use client';

import { useState, useEffect } from 'react';
import { Users, Activity, MessageCircle, User, CheckSquare, BarChart, Bell, AlertTriangle } from 'lucide-react';
import styles from './staff.module.css';
import TaskBuilder from '@/components/TaskBuilder';
import TaskTracker from '@/components/TaskTracker';
import MoodDashboard from '@/components/MoodDashboard';
import EventBuilder from '@/components/EventBuilder';
import { CalendarDays } from 'lucide-react';

export default function StaffDashboard() {
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('שלום');
  const [alerts, setAlerts] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [triggeringGroupId, setTriggeringGroupId] = useState(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('בוקר טוב');
    else if (hour >= 12 && hour < 17) setGreeting('צהריים טובים');
    else if (hour >= 17 && hour < 21) setGreeting('ערב טוב');
    else setGreeting('לילה טוב');

    fetchProfile();
    fetchStudents();
    fetchGroups();
    fetchAlerts();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/staff/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/staff/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAlertAsRead = async (id) => {
    try {
      await fetch(`/api/staff/alerts/${id}/read`, { method: 'PUT' });
      setAlerts(alerts.map(a => a.id === id ? { ...a, isRead: true } : a));
    } catch (e) {
      console.error(e);
    }
  };

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

  const unreadAlerts = alerts.filter(a => !a.isRead);

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>{greeting} {userName || 'איש צוות'}!</h1>
          <p style={{ margin: '5px 0 0 0' }}>אזור ניהול והדרכת חניכים</p>
        </div>
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowNotificationModal(true)} 
            style={{ background: 'white', border: 'none', borderRadius: '50%', padding: '10px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', position: 'relative' }}
          >
            <Bell size={24} color="#475569" />
            {unreadAlerts.length > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', fontSize: '12px', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {unreadAlerts.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {showNotificationModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '12px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle color="#f59e0b" /> התראות צוות
              </h2>
              <button onClick={() => setShowNotificationModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {alerts.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b' }}>אין התראות חדשות.</p>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} onClick={() => { if (!alert.isRead) markAlertAsRead(alert.id); }} style={{ background: alert.isRead ? '#f8fafc' : '#fee2e2', border: `1px solid ${alert.isRead ? '#e2e8f0' : '#fca5a5'}`, padding: '15px', borderRadius: '8px', cursor: alert.isRead ? 'default' : 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <strong style={{ color: alert.isRead ? '#475569' : '#b91c1c' }}>{alert.content}</strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{new Date(alert.createdAt).toLocaleString('he-IL')}</span>
                    </div>
                    {alert.metadata && (
                      <div style={{ fontSize: '13px', color: '#475569', marginTop: '10px', background: 'rgba(255,255,255,0.5)', padding: '10px', borderRadius: '4px' }}>
                        <div><strong>שולח:</strong> {alert.metadata.senderName}</div>
                        <div><strong>נמען:</strong> {alert.metadata.recipientName}</div>
                        <div style={{ marginTop: '5px' }}><strong>הודעה שנפסלה:</strong> "{alert.metadata.messageContent}"</div>
                        <div style={{ marginTop: '5px', color: '#ef4444' }}><strong>סיבה:</strong> {alert.metadata.reason}</div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Group Bar */}
      {groups.length > 0 && (
        <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', padding: '10px 0', marginBottom: '20px' }}>
          {groups.map(group => (
            <div 
              key={group.id} 
              style={{ 
                background: activeGroupId === group.id ? 'var(--primary-color)' : 'white', 
                border: `1px solid ${activeGroupId === group.id ? 'var(--primary-color)' : '#e2e8f0'}`,
                borderRadius: '12px', 
                padding: '15px', 
                minWidth: '200px',
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => setActiveGroupId(activeGroupId === group.id ? null : group.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: activeGroupId === group.id ? 'white' : '#1e293b', fontSize: '1.1rem' }}>{group.name}</h3>
                <button 
                  onClick={async (e) => {
                    e.stopPropagation();
                    setTriggeringGroupId(group.id);
                    try {
                      const res = await fetch('/api/staff/moods/trigger', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ groupId: group.id })
                      });
                      if (res.ok) alert('שאלון נשלח לכל תלמידי הקבוצה!');
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setTriggeringGroupId(null);
                    }
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: activeGroupId === group.id ? '1px solid rgba(255,255,255,0.4)' : '1px solid #e2e8f0',
                    color: activeGroupId === group.id ? 'white' : 'var(--primary-color)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="הקפץ שאלון מצב רוח לכל חברי הקבוצה"
                  disabled={triggeringGroupId === group.id}
                >
                  <Bell size={16} />
                </button>
              </div>
              <div style={{ fontSize: '13px', color: activeGroupId === group.id ? 'rgba(255,255,255,0.8)' : '#64748b' }}>
                {students.filter(s => s.groupId === group.id || s.classId === group.id).length || students.length} תלמידים
              </div>
            </div>
          ))}
        </div>
      )}

      {activeGroupId ? (
        <section className={styles.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
              <Users size={20} style={{display:'inline', verticalAlign:'middle'}}/> רשימה שמית - {groups.find(g => g.id === activeGroupId)?.name}
            </h2>
          </div>
          <div className={styles.card} style={{ padding: '0' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {students.filter(s => s.classId === activeGroupId || s.groupId === activeGroupId || s.groupMemberships?.some(m => m.groupId === activeGroupId)).map(student => (
                <div 
                  key={student.id} 
                  onClick={() => window.location.href = `/staff/student/${student.id}`}
                  style={{ 
                    padding: '15px 20px', 
                    borderBottom: '1px solid #e2e8f0', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: '#e2e8f0', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={20} color="#475569" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{student.name}</div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>{student.mood}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {student.trend === 'down' ? <Activity color="#ef4444" size={18} /> : student.trend === 'up' ? <Activity color="#10b981" size={18} /> : null}
                    <span style={{ color: 'var(--primary-color)', fontSize: '14px', fontWeight: 'bold' }}>פרופיל {'<'}</span>
                  </div>
                </div>
              ))}
              {students.filter(s => s.classId === activeGroupId || s.groupId === activeGroupId || s.groupMemberships?.some(m => m.groupId === activeGroupId)).length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>אין תלמידים בקבוצה זו.</div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <>
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
      </>
      )}

    </div>
  );
}
