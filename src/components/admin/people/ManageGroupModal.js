'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ToastProvider';
import { X, Search, Shield, UserMinus, Plus } from 'lucide-react';
import styles from '@/app/page.module.css';

export default function ManageGroupModal({ groupId, groupName, groupType, onClose }) {
  const [members, setMembers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'staff'
  const { show, confirm } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [groupRes, studentsRes, staffRes] = await Promise.all([
        fetch(`/api/admin/groups/${groupId}`),
        fetch('/api/admin/users?role=student'),
        fetch('/api/admin/users?role=non_student')
      ]);
      
      if (groupRes.ok) {
        const groupData = await groupRes.json();
        setMembers(groupData.members || []);
        setManagers(groupData.managers || []);
      }
      if (studentsRes.ok) {
        setAllStudents(await studentsRes.json());
      }
      if (staffRes.ok) {
        setAllStaff(await staffRes.json());
      }
    } catch (err) {
      console.error(err);
      show('שגיאה בטעינת הנתונים', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDuty = async (userId, isCurrentlyDuty) => {
    try {
      // In the new schema, duty student is determined by a GroupMember record.
      // For both classes and groups, we need to send the updated duty students list.
      const updatedDutyStudentIds = isCurrentlyDuty
        ? members.filter(m => m.isDutyStudent && m.id !== userId).map(m => m.id)
        : [...members.filter(m => m.isDutyStudent).map(m => m.id), userId];

      const res = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dutyStudentIds: updatedDutyStudentIds })
      });
      
      if (res.ok) {
        setMembers(members.map(m => m.id === userId ? { ...m, isDutyStudent: !isCurrentlyDuty } : m));
        show('סטטוס חניך תורן עודכן!');
      } else {
        show('שגיאה בעדכון', 'error');
      }
    } catch (err) {
      show('שגיאה בתקשורת', 'error');
    }
  };

  const handleAddMember = async (userId) => {
    try {
      // API currently takes studentIds as an array to sync members.
      // If type=class, the API needs to update User.classId.
      // If type=group, the API needs to create GroupMember.
      // We will update the PUT endpoint to handle this properly, but for now we'll pass the full array of desired IDs.
      const newStudentIds = [...members.map(m => m.id), userId];
      const res = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: newStudentIds })
      });
      
      if (res.ok) {
        show('תלמיד צורף בהצלחה!');
        fetchData(); // reload
      } else {
        show('שגיאה בצירוף', 'error');
      }
    } catch (err) {
      show('שגיאה בתקשורת', 'error');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!await confirm('להסיר תלמיד זה מהקבוצה/כיתה?')) return;
    try {
      const newStudentIds = members.filter(m => m.id !== userId).map(m => m.id);
      const res = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: newStudentIds })
      });
      
      if (res.ok) {
        show('תלמיד הוסר בהצלחה!');
        fetchData();
      } else {
        show('שגיאה בהסרה', 'error');
      }
    } catch (err) {
      show('שגיאה בתקשורת', 'error');
    }
  };

  const handleAddManager = async (userId) => {
    try {
      const newManagerIds = [...managers.map(m => m.id), userId];
      const res = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerIds: newManagerIds })
      });
      
      if (res.ok) {
        show('איש הצוות צורף כמנהל בהצלחה!');
        fetchData();
      } else {
        show('שגיאה בצירוף מנהל', 'error');
      }
    } catch (err) {
      show('שגיאה בתקשורת', 'error');
    }
  };

  const handleRemoveManager = async (userId) => {
    if (!await confirm('להסיר איש צוות זה מניהול הקבוצה?')) return;
    try {
      const newManagerIds = managers.filter(m => m.id !== userId).map(m => m.id);
      const res = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerIds: newManagerIds })
      });
      
      if (res.ok) {
        show('איש הצוות הוסר מניהול הקבוצה!');
        fetchData();
      } else {
        show('שגיאה בהסרה', 'error');
      }
    } catch (err) {
      show('שגיאה בתקשורת', 'error');
    }
  };

  // Filter students
  const memberIds = new Set(members.map(m => m.id));
  const availableStudents = allStudents.filter(s => !memberIds.has(s.id));
  const searchResultsStudents = availableStudents.filter(s => s.fullName.includes(searchQuery));

  // Filter staff
  const managerIds = new Set(managers.map(m => m.id));
  const availableStaff = allStaff.filter(s => !managerIds.has(s.id));
  const searchResultsStaff = availableStaff.filter(s => s.fullName.includes(searchQuery));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>ניהול משתתפים: {groupName}</h2>
            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button 
                onClick={() => setActiveTab('students')}
                style={{ background: 'none', border: 'none', padding: '5px 0', borderBottom: activeTab === 'students' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'students' ? 'var(--primary-color)' : '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
              >
                תלמידים ({members.length})
              </button>
              <button 
                onClick={() => setActiveTab('staff')}
                style={{ background: 'none', border: 'none', padding: '5px 0', borderBottom: activeTab === 'staff' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'staff' ? 'var(--primary-color)' : '#64748b', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
              >
                אנשי צוות מנהלים ({managers.length})
              </button>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', alignSelf: 'flex-start' }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* List (Right Side) */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', borderLeft: '1px solid #e2e8f0' }}>
            <h3 style={{ marginTop: 0, color: '#1e293b' }}>
              {activeTab === 'students' ? `תלמידים בפנים (${members.length})` : `מנהלים בפנים (${managers.length})`}
            </h3>
            
            {isLoading ? <p>טוען...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeTab === 'students' && members.map(member => (
                  <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', background: member.isDutyStudent ? '#fef3c7' : '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{member.fullName}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => handleToggleDuty(member.id, member.isDutyStudent)}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', border: member.isDutyStudent ? '1px solid #d97706' : '1px solid #cbd5e1', background: member.isDutyStudent ? '#f59e0b' : 'white', color: member.isDutyStudent ? 'white' : '#64748b', fontWeight: 'bold', fontSize: '12px' }}
                      >
                        <Shield size={14} />
                        {member.isDutyStudent ? 'חניך תורן' : 'סמן כתורן'}
                      </button>
                      <button 
                        onClick={() => handleRemoveMember(member.id)}
                        style={{ display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '6px', cursor: 'pointer', border: 'none', background: '#fee2e2', color: '#ef4444' }}
                        title="הסר מהקבוצה"
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {activeTab === 'staff' && managers.map(manager => (
                  <div key={manager.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{manager.fullName}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => handleRemoveManager(manager.id)}
                        style={{ display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '6px', cursor: 'pointer', border: 'none', background: '#fee2e2', color: '#ef4444' }}
                        title="הסר מהקבוצה"
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {activeTab === 'students' && members.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>אין תלמידים משובצים כרגע.</p>}
                {activeTab === 'staff' && managers.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>אין אנשי צוות המנהלים קבוצה זו.</p>}
              </div>
            )}
          </div>

          {/* Add Members (Left Side) */}
          <div style={{ width: '300px', padding: '20px', background: '#f8fafc', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, color: '#1e293b' }}>
              {activeTab === 'students' ? 'הוסף תלמידים' : 'הוסף אנשי צוות'}
            </h3>
            
            <div style={{ position: 'relative', marginBottom: '15px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', right: '10px', top: '10px' }} />
              <input 
                type="text" 
                placeholder="חפש לפי שם..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 30px 10px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeTab === 'students' && searchResultsStudents.slice(0, 50).map(student => (
                <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '14px', color: '#334155' }}>{student.fullName}</span>
                  <button 
                    onClick={() => handleAddMember(student.id)}
                    style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
              
              {activeTab === 'staff' && searchResultsStaff.slice(0, 50).map(staffUser => (
                <div key={staffUser.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '14px', color: '#334155' }}>{staffUser.fullName}</span>
                  <button 
                    onClick={() => handleAddManager(staffUser.id)}
                    style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}

              {activeTab === 'students' && searchResultsStudents.length === 0 && <p style={{ color: '#94a3b8', fontSize: '13px' }}>לא נמצאו תלמידים זמינים.</p>}
              {activeTab === 'staff' && searchResultsStaff.length === 0 && <p style={{ color: '#94a3b8', fontSize: '13px' }}>לא נמצאו אנשי צוות זמינים.</p>}
              
              {activeTab === 'students' && searchResultsStudents.length > 50 && <p style={{ color: '#94a3b8', fontSize: '13px' }}>מציג רק 50 תוצאות, השתמש בחיפוש.</p>}
              {activeTab === 'staff' && searchResultsStaff.length > 50 && <p style={{ color: '#94a3b8', fontSize: '13px' }}>מציג רק 50 תוצאות, השתמש בחיפוש.</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
