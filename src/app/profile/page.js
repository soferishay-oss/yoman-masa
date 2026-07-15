'use client';

import { useState, useEffect } from 'react';
import { User, Settings, Shield, HelpCircle, LogOut, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './profile.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phoneNumber: '', email: '', password: '', confirmPassword: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setEditForm({ fullName: data.fullName || '', phoneNumber: data.phoneNumber || '', email: data.email || '', password: '', confirmPassword: '' });
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      alert('הסיסמאות אינן תואמות');
      return;
    }

    try {
      const payload = { 
        fullName: editForm.fullName, 
        phoneNumber: editForm.phoneNumber, 
        email: editForm.email 
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setProfile({...profile, fullName: data.fullName, phoneNumber: data.phoneNumber, email: data.email});
        setIsEditing(false);
        alert('הפרופיל עודכן בהצלחה');
      } else {
        alert('שגיאה בעדכון הפרופיל');
      }
    } catch (err) {
      console.error(err);
      alert('שגיאה בעדכון הפרופיל');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (isLoading) {
    return <div className={styles.container}><p style={{padding:'20px'}}>טוען נתונים...</p></div>;
  }

  if (!profile) {
    return <div className={styles.container}><p style={{padding:'20px'}}>שגיאה בטעינת פרופיל</p></div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.avatar}>
          <User size={40} />
        </div>
        <h1 className={styles.name}>{profile.fullName}</h1>
        <span className={styles.group}>{profile.groupName}</span>
      </header>

      <section className={styles.section}>
        <div className={styles.card}>
          <div className={styles.statRow}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{profile.stats.journalCount}</span>
              <span className={styles.statLabel}>רשומות ביומן</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{profile.stats.completedStations}</span>
              <span className={styles.statLabel}>מסעות שהושלמו</span>
            </div>
          </div>
          
          <div className={styles.progressContainer}>
            <div className={styles.progressHeader}>
              <span>התקדמות במסע השנתי</span>
              <span>{profile.stats.progress}%</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${profile.stats.progress}%` }}></div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>הגדרות וניהול</h2>
        <div className={styles.card}>
          {isEditing ? (
            <form onSubmit={handleSaveProfile} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              <div>
                <label style={{display: 'block', fontSize: '14px', marginBottom: '5px', color: '#64748b'}}>שם מלא</label>
                <input type="text" value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1'}} required />
              </div>
              <div>
                <label style={{display: 'block', fontSize: '14px', marginBottom: '5px', color: '#64748b'}}>מספר טלפון</label>
                <input type="tel" value={editForm.phoneNumber} onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1'}} />
              </div>
              <div>
                <label style={{display: 'block', fontSize: '14px', marginBottom: '5px', color: '#64748b'}}>דוא"ל</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1'}} />
              </div>
              <div style={{borderTop: '1px solid #e2e8f0', margin: '10px 0', paddingTop: '10px'}}>
                <label style={{display: 'block', fontSize: '14px', marginBottom: '5px', color: '#64748b'}}>סיסמא חדשה (השאר ריק אם לא תרצה לשנות)</label>
                <input type="password" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1'}} />
              </div>
              {editForm.password && (
                <div>
                  <label style={{display: 'block', fontSize: '14px', marginBottom: '5px', color: '#64748b'}}>אימות סיסמא חדשה</label>
                  <input type="password" value={editForm.confirmPassword} onChange={e => setEditForm({...editForm, confirmPassword: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1'}} required={!!editForm.password} />
                </div>
              )}
              <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                <button type="button" onClick={() => setIsEditing(false)} style={{flex: 1, padding: '10px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}>ביטול</button>
                <button type="submit" style={{flex: 1, padding: '10px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}>שמור שינויים</button>
              </div>
            </form>
          ) : (
            <div className={styles.menuList}>
              <div className={styles.menuItem} onClick={() => setIsEditing(true)} style={{cursor: 'pointer'}}>
                <User size={20} className={styles.menuIcon} />
                <span className={styles.menuText}>הגדרות חשבון (עריכת פרטים אישיים)</span>
                <ChevronLeft size={18} className={styles.chevron} />
              </div>
            {(profile.role === 'staff' || profile.role === 'admin') && (
              <a href="/staff" className={styles.menuItem} style={{textDecoration: 'none'}}>
                <Shield size={20} className={styles.menuIcon} />
                <span className={styles.menuText}>אזור צוות הדרכה</span>
                <ChevronLeft size={18} className={styles.chevron} />
              </a>
            )}
            {profile.role === 'admin' && (
              <a href="/admin" className={styles.menuItem} style={{textDecoration: 'none'}}>
                <Settings size={20} className={styles.menuIcon} />
                <span className={styles.menuText}>ניהול מוסד (Admin)</span>
                <ChevronLeft size={18} className={styles.chevron} />
              </a>
            )}
            <div className={styles.menuItem}>
              <HelpCircle size={20} className={styles.menuIcon} />
              <span className={styles.menuText}>עזרה ותמיכה</span>
              <ChevronLeft size={18} className={styles.chevron} />
            </div>
            <div className={styles.menuItem} onClick={handleLogout} style={{ cursor: 'pointer' }}>
              <LogOut size={20} color="#e53e3e" />
              <span className={styles.menuText} style={{color: '#e53e3e'}}>התנתק</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
