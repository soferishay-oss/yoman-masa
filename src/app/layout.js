import './globals.css';
import Link from 'next/link';
import { User, Heart, Calendar, Home, Plus } from 'lucide-react';
import styles from './layout.module.css';
import ThemeProvider from '@/components/ThemeProvider';

export const metadata = {
  title: 'יומן מסע חינוכי',
  description: 'המסע האישי שלך',
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <ThemeProvider>
          <main className={styles.mainContent}>
            {children}
          </main>
        
        {/* Bottom Navigation for Mobile-First App Shell */}
        <nav className={styles.bottomNav}>
          <Link href="/profile" className={styles.navItem}>
            <div className={styles.icon}><User size={24} /></div>
            <span>פרופיל</span>
          </Link>
          <Link href="/letters" className={styles.navItem}>
            <div className={styles.icon}><Heart size={24} /></div>
            <span>מה כתבו לי</span>
          </Link>
          
          <div className={styles.fabContainer}>
            <button className={styles.fabBtn}><Plus size={28} /></button>
            <span className={styles.fabLabel}>חדש</span>
          </div>
          
          <Link href="/calendar" className={styles.navItem}>
            <div className={styles.icon}><Calendar size={24} /></div>
            <span>לוח שנה</span>
          </Link>
          <Link href="/" className={`${styles.navItem} ${styles.active}`}>
            <div className={styles.icon}><Home size={24} /></div>
            <span>בית</span>
          </Link>
        </nav>
        </ThemeProvider>
      </body>
    </html>
  );
}
