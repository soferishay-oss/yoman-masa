'use client';

import { useState, useContext, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import styles from './calendar.module.css';
import { getCalendarGrid, getHebrewCalendarGrid, getHebrewDate, getGregorianDate } from '@/lib/dateUtils';
import { HDate } from '@hebcal/core';
import { ThemeContext } from '@/components/ThemeProvider';

export default function CalendarPage() {
  const theme = useContext(ThemeContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [userPrefs, setUserPrefs] = useState({});
  const [personalDominantMode, setPersonalDominantMode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);

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

  const dominantMode = personalDominantMode || theme.defaultDateMode || 'hebrew';

  const handlePrevMonth = () => {
    if (dominantMode === 'hebrew') {
      const h = new HDate(currentDate);
      const prevMonthLastDay = new HDate(1, h.getMonth(), h.getFullYear()).abs() - 1;
      setCurrentDate(new HDate(prevMonthLastDay).greg());
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const handleNextMonth = () => {
    if (dominantMode === 'hebrew') {
      const h = new HDate(currentDate);
      const nextMonthFirstDay = new HDate(1, h.getMonth(), h.getFullYear()).abs() + h.daysInMonth();
      setCurrentDate(new HDate(nextMonthFirstDay).greg());
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const grid = useMemo(() => {
    if (dominantMode === 'hebrew') {
      const h = new HDate(currentDate);
      return getHebrewCalendarGrid(h.getFullYear(), h.getMonth(), theme.themeConfig || {});
    }
    return getCalendarGrid(currentDate.getFullYear(), currentDate.getMonth(), theme.themeConfig || {});
  }, [currentDate, theme.themeConfig, dominantMode]);
  
  const weekdays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  const today = new Date();

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
              onClick={() => {
                if (dayEvents.length > 0 || dayObj.holidays?.length > 0 || dayObj.omer || dayObj.parasha) {
                  setSelectedDayEvents({ dayObj, events: dayEvents });
                }
              }}
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

      {selectedDayEvents && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={() => setSelectedDayEvents(null)}>
          <div style={{
            background: 'white', borderRadius: '12px', padding: '20px', width: '100%', maxWidth: '400px',
            maxHeight: '80vh', overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>
                {dominantMode === 'hebrew' ? selectedDayEvents.dayObj.hebrew : selectedDayEvents.dayObj.gregorian}
              </h3>
              <button onClick={() => setSelectedDayEvents(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {theme.themeConfig?.showParasha !== false && selectedDayEvents.dayObj.parasha && (
                <div style={{ padding: '10px', background: 'var(--primary-light)', color: 'white', borderRadius: '8px' }}>
                  <strong>{selectedDayEvents.dayObj.parasha}</strong>
                </div>
              )}
              
              {selectedDayEvents.dayObj.holidays?.map((h, idx) => (
                <div key={`h-${idx}`} style={{ padding: '10px', border: '1px solid var(--primary-light)', color: 'var(--primary-color)', borderRadius: '8px' }}>
                  <strong>{h}</strong>
                </div>
              ))}
              
              {selectedDayEvents.dayObj.omer && (
                <div style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                  {selectedDayEvents.dayObj.omer}
                </div>
              )}

              {selectedDayEvents.events.map((ev, idx) => (
                <div key={idx} style={{ 
                  padding: '10px', 
                  backgroundColor: ev.color || 'var(--primary-color)', 
                  color: 'white', 
                  borderRadius: '8px' 
                }}>
                  <div style={{ fontWeight: 'bold' }}>{ev.title}</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{ev.type !== 'station' && ev.type !== 'אחר' ? ev.type : ''}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
