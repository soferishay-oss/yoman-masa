import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Activity, BellPlus, ChevronRight, User } from 'lucide-react';
import StudentProfileClient from './StudentProfileClient';

export default async function StudentProfilePage({ params }) {
  const { id: studentId } = await params;
  
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const auth = token ? await verifyToken(token) : null;
  
  if (!auth || (auth.role !== 'staff' && auth.role !== 'admin')) {
    redirect('/login');
  }

  // Fetch student details
  const student = await prisma.user.findUnique({
    where: { id: studentId, tenantId: auth.tenantId },
    include: {
      class: true,
      moodChecks: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!student) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', direction: 'rtl' }}>
        <Link href="/staff" style={{ color: 'var(--primary-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <ChevronRight size={20} /> חזרה לדאשבורד
        </Link>
        <h1>תלמיד לא נמצא</h1>
      </div>
    );
  }

  const moodChecks = student.moodChecks || [];
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', direction: 'rtl' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <Link href="/staff" style={{ color: 'var(--primary-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
          <ChevronRight size={20} /> חזרה לדאשבורד הצוות
        </Link>
        <StudentProfileClient studentId={student.id} />
      </header>

      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ background: '#e2e8f0', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={40} color="#475569" />
        </div>
        <div>
          <h1 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{student.fullName}</h1>
          <p style={{ margin: 0, color: '#64748b' }}>כיתה/קבוצה: {student.class?.name || 'לא משויך'}</p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          <Activity color="var(--primary-color)" /> מדד מצב רוח אחרון
        </h2>
        
        {moodChecks.length === 0 ? (
          <p style={{ color: '#64748b' }}>טרם התקבלו דיווחים מתלמיד זה.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {moodChecks.map((mood, idx) => (
              <div key={mood.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#f8fafc', borderRadius: '8px', borderLeft: `4px solid ${mood.ratingValue >= 4 ? '#10b981' : mood.ratingValue === 3 ? '#f59e0b' : '#ef4444'}` }}>
                <div>
                  <strong>{new Date(mood.createdAt).toLocaleDateString('he-IL')}</strong> - {new Date(mood.createdAt).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: mood.ratingValue >= 4 ? '#10b981' : mood.ratingValue === 3 ? '#f59e0b' : '#ef4444' }}>
                  ציון: {mood.ratingValue} / 5
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
