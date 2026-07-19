import Link from 'next/link';
import { Home, Users, Settings, BarChart2, Shield } from 'lucide-react';
import styles from './layout.module.css';

export default function AdminLayout({ children }) {
  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Shield className={styles.logoIcon} />
          <h2>פאנל ניהול</h2>
        </div>
        <nav className={styles.sidebarNav}>
          <Link href="/admin" className={styles.navLink}>
            <Home size={20} />
            <span>קוקפיט (ראשי)</span>
          </Link>
          <Link href="/admin/people" className={styles.navLink}>
            <Users size={20} />
            <span>קהילה (כיתות, קבוצות, אנשים)</span>
          </Link>
          <Link href="/admin/reports" className={styles.navLink}>
            <BarChart2 size={20} />
            <span>דוחות ונתונים</span>
          </Link>
          <Link href="/admin/settings" className={styles.navLink}>
            <Settings size={20} />
            <span>הגדרות מוסד</span>
          </Link>
        </nav>
        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.returnLink}>
            חזרה לאפליקציה
          </Link>
        </div>
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
