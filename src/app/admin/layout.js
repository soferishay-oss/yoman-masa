import Link from 'next/link';
import { Home, Users, Settings, BarChart2, Shield, Archive, Map } from 'lucide-react';
import styles from './layout.module.css';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const auth = token ? await verifyToken(token) : null;
  let academicYearName = 'תשפ״ה'; // Default

  if (auth?.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      include: { currentAcademicYear: true }
    });
    if (tenant?.currentAcademicYear) {
      academicYearName = tenant.currentAcademicYear.name;
    }
  }

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Shield className={styles.logoIcon} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2>פאנל ניהול</h2>
            <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', marginTop: '4px' }}>
              שנת הלימודים {academicYearName}
            </span>
          </div>
        </div>
        <nav className={styles.sidebarNav}>
          <Link href="/admin" className={styles.navLink}>
            <Home size={20} />
            <span>קוקפיט (ראשי)</span>
          </Link>
          <Link href="/admin/guidance-track" className={styles.navLink}>
            <Map size={20} />
            <span>מסלול ליווי חינוכי</span>
          </Link>
          <Link href="/admin/people" className={styles.navLink}>
            <Users size={20} />
            <span>קהילה (כיתות, קבוצות, אנשים)</span>
          </Link>
          <Link href="/admin/reports" className={styles.navLink}>
            <BarChart2 size={20} />
            <span>דוחות ונתונים</span>
          </Link>
          <Link href="/admin/academic-years" className={styles.navLink}>
            <Archive size={20} />
            <span>ארכיון שנות לימוד</span>
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
