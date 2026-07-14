'use client';

import { useContext } from 'react';
import { ThemeContext } from '@/components/ThemeProvider';
import { Map, Users, Star, Mail, Flag, User, BookOpen, ImageIcon, ChevronLeft, Shield } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  const theme = useContext(ThemeContext);

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
        <h1 className={styles.greeting}>מה מחכה לך היום?</h1>
        <p className={styles.subtitle}>המסע שלך. הסיפור שלך.</p>
      </header>

      {/* Open Activities Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>פעילויות פתוחות</h2>
        <div className={styles.activitiesList}>
          
          <div className={styles.activityCard}>
            <div className={`${styles.iconWrapper} ${styles.bgMountain}`}>
               <Map size={24} color="var(--primary-color)" />
            </div>
            <div className={styles.activityContent}>
              <h3>עיבוד מסע אלוני הבשן</h3>
              <p>שתף מה שלקחת מהמסע</p>
            </div>
            <span className={`${styles.statusTag} ${styles.tagOpen}`}>פתוח</span>
            <ChevronLeft className={styles.chevron} size={20} />
          </div>

          <div className={styles.activityCard}>
            <div className={`${styles.iconWrapper} ${styles.bgPurple}`}>
              <Users size={24} color="var(--primary-color)" />
            </div>
            <div className={styles.activityContent}>
              <h3>הכנה לשיחת אמצע שנה</h3>
              <p>שאלות למחשבה לפני הפגישה</p>
            </div>
            <span className={`${styles.statusTag} ${styles.tagOpen}`}>פתוח</span>
            <ChevronLeft className={styles.chevron} size={20} />
          </div>

          <div className={styles.activityCard}>
            <div className={`${styles.iconWrapper} ${styles.bgOrange}`}>
              <Star size={24} color="var(--primary-color)" />
            </div>
            <div className={styles.activityContent}>
              <h3>דירוג שבועי</h3>
              <p>איך עבר עליך השבוע?</p>
            </div>
            <span className={`${styles.statusTag} ${styles.tagPending}`}>ממתין</span>
            <ChevronLeft className={styles.chevron} size={20} />
          </div>

          <div className={styles.activityCard}>
            <div className={`${styles.iconWrapper} ${styles.bgBlue}`}>
              <Mail size={24} color="var(--primary-color)" />
            </div>
            <div className={styles.activityContent}>
              <h3>מכתבי הוקרה לחברים</h3>
              <p>כתוב לחברים מכתב הוקרה</p>
            </div>
            <span className={`${styles.statusTag} ${styles.tagPending}`}>ממתין</span>
            <ChevronLeft className={styles.chevron} size={20} />
          </div>

        </div>
        <button className={styles.textBtn}>
          לכל הפעילויות <ChevronLeft size={16} style={{display: 'inline', verticalAlign: 'middle', marginRight: '4px'}}/>
        </button>
      </section>

      {/* Upcoming Stations Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>התחנות הבאות</h2>
        <div className={styles.stationsScroll}>
          <div className={styles.stationCard}>
            <div className={styles.stationIcon}><Flag size={24} color="var(--primary-color)" /></div>
            <h4>מסע סיכום</h4>
            <p>15.07.25</p>
          </div>
          <div className={styles.stationCard}>
            <div className={styles.stationIcon}><User size={24} color="var(--primary-color)" /></div>
            <h4>שיחת סיום</h4>
            <p>22.07.25</p>
          </div>
          <div className={styles.stationCard}>
            <div className={styles.stationIcon}><BookOpen size={24} color="var(--primary-color)" /></div>
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
