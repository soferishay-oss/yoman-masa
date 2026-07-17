'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Users, AlertTriangle, Activity, CalendarCheck, BookOpen } from 'lucide-react';
import styles from './dashboard.module.css';
import Link from 'next/link';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/dashboard');
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return <div className={styles.loading}>טוען נתונים...</div>;
  }

  if (!data) {
    return <div className={styles.error}>שגיאה בטעינת נתונים</div>;
  }

  const hasMoodData = data.moodDistribution.some(m => m.value > 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>קוקפיט ניהול</h1>
        <p>מבט על לכל הפעילות במוסד</p>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
            <Users size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>{data.stats.totalStudents}</h3>
            <p>חניכים פעילים</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#f0fdf4', color: '#22c55e' }}>
            <BookOpen size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>{data.stats.totalGroups}</h3>
            <p>קבוצות/כיתות</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#fef3c7', color: '#eab308' }}>
            <Activity size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>{data.stats.todaysMoods}</h3>
            <p>עדכוני מצב רוח היום</p>
          </div>
        </div>

        <Link href="/staff" style={{ textDecoration: 'none' }}>
          <div className={`${styles.statCard} ${styles.alertCard}`}>
            <div className={styles.statIcon} style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>
              <AlertTriangle size={24} />
            </div>
            <div className={styles.statInfo}>
              <h3 style={{ color: '#ef4444' }}>{data.stats.needsAttentionCount}</h3>
              <p>דורשים תשומת לב</p>
            </div>
          </div>
        </Link>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h2>התפלגות מצב רוח (היום)</h2>
          <div className={styles.chartContainer}>
            {hasMoodData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.moodDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.moodDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [value, 'חניכים']} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyState}>אין נתוני מצב רוח להיום</div>
            )}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h2>אירוע קרוב {data.upcomingEvent ? `- ${data.upcomingEvent.title}` : ''}</h2>
          <div className={styles.eventContainer}>
            {data.upcomingEvent ? (
              <div className={styles.eventStats}>
                <div className={styles.eventRow}>
                  <span>אישרו הגעה:</span>
                  <span className={styles.badge} style={{backgroundColor: '#dcfce7', color: '#166534'}}>{data.upcomingEvent.attending}</span>
                </div>
                <div className={styles.eventRow}>
                  <span>לא מגיעים:</span>
                  <span className={styles.badge} style={{backgroundColor: '#fee2e2', color: '#991b1b'}}>{data.upcomingEvent.declined}</span>
                </div>
                <div className={styles.eventRow}>
                  <span>טרם ענו:</span>
                  <span className={styles.badge} style={{backgroundColor: '#f1f5f9', color: '#334155'}}>{data.upcomingEvent.pending}</span>
                </div>
                <div className={styles.eventRow} style={{ marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                  <strong>עלו לאוטובוס (נוכחים):</strong>
                  <span className={styles.badge} style={{backgroundColor: '#dbeafe', color: '#1e3a8a'}}>{data.upcomingEvent.present}</span>
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>אין אירועים קרובים</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
