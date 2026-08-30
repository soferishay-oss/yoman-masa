import './globals.css';
import Link from 'next/link';
import { User, Heart, Calendar, Home, BookOpen, Shield, Target } from 'lucide-react';
import { headers } from 'next/headers';
import styles from './layout.module.css';
import ThemeProvider from '@/components/ThemeProvider';
import ErrorTracker from '@/components/ErrorTracker';
import { ToastProvider } from '@/components/ToastProvider';
import HamburgerMenu from '@/components/HamburgerMenu';
import PwaServiceWorker from '@/components/PwaServiceWorker';

export const metadata = {
  title: 'יומן מסע',
  description: 'המסע האישי שלך',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'יומן מסע',
  },
};

export const viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        status: true,
        agreedToTerms: true,
        forcePasswordChange: true,
        tenant: {
          select: {
            academicYears: { orderBy: { startDate: 'desc' } },
            currentAcademicYear: true
          }
        }
      }
    });
    if (!user || user.status === 'deleted' || user.status === 'suspended') {
      redirect('/login?error=suspended');
    }
    
    const currentPath = headersList.get('x-pathname') || '';
    if (user.forcePasswordChange && currentPath !== '/force-password-change' && !currentPath.startsWith('/api/')) {
      redirect('/force-password-change');
    }
    
    if (!user.agreedToTerms && currentPath !== '/consent' && currentPath !== '/force-password-change' && !currentPath.startsWith('/api/')) {
      redirect('/consent');
    }
  }

  return (
    <html lang="he" dir="rtl">
      <body>
        <ToastProvider>
        <ThemeProvider>
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%) scale(1.5)',
            width: '100%', maxWidth: '600px', height: '100%', opacity: 0.05,
            backgroundImage: 'url(/newlogo.jpeg)', backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center', backgroundSize: 'contain', pointerEvents: 'none', zIndex: -1,
            mixBlendMode: 'multiply'
          }}></div>

          <main className={styles.mainContent}>
            <PwaServiceWorker />
            <ErrorTracker />
            {children}
          </main>
        
        {userId && currentPath !== '/force-password-change' && currentPath !== '/consent' && (
          isStudent ? (
            <>
              <HamburgerMenu 
                isDutyStudent={isDutyStudent} 
                academicYears={user?.tenant?.academicYears || []}
                currentYear={user?.tenant?.currentAcademicYear || null}
              />
              <nav className={styles.bottomNav}>
                <Link href="/home" className={styles.navItem}>
                  <div className={styles.icon}><Home size={24} /></div>
                  <span>בית</span>
                </Link>

                <Link href="/journal" className={styles.fabWrapper}>
                  <div className={styles.fabButton}>
                    <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: '50%', background: 'white' }}>
                      <img src="/newlogo.jpeg" alt="לוגו" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.8)' }} />
                    </div>
                  </div>
                  <span>היומן שלי</span>
                </Link>
                
                <Link href="/student/goals" className={styles.navItem}>
                  <div className={styles.icon}><Target size={24} /></div>
                  <span>היעדים שלי</span>
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
