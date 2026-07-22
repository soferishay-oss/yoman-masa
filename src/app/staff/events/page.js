'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, MapPin, Users, Search, Info } from 'lucide-react';
import AppDate from '@/components/AppDate';

export default function StaffEventsPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/staff/events');
      if (res.ok) {
        setEvents(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/staff/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, location, scheduledDate })
      });
      if (res.ok) {
        setTitle('');
        setDescription('');
        setLocation('');
        setScheduledDate('');
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{maxWidth: '800px', margin: '0 auto', padding: '20px'}}>
      <header style={{marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px'}}>
        <Calendar size={32} color="var(--primary-color)" />
        <h1 style={{fontSize: '24px', fontWeight: 'bold'}}>ניהול אירועים ופעילויות</h1>
      </header>

      <div style={{background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '30px'}}>
        <h2 style={{fontSize: '18px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px'}}>
          <Plus size={20} /> צור אירוע חדש
        </h2>
        <form onSubmit={handleCreate} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          <input 
            type="text" 
            placeholder="כותרת האירוע (לדוגמה: מסע חרמון)" 
            value={title} onChange={e => setTitle(e.target.value)}
            required style={{padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}}
          />
          <textarea 
            placeholder="תיאור" 
            value={description} onChange={e => setDescription(e.target.value)}
            style={{padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px'}}
          />
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
            <input 
              type="text" 
              placeholder="מיקום" 
              value={location} onChange={e => setLocation(e.target.value)}
              style={{padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}}
            />
            <input 
              type="date" 
              value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
              required style={{padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}}
            />
          </div>
          <button type="submit" style={{background: 'var(--primary-color)', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer'}}>
            שמור ופרסם
          </button>
        </form>
      </div>

      <div>
        <h2 style={{fontSize: '20px', marginBottom: '15px'}}>אירועים מתוכננים</h2>
        {isLoading ? <p>טוען...</p> : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            {events.length === 0 && <p>אין אירועים.</p>}
            {events.map(ev => {
              const goingCount = ev.rsvps?.filter(r => r.status === 'going').length || 0;
              const notGoingCount = ev.rsvps?.filter(r => r.status === 'not_going').length || 0;
              return (
                <div key={ev.id} style={{background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #eee'}}>
                  <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '5px'}}>{ev.title}</h3>
                  <p style={{color: '#666', fontSize: '14px', marginBottom: '10px'}}>{ev.description}</p>
                  
                  <div style={{display: 'flex', gap: '20px', fontSize: '14px', color: '#555'}}>
                    <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                      <Calendar size={16} /> <AppDate date={ev.scheduledDate} />
                    </span>
                    <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                      <MapPin size={16} /> {ev.location || 'לא צוין'}
                    </span>
                    <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                      <Users size={16} /> RSVP: {goingCount} מגיעים, {notGoingCount} לא
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
