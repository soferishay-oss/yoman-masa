'use client';

import { useState, useContext } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import styles from './calendar.module.css';
import { getCalendarGrid, getHebrewDate, getGregorianDate } from '@/lib/dateUtils';
import { ThemeContext } from '@/components/ThemeProvider';

export default function CalendarPage() {
  const theme = useContext(ThemeContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch actual stations from DB
  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const res = await fetch('/api/stations');
      if (res.ok) {
        const data = await res.json();
        // Map array of stations into an object keyed by date string (e.g., YYYY-MM-DD or just day of month if same month)
        // To be safe, let's key by YYYY-MM-DD
        const eventMap = {};
        data.forEach(station => {
          const d = new Date(station.date);
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          eventMap[key] = { title: station.name, type: 'station' };
        });
        setEvents(eventMap);
      }
    } catch (error) {
      console.error('Failed to fetch stations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const grid = getCalendarGrid(currentDate.getFullYear(), currentDate.getMonth());
  const weekdays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  const today = new Date();

  const dominantMode = theme.defaultDateMode || 'hebrew';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>לוח השנה</h1>
        <p>מעקב אחר התחנות והמסעות</p>
      </header>

      <div className={styles.controls}>
        <button onClick={handlePrevMonth}><ChevronRight size={24} /></button>
        <div className={styles.monthLabel}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
            {currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
          </div>
          {grid[15] && (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #666)' }}>
              {grid[15].hebrewMonthStr} {grid[15].hebrewYearStr}
            </div>
          )}
        </div>
        <button onClick={handleNextMonth}><ChevronLeft size={24} /></button>
      </div>

      <div className={styles.calendarGrid}>
        {weekdays.map(d => (
          <div key={d} className={styles.weekday}>{d}</div>
        ))}
        
        {grid.map((dayObj, i) => {
          const isToday = dayObj.date.getDate() === today.getDate() && 
                          dayObj.date.getMonth() === today.getMonth() && 
                          dayObj.date.getFullYear() === today.getFullYear();
          
          const eventKey = `${dayObj.date.getFullYear()}-${dayObj.date.getMonth()}-${dayObj.date.getDate()}`;
          const event = events[eventKey];

          return (
            <div 
              key={i} 
              className={`${styles.dayCell} ${!dayObj.isCurrentMonth ? styles.notCurrentMonth : ''} ${isToday ? styles.today : ''}`}
            >
              <div className={styles.dateLabels}>
                {dominantMode === 'hebrew' ? (
                  <>
                    <span className={styles.dominantDate}>{dayObj.hebrewDay}</span>
                    <span className={styles.subDate}>{dayObj.gregorianDay}</span>
                  </>
                ) : (
                  <>
                    <span className={styles.dominantDate}>{dayObj.gregorianDay}</span>
                    <span className={styles.subDate}>{dayObj.hebrewDay}</span>
                  </>
                )}
              </div>
              
              {dayObj.parasha && dayObj.isCurrentMonth && (
                <div className={styles.parasha}>{dayObj.parasha}</div>
              )}
              
              {event && (
                <div className={styles.events}>
                  <span className={`${styles.eventIndicator} ${event.type === 'station' ? styles.eventStation : ''}`}>
                    {event.title}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
