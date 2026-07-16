'use client';
import { useState, useEffect } from 'react';
import { Activity, User, AlertTriangle, TrendingDown } from 'lucide-react';
import styles from '@/app/staff/staff.module.css';

export default function MoodDashboard({ isAdmin = false }) {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, attention, negative_trend
  const [selectedGroupId, setSelectedGroupId] = useState('all');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      // If admin, we can fetch all. If staff, fetch their group.
      const endpoint = isAdmin ? '/api/admin/users' : '/api/staff/group';
      const res = await fetch(endpoint);
      if (res.ok) {
        let data = await res.json();
        // Since admin API might return all users, filter out only students
        if (isAdmin) {
          data = data.filter(u => u.role === 'student');
        }
        
        // Fetch moods for these students
        const moodsRes = await fetch('/api/staff/moods');
        if (moodsRes.ok) {
          const allMoods = await moodsRes.json();
          // Attach moods to students
          data = data.map(student => {
            const studentMoods = allMoods.filter(m => m.userId === student.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return { ...student, moods: studentMoods };
          });
        }
        setStudents(data);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredStudents = () => {
    return students.filter(student => {
      if (selectedGroupId !== 'all' && student.groupId !== selectedGroupId) {
        return false;
      }
      
      const recentMoods = student.moods || [];
      
      if (filter === 'attention') {
        // Attention: At least 2 low moods (< 3) in recent history (e.g. last 5)
        const lowCount = recentMoods.slice(0, 5).filter(m => m.ratingValue < 3).length;
        return lowCount >= 2;
      }
      
      if (filter === 'negative_trend') {
        // Negative Trend: Latest mood is lower than the average of previous moods
        if (recentMoods.length < 2) return false;
        const latest = recentMoods[0].ratingValue;
        const prevAvg = recentMoods.slice(1, 4).reduce((sum, m) => sum + m.ratingValue, 0) / Math.min(3, recentMoods.length - 1);
        return latest < prevAvg;
      }
      
      return true; // 'all'
    });
  };

  const filteredStudents = getFilteredStudents();

  const uniqueGroups = [];
  const groupIds = new Set();
  students.forEach(s => {
    if (s.group && !groupIds.has(s.groupId)) {
      groupIds.add(s.groupId);
      uniqueGroups.push(s.group);
    }
  });

  return (
    <div className={styles.card} style={{ padding: '20px' }}>
      {uniqueGroups.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <select 
            value={selectedGroupId} 
            onChange={(e) => setSelectedGroupId(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white' }}
          >
            <option value="all">כל הכיתות/הקבוצות</option>
            {uniqueGroups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setFilter('all')} 
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: filter === 'all' ? 'var(--primary-color)' : '#e2e8f0', color: filter === 'all' ? 'white' : '#475569', cursor: 'pointer' }}
        >
          כל החניכים
        </button>
        <button 
          onClick={() => setFilter('attention')} 
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: filter === 'attention' ? '#ef4444' : '#e2e8f0', color: filter === 'attention' ? 'white' : '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
        >
          <AlertTriangle size={16} /> דורשים תשומת לב
        </button>
        <button 
          onClick={() => setFilter('negative_trend')} 
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: filter === 'negative_trend' ? '#f59e0b' : '#e2e8f0', color: filter === 'negative_trend' ? 'white' : '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
        >
          <TrendingDown size={16} /> מגמה שלילית
        </button>
      </div>

      <div className={styles.studentList}>
        {isLoading ? (
          <p>טוען נתונים...</p>
        ) : filteredStudents.length > 0 ? (
          filteredStudents.map(student => {
            const latestMood = student.moods?.[0];
            return (
              <div key={student.id} className={styles.studentCard}>
                <div className={styles.studentAvatar}>
                  <User size={20} />
                </div>
                <div className={styles.studentInfo}>
                  <h3>{student.fullName}</h3>
                  <p>
                    {latestMood 
                      ? `עדכון אחרון: ${new Date(latestMood.createdAt).toLocaleDateString('he-IL')}` 
                      : 'טרם דווח'}
                  </p>
                </div>
                {latestMood && (
                  <div className={styles.moodIndicator} style={{backgroundColor: latestMood.ratingValue >= 4 ? '#10b981' : latestMood.ratingValue === 3 ? '#f59e0b' : '#ef4444'}}>
                    {latestMood.ratingValue}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p>אין חניכים תואמים לסינון זה.</p>
        )}
      </div>
    </div>
  );
}
