'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Flag } from 'lucide-react';
import styles from '@/app/page.module.css';

export default function StudentTimeline() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/student/events');
        if (res.ok) {
          setEvents(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (isLoading) return <p>טוען ציר זמן...</p>;
  if (events.length === 0) return null;

  const now = new Date();
  
  // Sort events chronologically
  const sortedEvents = [...events].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

  return (
    <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', padding: '10px 0', scrollbarWidth: 'none' }}>
      {sortedEvents.map(ev => {
        const eventDate = new Date(ev.scheduledDate);
        const isPast = eventDate < now && eventDate.toDateString() !== now.toDateString();
        
        const dateStr = eventDate.toLocaleDateString('he-IL', { month: 'short', day: 'numeric' });
        
        return (
          <div 
            key={ev.id}
            onClick={() => {
              if (isPast || eventDate.toDateString() === now.toDateString()) {
                // Navigate to journal with this event as context (if we support that)
                router.push(`/journal`);
              }
            }}
            style={{ 
              minWidth: '140px', 
              background: isPast ? (ev.color || 'var(--primary-color)') : '#f1f5f9',
              color: isPast ? 'white' : '#64748b',
              padding: '15px', 
              borderRadius: '12px', 
              cursor: isPast || eventDate.toDateString() === now.toDateString() ? 'pointer' : 'default',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              opacity: isPast ? 1 : 0.7,
              border: `2px solid ${isPast ? 'transparent' : '#cbd5e1'}`
            }}
          >
            <div style={{ background: isPast ? 'rgba(255,255,255,0.2)' : 'white', borderRadius: '50%', padding: '10px', marginBottom: '10px' }}>
              <Flag size={20} color={isPast ? 'white' : '#94a3b8'} />
            </div>
            <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>{ev.title}</h4>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>{dateStr}</p>
            {ev.subtitle && <p style={{ margin: '5px 0 0 0', fontSize: '11px', opacity: 0.8 }}>{ev.subtitle}</p>}
          </div>
        );
      })}
    </div>
  );
}
