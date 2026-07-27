import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Activity, BellPlus, ChevronRight, User, Target, BookOpen } from 'lucide-react';
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
      },
      contentEntries: {
        where: { visibility: 'staff' },
        orderBy: { createdAt: 'desc' }
      },
      taskAssignments: {
        include: { task: true },
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

      {/* Shared Journal Entries */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginTop: '20px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          <BookOpen color="#3b82f6" /> יומן מסע (משותף עם הצוות)
        </h2>
        
        {!student.contentEntries || student.contentEntries.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>אין רשומות משותפות.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {student.contentEntries.map(entry => (
              <div key={entry.id} style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#64748b', fontSize: '14px' }}>
                  <span>{new Date(entry.createdAt).toLocaleDateString('he-IL')}</span>
                  {entry.category === 'mood' && <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>מצב רוח</span>}
                </div>
                <p style={{ margin: 0, color: '#1e293b' }}>{entry.bodyText}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Assignments */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginTop: '20px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          <Activity color="#10b981" /> משימות
        </h2>
        
        {!student.taskAssignments || student.taskAssignments.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>לא הוקצו משימות.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {student.taskAssignments.map(assignment => (
              <div key={assignment.id} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{assignment.task.title}</span>
                <span style={{ 
                  background: assignment.status === 'completed' ? '#dcfce7' : '#fef3c7', 
                  color: assignment.status === 'completed' ? '#16a34a' : '#d97706',
                  padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold'
                }}>
                  {assignment.status === 'completed' ? 'הושלם' : (assignment.status === 'opened' ? 'בביצוע' : 'הוקצה')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
