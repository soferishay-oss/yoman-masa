'use client';

import { useState, useEffect } from 'react';
import StudentMoodChart from '@/components/staff/StudentMoodChart';
import { Activity } from 'lucide-react';

export default function StudentChartsPage() {
  const [moods, setMoods] = useState([]);
  const [isLoadingMoods, setIsLoadingMoods] = useState(true);

  useEffect(() => {
    fetchMoods();
  }, []);

  const fetchMoods = async () => {
    try {
      const res = await fetch('/api/student/moods?range=all');
      if (res.ok) {
        const data = await res.json();
        setMoods(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMoods(false);
    }
  };

  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }}>
      
      {/* Mood Chart Section */}
      <div style={{ marginBottom: '40px' }}>
        <header style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'var(--primary-color)', color: 'white', padding: '12px', borderRadius: '12px' }}>
            <Activity size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, color: '#1e293b' }}>מדד מצב הרוח שלי</h2>
            <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>מעקב אחרי איך הרגשתי לאורך התקופה</p>
          </div>
        </header>

        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          {isLoadingMoods ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>טוען נתונים...</p>
          ) : (
            <StudentMoodChart moodChecks={moods} />
          )}
        </div>
      </div>

      </div>

    </div>
  );
}
