import './globals.css';
import Link from 'next/link';
import styles from './layout.module.css';

export const metadata = {
  title: 'יומן מסע חינוכי',
  description: 'המסע האישי שלך',
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <main className={styles.mainContent}>
          {children}
        </main>
        
        {/* Bottom Navigation for Mobile-First App Shell */}
        <nav className={styles.bottomNav}>
          <Link href="/profile" className={styles.navItem}>
            <div className={styles.icon}>👤</div>
            <span>פרופיל</span>
          </Link>
          <Link href="/letters" className={styles.navItem}>
            <div className={styles.icon}>❤️</div>
            <span>מה כתבו לי</span>
          </Link>
          
          <div className={styles.fabContainer}>
            <button className={styles.fabBtn}>+</button>
            <span className={styles.fabLabel}>חדש</span>
          </div>
          
          <Link href="/calendar" className={styles.navItem}>
            <div className={styles.icon}>📅</div>
            <span>לוח שנה</span>
          </Link>
          <Link href="/" className={`${styles.navItem} ${styles.active}`}>
            <div className={styles.icon}>🏠</div>
            <span>בית</span>
          </Link>
        </nav>
      </body>
    </html>
  );
}
