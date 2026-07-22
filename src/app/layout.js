import './globals.css';
import Link from 'next/link';
import { User, Heart, Calendar, Home, BookOpen, Shield } from 'lucide-react';
import { headers } from 'next/headers';
import styles from './layout.module.css';
import ThemeProvider from '@/components/ThemeProvider';
import ErrorTracker from '@/components/ErrorTracker';
import { ToastProvider } from '@/components/ToastProvider';
import HamburgerMenu from '@/components/HamburgerMenu';

export const metadata = {
  title: 'יומן מסע חינוכי',
  description: 'המסע האישי שלך',
};

import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const userRole = headersList.get('x-user-role') || 'student';
  const userId = headersList.get('x-user-id');
  const isStudent = userRole === 'student';
  const isDutyStudent = headersList.get('x-is-duty-student') === 'true';

  // If user is authenticated, check their status in the database
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true }
    });
    if (!user || user.status === 'deleted' || user.status === 'suspended') {
      redirect('/login?error=suspended');
    }
  }

  return (
    <html lang="he" dir="rtl">
      <body>
        <ToastProvider>
        <ThemeProvider>
          <main className={styles.mainContent}>
            <ErrorTracker />
            {children}
          </main>
        
        {/* Bottom Navigation for Mobile-First App Shell */}
        {userId && (
          isStudent ? (
            <>
              <HamburgerMenu isDutyStudent={isDutyStudent} />
              
              <nav className={styles.bottomNav}>
                <Link href="/calendar" className={styles.navItem}>
                  <div className={styles.icon}><Calendar size={24} /></div>
                  <span>לוח מסע</span>
                </Link>
                
                <Link href="/journal" className={styles.navItem}>
                  <div className={styles.icon}><BookOpen size={24} /></div>
                  <span>היומן שלי</span>
                </Link>
                
                <Link href="/home" className={styles.navItem}>
                  <div className={styles.icon}><Home size={24} /></div>
                  <span>בית</span>
                </Link>
              </nav>
            </>
          ) : (
            <nav className={styles.bottomNav}>
              <Link href="/profile" className={styles.navItem}>
                <div className={styles.icon}><User size={24} /></div>
                <span>פרופיל</span>
              </Link>
              <Link href="/staff/archive" className={styles.navItem}>
                <div className={styles.icon}><BookOpen size={24} /></div>
                <span>ארכיון</span>
              </Link>
              <Link href={userRole === 'admin' ? '/admin' : '/staff'} className={`${styles.navItem} ${styles.active}`}>
                <div className={styles.icon}><Home size={24} /></div>
                <span>{userRole === 'admin' ? 'פאנל ניהול' : 'אזור צוות'}</span>
              </Link>
            </nav>
          )
        )}
        </ThemeProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
