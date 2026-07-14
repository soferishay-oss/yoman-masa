'use client';

import { User, Settings, Shield, HelpCircle, LogOut, ChevronLeft } from 'lucide-react';
import styles from './profile.module.css';

export default function ProfilePage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.avatar}>
          <User size={40} />
        </div>
        <h1 className={styles.name}>ישראל ישראלי</h1>
        <span className={styles.group}>קבוצת יהודה (מחזור י"ד)</span>
      </header>

      <section className={styles.section}>
        <div className={styles.card}>
          <div className={styles.statRow}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>14</span>
              <span className={styles.statLabel}>רשומות ביומן</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>3</span>
              <span className={styles.statLabel}>מסעות שהושלמו</span>
            </div>
          </div>
          
          <div className={styles.progressContainer}>
            <div className={styles.progressHeader}>
              <span>התקדמות במסע השנתי</span>
              <span>45%</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: '45%' }}></div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>הגדרות וניהול</h2>
        <div className={styles.card}>
          <div className={styles.menuList}>
            <div className={styles.menuItem}>
              <User size={20} className={styles.menuIcon} />
              <span className={styles.menuText}>הגדרות חשבון</span>
              <ChevronLeft size={18} className={styles.chevron} />
            </div>
            <a href="/staff" className={styles.menuItem} style={{textDecoration: 'none'}}>
              <Shield size={20} className={styles.menuIcon} />
              <span className={styles.menuText}>אזור צוות הדרכה</span>
              <ChevronLeft size={18} className={styles.chevron} />
            </a>
            <a href="/admin" className={styles.menuItem} style={{textDecoration: 'none'}}>
              <Settings size={20} className={styles.menuIcon} />
              <span className={styles.menuText}>ניהול מוסד (Admin)</span>
              <ChevronLeft size={18} className={styles.chevron} />
            </a>
            <div className={styles.menuItem}>
              <HelpCircle size={20} className={styles.menuIcon} />
              <span className={styles.menuText}>עזרה ותמיכה</span>
              <ChevronLeft size={18} className={styles.chevron} />
            </div>
            <div className={styles.menuItem}>
              <LogOut size={20} color="#e53e3e" />
              <span className={styles.menuText} style={{color: '#e53e3e'}}>התנתק</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
