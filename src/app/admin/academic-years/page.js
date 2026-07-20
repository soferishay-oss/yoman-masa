'use client';

import { useState, useEffect } from 'react';
import styles from './archive.module.css';
import { Archive, ChevronDown, ChevronUp, Users, Presentation } from 'lucide-react';
import YearTransitionWizard from '@/components/admin/YearTransitionWizard';

export default function AcademicYearsArchive() {
  const [years, setYears] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedYear, setExpandedYear] = useState(null);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      const res = await fetch('/api/admin/academic-years/history');
      if (res.ok) {
        const data = await res.json();
        setYears(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleYear = (yearId) => {
    if (expandedYear === yearId) {
      setExpandedYear(null);
    } else {
      setExpandedYear(yearId);
    }
  };

  if (isLoading) return <div className={styles.loading}>טוען...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitles}>
          <h1>ארכיון שנות לימוד</h1>
          <p>צפה בהיסטוריית הכיתות, המחנכים והתלמידים משנים קודמות</p>
        </div>
        <button className={styles.transitionBtn} onClick={() => setShowWizard(true)}>
          התחל מעבר שנה / שנה חדשה
        </button>
      </header>

      {showWizard && (
        <div className={styles.wizardOverlay}>
          <YearTransitionWizard onComplete={() => {
            setShowWizard(false);
            fetchYears(); // Refresh list after transition
          }} />
        </div>
      )}

      {years.length === 0 ? (
        <div className={styles.emptyState}>אין עדיין היסטוריה של שנות לימוד.</div>
      ) : (
        <div className={styles.yearsList}>
          {years.map(year => (
            <div key={year.id} className={styles.yearCard}>
              <div className={styles.yearHeader} onClick={() => toggleYear(year.id)}>
                <div className={styles.yearTitle}>
                  <Archive size={24} className={styles.yearIcon} />
                  <h2>שנת הלימודים {year.name} {year.isCurrent && <span className={styles.currentBadge}>(נוכחית)</span>}</h2>
                </div>
                <div className={styles.yearActions}>
                  <span className={styles.dateRange}>
                    {new Date(year.startDate).toLocaleDateString('he-IL')} - {new Date(year.endDate).toLocaleDateString('he-IL')}
                  </span>
                  {expandedYear === year.id ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>

              {expandedYear === year.id && (
                <div className={styles.yearContent}>
                  {year.groupHistories.length === 0 ? (
                    <p className={styles.noData}>לא נשמרה היסטוריית כיתות לשנה זו.</p>
                  ) : (
                    <div className={styles.groupsGrid}>
                      {year.groupHistories.map(gh => (
                        <div key={gh.id} className={styles.groupCard}>
                          <h3 className={styles.groupName}>
                            <Presentation size={18} /> {gh.groupName}
                          </h3>
                          <div className={styles.groupManagers}>
                            <strong>מחנכים:</strong> {gh.managerNames}
                          </div>
                          
                          <div className={styles.studentsList}>
                            <div className={styles.studentsTitle}>
                              <Users size={16} /> תלמידי הכיתה ({gh.studentList?.length || 0}):
                            </div>
                            {gh.studentList && gh.studentList.length > 0 ? (
                              <ul className={styles.studentUl}>
                                {gh.studentList.map(s => (
                                  <li key={s.id}>{s.name}</li>
                                ))}
                              </ul>
                            ) : (
                              <div className={styles.noStudents}>אין תיעוד תלמידים</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
