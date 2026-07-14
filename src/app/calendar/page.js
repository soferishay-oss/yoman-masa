'use client';

import { useState, useContext } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import styles from './calendar.module.css';
import { getCalendarGrid, getHebrewDate, getGregorianDate } from '@/lib/dateUtils';
import { ThemeContext } from '@/components/ThemeProvider';

export default function CalendarPage() {
  const theme = useContext(ThemeContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const grid = getCalendarGrid(currentDate.getFullYear(), currentDate.getMonth());
  const weekdays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
  
  // Mock events
  const mockEvents = {
    '15': { title: 'מסע סיכום', type: 'station' },
    '22': { title: 'שיחת סיום', type: 'event' },
  };

  const today = new Date();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>לוח השנה</h1>
        <p>מעקב אחר התחנות והמסעות</p>
      </header>

      <div className={styles.controls}>
        <button onClick={handlePrevMonth}><ChevronRight size={24} /></button>
        <div className={styles.monthLabel}>
          {currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
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
          
          const event = dayObj.isCurrentMonth ? mockEvents[dayObj.gregorianDay] : null;

          return (
            <div 
              key={i} 
              className={`${styles.dayCell} ${!dayObj.isCurrentMonth ? styles.notCurrentMonth : ''} ${isToday ? styles.today : ''}`}
            >
              <div className={styles.dateLabels}>
                <span className={styles.hebDate}>{dayObj.hebrewDay}</span>
                <span className={styles.gregDate}>{dayObj.gregorianDay}</span>
              </div>
              
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
