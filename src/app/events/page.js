'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, CheckCircle, XCircle } from 'lucide-react';
import styles from '../page.module.css'; // reusing some dashboard styles for consistency

export default function StudentEventsPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/student/events');
      if (res.ok) {
        setEvents(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRSVP = async (eventId, status) => {
    try {
      const res = await fetch('/api/student/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, status })
      });
      if (res.ok) {
        // update local state
        setEvents(events.map(ev => {
          if (ev.id === eventId) {
            return {
              ...ev,
              rsvps: [{ status }] // overriding rsvps for local visual update
            };
          }
          return ev;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div style={{padding:'20px'}}>טוען אירועים...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
          <Calendar size={32} />
          <h1>לוח אירועים</h1>
        </div>
        <p>עדכן הגעה לאירועים ולמסעות הקרובים.</p>
      </header>

      <div style={{display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px'}}>
        {events.length === 0 && <p>אין אירועים קרובים כרגע.</p>}
        {events.map(ev => {
          const myStatus = ev.rsvps?.[0]?.status; // Since we filtered `where: { userId }` in API
          
          return (
            <div key={ev.id} className={styles.card} style={{padding: '20px'}}>
              <h3 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '10px'}}>{ev.title}</h3>
              <p style={{color: '#666', marginBottom: '15px'}}>{ev.description}</p>
              
              <div style={{display: 'flex', gap: '20px', marginBottom: '20px', fontSize: '14px', color: '#444'}}>
                <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                  <Calendar size={16} /> {new Date(ev.scheduledDate).toLocaleDateString('he-IL')}
                </span>
                <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                  <MapPin size={16} /> {ev.location || 'לא צוין'}
                </span>
              </div>

              <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <span style={{fontWeight: 'bold', marginLeft: '10px'}}>האם תגיע?</span>
                
                <button 
                  onClick={() => handleRSVP(ev.id, 'going')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 15px', borderRadius: '20px',
                    border: myStatus === 'going' ? '2px solid #22c55e' : '1px solid #ddd',
                    background: myStatus === 'going' ? '#dcfce7' : 'white',
                    color: myStatus === 'going' ? '#166534' : '#666',
                    cursor: 'pointer', fontWeight: 'bold'
                  }}
                >
                  <CheckCircle size={18} /> מגיע
                </button>
                
                <button 
                  onClick={() => handleRSVP(ev.id, 'not_going')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 15px', borderRadius: '20px',
                    border: myStatus === 'not_going' ? '2px solid #ef4444' : '1px solid #ddd',
                    background: myStatus === 'not_going' ? '#fee2e2' : 'white',
                    color: myStatus === 'not_going' ? '#991b1b' : '#666',
                    cursor: 'pointer', fontWeight: 'bold'
                  }}
                >
                  <XCircle size={18} /> לא מגיע
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
