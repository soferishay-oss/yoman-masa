'use client';
import { useState } from 'react';
import { Users, GraduationCap, School, Shield } from 'lucide-react';
import styles from '@/app/page.module.css';

// We will implement these components in separate files or inline later.
import ClassesTab from '@/components/admin/people/ClassesTab';
import GroupsTab from '@/components/admin/people/GroupsTab';
import StudentsTab from '@/components/admin/people/StudentsTab';
import StaffTab from '@/components/admin/people/StaffTab';
import RolesTab from '@/components/admin/people/RolesTab';
import DutyStudentsTab from '@/components/admin/people/DutyStudentsTab';

export default function PeopleManagementPage() {
  const [activeTab, setActiveTab] = useState('classes');

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <Users size={32} color="white" />
        </div>
        <h1>ניהול קהילה</h1>
        <p>ניהול כיתות, קבוצות פעילות, תלמידים ואנשי צוות</p>
      </header>

      <div style={{ display: 'flex', overflowX: 'auto', gap: '10px', marginBottom: '20px', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveTab('classes')}
          style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '30px', border: 'none', background: activeTab === 'classes' ? 'var(--primary-color)' : '#f1f5f9', color: activeTab === 'classes' ? 'white' : '#475569', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <School size={18} /> כיתות
        </button>
        <button 
          onClick={() => setActiveTab('groups')}
          style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '30px', border: 'none', background: activeTab === 'groups' ? 'var(--primary-color)' : '#f1f5f9', color: activeTab === 'groups' ? 'white' : '#475569', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <Users size={18} /> קבוצות
        </button>
        <button 
          onClick={() => setActiveTab('students')}
          style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '30px', border: 'none', background: activeTab === 'students' ? 'var(--primary-color)' : '#f1f5f9', color: activeTab === 'students' ? 'white' : '#475569', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <GraduationCap size={18} /> תלמידים
        </button>
        <button 
          onClick={() => setActiveTab('staff')}
          style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '30px', border: 'none', background: activeTab === 'staff' ? 'var(--primary-color)' : '#f1f5f9', color: activeTab === 'staff' ? 'white' : '#475569', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <Shield size={18} /> אנשי צוות
        </button>
        <button 
          onClick={() => setActiveTab('roles')}
          style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '30px', border: 'none', background: activeTab === 'roles' ? 'var(--primary-color)' : '#f1f5f9', color: activeTab === 'roles' ? 'white' : '#475569', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          תפקידים והרשאות
        </button>
        <button 
          onClick={() => setActiveTab('duty')}
          style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '30px', border: 'none', background: activeTab === 'duty' ? 'var(--primary-color)' : '#f1f5f9', color: activeTab === 'duty' ? 'white' : '#475569', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          תורנים
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        {activeTab === 'classes' && <ClassesTab />}
        {activeTab === 'groups' && <GroupsTab />}
        {activeTab === 'students' && <StudentsTab />}
        {activeTab === 'staff' && <StaffTab />}
        {activeTab === 'roles' && <RolesTab />}
        {activeTab === 'duty' && <DutyStudentsTab />}
      </div>
    </div>
  );
}
