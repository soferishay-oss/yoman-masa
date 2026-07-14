import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Header Section */}
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <p className={styles.schoolName}>מכינה קד"צ טכנולוגית<br/>אמית גור אריה</p>
          {/* Mock Logo using text for MVP */}
          <div className={styles.logoBadge}>🛡️<br/>באמונה הם עושים</div>
        </div>
        <h1 className={styles.greeting}>מה מחכה לך היום?</h1>
        <p className={styles.subtitle}>המסע שלך. הסיפור שלך.</p>
      </header>

      {/* Open Activities Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>פעילויות פתוחות</h2>
        <div className={styles.activitiesList}>
          
          <div className={styles.activityCard}>
            <div className={`${styles.iconWrapper} ${styles.bgMountain}`}>⛰️</div>
            <div className={styles.activityContent}>
              <h3>עיבוד מסע אלוני הבשן</h3>
              <p>שתף מה שלקחת מהמסע</p>
            </div>
            <span className={`${styles.statusTag} ${styles.tagOpen}`}>פתוח</span>
            <span className={styles.chevron}>›</span>
          </div>

          <div className={styles.activityCard}>
            <div className={`${styles.iconWrapper} ${styles.bgPurple}`}>👥</div>
            <div className={styles.activityContent}>
              <h3>הכנה לשיחת אמצע שנה</h3>
              <p>שאלות למחשבה לפני הפגישה</p>
            </div>
            <span className={`${styles.statusTag} ${styles.tagOpen}`}>פתוח</span>
            <span className={styles.chevron}>›</span>
          </div>

          <div className={styles.activityCard}>
            <div className={`${styles.iconWrapper} ${styles.bgOrange}`}>⭐</div>
            <div className={styles.activityContent}>
              <h3>דירוג שבועי</h3>
              <p>איך עבר עליך השבוע?</p>
            </div>
            <span className={`${styles.statusTag} ${styles.tagPending}`}>ממתין</span>
            <span className={styles.chevron}>›</span>
          </div>

          <div className={styles.activityCard}>
            <div className={`${styles.iconWrapper} ${styles.bgBlue}`}>✉️</div>
            <div className={styles.activityContent}>
              <h3>מכתבי הוקרה לחברים</h3>
              <p>כתוב לחברים מכתב הוקרה</p>
            </div>
            <span className={`${styles.statusTag} ${styles.tagPending}`}>ממתין</span>
            <span className={styles.chevron}>›</span>
          </div>

        </div>
        <button className={styles.textBtn}>לכל הפעילויות ›</button>
      </section>

      {/* Upcoming Stations Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>התחנות הבאות</h2>
        <div className={styles.stationsScroll}>
          <div className={styles.stationCard}>
            <div className={styles.stationIcon}>🚩</div>
            <h4>מסע סיכום</h4>
            <p>15.07.25</p>
          </div>
          <div className={styles.stationCard}>
            <div className={styles.stationIcon}>👤</div>
            <h4>שיחת סיום</h4>
            <p>22.07.25</p>
          </div>
          <div className={styles.stationCard}>
            <div className={styles.stationIcon}>📖</div>
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
            🏔️
          </div>
          <div className={styles.journalContent}>
            <h3>זיכרונות מהדרך</h3>
            <p className={styles.journalMeta}>מסע יהודה • 22.05.25</p>
            <p className={styles.journalSnippet}>"רגעים פשוטים שהפכו למשמעותיים..."</p>
          </div>
          <span className={styles.chevron}>›</span>
        </div>
      </section>
      
    </div>
  );
}
