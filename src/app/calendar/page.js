'use client';

import { useState, useContext, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import styles from './calendar.module.css';
import { getCalendarGrid, getHebrewDate, getGregorianDate } from '@/lib/dateUtils';
import { ThemeContext } from '@/components/ThemeProvider';

export default function CalendarPage() {
  const theme = useContext(ThemeContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [userPrefs, setUserPrefs] = useState({});
  const [personalDominantMode, setPersonalDominantMode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [stationsRes, eventsRes, prefsRes] = await Promise.all([
        fetch('/api/stations'),
        fetch('/api/events'),
        fetch('/api/user/preferences')
      ]);

      const eventMap = {};

      if (stationsRes.ok) {
        const data = await stationsRes.json();
        data.forEach(station => {
          const d = new Date(station.date || station.scheduledDate);
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          if (!eventMap[key]) eventMap[key] = [];
          eventMap[key].push({ id: station.id, title: station.name, type: 'station', color: 'var(--accent-color)' });
        });
      }

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        data.forEach(ev => {
          const start = new Date(ev.scheduledDate);
          const key = `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`;
          if (!eventMap[key]) eventMap[key] = [];
          eventMap[key].push({ id: ev.id, title: ev.title, type: ev.type, color: ev.color });
          
          if (ev.endDate) {
            let curr = new Date(start);
            curr.setDate(curr.getDate() + 1);
            const end = new Date(ev.endDate);
            while (curr <= end) {
              const k = `${curr.getFullYear()}-${curr.getMonth()}-${curr.getDate()}`;
              if (!eventMap[k]) eventMap[k] = [];
              eventMap[k].push({ id: ev.id, title: ev.title, type: ev.type, color: ev.color });
              curr.setDate(curr.getDate() + 1);
            }
          }
        });
      }

      setEvents(eventMap);

      if (prefsRes.ok) {
        const prefs = await prefsRes.json();
        setUserPrefs(prefs);
        if (prefs.dominantDateMode) {
          setPersonalDominantMode(prefs.dominantDateMode);
        }
      }
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDominantMode = async () => {
    const currentMode = dominantMode;
    const newMode = currentMode === 'hebrew' ? 'gregorian' : 'hebrew';
    setPersonalDominantMode(newMode);
    try {
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dominantDateMode: newMode })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const grid = useMemo(() => {
    return getCalendarGrid(currentDate.getFullYear(), currentDate.getMonth(), theme.themeConfig || {});
  }, [currentDate, theme.themeConfig]);
  
  const weekdays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  const today = new Date();

  const dominantMode = personalDominantMode || theme.defaultDateMode || 'hebrew';

  // Gather unique Hebrew/Gregorian months spanning this grid
  const hebrewMonthsInView = [...new Set(grid.filter(d => d.isCurrentMonth).map(d => `${d.hebrewMonthStr} ${d.hebrewYearStr}`))];
  const gregorianMonthsInView = [...new Set(grid.filter(d => d.isCurrentMonth).map(d => d.date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })))];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>לוח השנה</h1>
        <p>מעקב אחר אירועים, חגים ותחנות</p>
        <button 
          onClick={toggleDominantMode}
          style={{ marginTop: '10px', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--primary-color)', background: 'transparent', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '13px' }}
        >
          שנה לתצוגה {dominantMode === 'hebrew' ? 'לועזית' : 'עברית'}
        </button>
      </header>

      <div className={styles.controls}>
        <button onClick={handlePrevMonth}><ChevronRight size={24} /></button>
        <div className={styles.monthLabel} style={{ textAlign: 'center' }}>
          {dominantMode === 'hebrew' ? (
            <>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{hebrewMonthsInView.join(' / ')}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #666)' }}>{gregorianMonthsInView.join(' / ')}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{gregorianMonthsInView.join(' / ')}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #666)' }}>{hebrewMonthsInView.join(' / ')}</div>
            </>
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
          const dayEvents = events[eventKey] || [];

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
              
              {theme.themeConfig?.showParasha !== false && dayObj.parasha && dayObj.isCurrentMonth && (
                <div className={styles.parasha}>{dayObj.parasha}</div>
              )}
              
              {dayObj.isCurrentMonth && dayObj.holidays && dayObj.holidays.length > 0 && (
                <div className={styles.events} style={{ marginTop: '2px' }}>
                  {dayObj.holidays.map((h, idx) => (
                    <span key={`h-${idx}`} className={styles.eventIndicator} style={{ backgroundColor: 'transparent', color: 'var(--primary-color)', border: '1px solid var(--primary-light)', padding: '0 2px' }}>
                      {h}
                    </span>
                  ))}
                </div>
              )}

              {dayObj.isCurrentMonth && dayObj.omer && (
                <div style={{ fontSize: '0.65rem', color: '#666', textAlign: 'center', marginTop: '2px' }}>
                  {dayObj.omer}
                </div>
              )}
              
              {dayEvents.length > 0 && (
                <div className={styles.events}>
                  {dayEvents.map((ev, idx) => (
                    <span key={idx} className={styles.eventIndicator} style={ev.color ? { backgroundColor: ev.color } : {}}>
                      {ev.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
