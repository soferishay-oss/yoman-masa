'use client';

import { useState, useEffect } from 'react';
import StudentMoodChart from '@/components/staff/StudentMoodChart';
import { Activity } from 'lucide-react';

export default function StudentMoodChartPage() {
  const [moods, setMoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMoods();
  }, []);

  const fetchMoods = async () => {
    try {
      // Fetch all time, filtering happens inside the chart component
      const res = await fetch('/api/student/moods?range=all');
      if (res.ok) {
        const data = await res.json();
        setMoods(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ background: 'var(--primary-color)', color: 'white', padding: '12px', borderRadius: '12px' }}>
          <Activity size={24} />
        </div>
        <div>
          <h1 style={{ margin: 0, color: '#1e293b' }}>גרף מצבי הרוח שלי</h1>
          <p style={{ margin: '5px 0 0 0', color: '#64748b' }}>מעקב אחרי איך הרגשתי לאורך התקופה</p>
        </div>
      </header>

      <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        {isLoading ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>טוען נתונים...</p>
        ) : (
          <StudentMoodChart moodChecks={moods} />
        )}
      </div>
    </div>
  );
}
