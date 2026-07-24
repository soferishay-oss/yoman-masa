import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Activity, BellPlus, ChevronRight, User, Target } from 'lucide-react';
import StudentProfileClient from './StudentProfileClient';
import StudentMoodChart from '@/components/staff/StudentMoodChart';
import StudentGoalChart from '@/components/StudentGoalChart';

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
        take: 365 // Enough for a year of daily reports
      },
      goals: {
        where: { isPrivate: false },
        include: {
          updates: {
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
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

      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          <Activity color="var(--primary-color)" /> היסטוריית מצב רוח
        </h2>
        
        <StudentMoodChart moodChecks={moodChecks} />
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          <Target color="#f97316" /> יעדים אישיים
        </h2>
        
        {!student.goals || student.goals.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>אין יעדים פומביים להצגה.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {student.goals.map(goal => (
              <div key={goal.id} style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '18px' }}>{goal.title}</h3>
                <StudentGoalChart goal={goal} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
