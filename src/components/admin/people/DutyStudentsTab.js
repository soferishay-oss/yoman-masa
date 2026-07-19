'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import { UserCheck, Search, ExternalLink } from 'lucide-react';

export default function DutyStudentsTab() {
  const [dutyStudents, setDutyStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { show } = useToast();

  useEffect(() => {
    fetchDutyStudents();
  }, []);

  const fetchDutyStudents = async () => {
    try {
      const [resGroups, resRoles] = await Promise.all([
        fetch('/api/admin/groups', { cache: 'no-store' }),
        fetch('/api/admin/roles', { cache: 'no-store' })
      ]);
      
      if (resGroups.ok && resRoles.ok) {
        const groups = await resGroups.json();
        const roles = await resRoles.json();
        const roleMap = {};
        roles.forEach(r => roleMap[r.id] = r.name);
        
        let allDuty = [];
        groups.forEach(group => {
          if (group.groupMembers) {
            group.groupMembers.forEach(gm => {
              if (gm.isDutyStudent && gm.user) {
                allDuty.push({
                  id: `${gm.userId}-${group.id}`,
                  student: gm.user,
                  group: group,
                  roleName: gm.dutyRoleId ? roleMap[gm.dutyRoleId] : 'תורן (ללא הגדרת סוג)'
                });
              }
            });
          }
        });

        allDuty.sort((a, b) => a.student.fullName.localeCompare(b.student.fullName));
        setDutyStudents(allDuty);
      } else {
        show('שגיאה בטעינת תורנים', 'error');
      }
    } catch (err) {
      show('שגיאה בתקשורת', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = dutyStudents.filter(d => d.student.fullName.includes(searchQuery) || d.group.name.includes(searchQuery));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserCheck color="var(--primary-color)" />
          חניכים תורנים
        </h2>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '10px' }} />
          <input 
            type="text" 
            placeholder="חיפוש לפי שם או קבוצה..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 35px 10px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        {isLoading ? (
          <p>טוען נתונים...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>שם החניך התורן</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>סוג תורן</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>מסגרת (כיתה/קבוצה)</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>{item.student.fullName}</td>
                    <td style={{ padding: '12px', color: '#475569', fontSize: '14px' }}>{item.roleName}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', background: item.group.type === 'class' ? '#dbeafe' : '#fef3c7', color: item.group.type === 'class' ? '#1e3a8a' : '#92400e', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                        {item.group.name} ({item.group.type === 'class' ? 'כיתה' : 'קבוצה'})
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button 
                        onClick={() => alert('יש לחזור ללשונית "תלמידים" ולחפש תלמיד זה כדי לערוך את פרטיו')}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        <ExternalLink size={14} /> צפה בפרטים
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>לא נמצאו חניכים תורנים.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
