'use client';
/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from 'react';
import { Calendar, Plus, MapPin, Tag, Palette, CalendarDays } from 'lucide-react';
import AppDate, { formatAppDateString } from '@/components/AppDate';
import styles from '@/app/staff/staff.module.css';
import { ThemeContext } from '@/components/ThemeProvider';
import { useContext } from 'react';

const EVENT_TYPES = ['שבת', 'מסע', 'יום חזון', 'סיור סליחות', 'אחר'];
const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];

export default function EventBuilder() {
  const theme = useContext(ThemeContext);
  const eventTypeColors = theme.themeConfig?.eventTypeColors || {};
  
  const [events, setEvents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState('שבת');
  const [customType, setCustomType] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [showOnCalendar, setShowOnCalendar] = useState(true);
  const [audienceType, setAudienceType] = useState('all'); // all, classes
  const [audienceClassIds, setAudienceClassIds] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  
  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (type && type !== 'אחר' && eventTypeColors[type]) {
      setColor(eventTypeColors[type]);
    }
  }, [type]);

  async function fetchEvents() {
    try {
      const [resEvents, resClasses] = await Promise.all([
        fetch('/api/staff/events'),
        fetch('/api/staff/groups')
      ]);
      if (resEvents.ok) setEvents(await resEvents.json());
      if (resClasses.ok) setClasses(await resClasses.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const eventType = type === 'אחר' && customType ? customType : type;
    
    try {
      const res = await fetch('/api/staff/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type: eventType,
          subtitle,
          color,
          scheduledDate: new Date(scheduledDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : null,
          location,
          showOnCalendar,
          targetAudience: audienceType === 'all' ? { type: 'all' } : { type: 'classes', classIds: audienceClassIds }
        })
      });
      if (res.ok) {
        setTitle('');
        setCustomType('');
        setSubtitle('');
        setLocation('');
        setScheduledDate('');
        setEndDate('');
        fetchEvents();
        setStatusMsg('האירוע נשמר בהצלחה!');
        setTimeout(() => setStatusMsg(''), 3000);
      } else {
        setStatusMsg('שגיאה בשמירת אירוע');
      }
    } catch (err) {
      console.error(err);
      setStatusMsg('שגיאה בתקשורת');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('האם למחוק אירוע זה? המחיקה לא תמחק משימות הקשורות אליו, אך תנתק אותן.')) return;
    try {
      const res = await fetch(`/api/staff/events/${id}`, { method: 'DELETE' });
      if (res.ok) fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  // Derive unique event types including those added as "other"
  const allEventTypes = [...new Set([...EVENT_TYPES, ...events.map(e => e.type).filter(Boolean)])];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <form onSubmit={handleCreateEvent} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary-color)' }}>
          <Calendar size={20} /> הוספת אירוע חדש ללוח השנה
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>כותרת האירוע</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="לדוגמא: מסע בראשית" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>סוג אירוע</label>
            <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              {allEventTypes.map(t => <option key={t} value={t}>{t}</option>)}
              {!allEventTypes.includes('אחר') && <option value="אחר">אחר</option>}
            </select>
            {type === 'אחר' && (
              <input type="text" value={customType} onChange={e => setCustomType(e.target.value)} required placeholder="הקלד סוג אירוע..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '5px' }} />
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>תאריך התחלה</label>
            <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>תאריך סיום (אופציונלי)</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={scheduledDate} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>כיתוב נלווה (אופציונלי)</label>
            <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="לדוגמא: הרי יהודה" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>צבע להצגה בלוח השנה</label>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setColor(c)} style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, cursor: 'pointer', border: color === c ? '2px solid black' : '2px solid transparent' }} />
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>קהל יעד</label>
            <select value={audienceType} onChange={e => setAudienceType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '5px' }}>
              <option value="all">כלל המוסד</option>
              <option value="classes">כיתות ספציפיות</option>
            </select>
            {audienceType === 'classes' && (
              <select multiple value={audienceClassIds} onChange={e => setAudienceClassIds(Array.from(e.target.selectedOptions, option => option.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px' }}>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '30px' }}>
              <input type="checkbox" checked={showOnCalendar} onChange={e => setShowOnCalendar(e.target.checked)} style={{ width: '20px', height: '20px' }} />
              <span style={{ fontSize: '14px', color: '#334155', fontWeight: 'bold' }}>הצג אירוע בלוח השנה</span>
            </label>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '5px', marginRight: '30px' }}>אם מבוטל, האירוע יישמר במערכת אך לא יופיע בלוחות השנה של התלמידים והצוות.</p>
          </div>
        </div>

        <button type="submit" style={{ padding: '12px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <Plus size={20} /> שמור אירוע
        </button>
        {statusMsg && (
          <div style={{ color: statusMsg.includes('שגיאה') ? '#ef4444' : '#10b981', textAlign: 'center', fontWeight: 'bold' }}>
            {statusMsg}
          </div>
        )}
      </form>

      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
        <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CalendarDays size={20} /> האירועים הקרובים
        </h3>
        
        {isLoading ? <p>טוען...</p> : events.length === 0 ? <p>אין אירועים בלוח השנה</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {events.map(ev => {
              const startStr = formatAppDateString(ev.scheduledDate);
              const endStr = ev.endDate ? formatAppDateString(ev.endDate) : null;
              const dateStr = endStr && endStr !== startStr ? `${startStr} - ${endStr}` : startStr;
              
              return (
                <div key={ev.id} style={{ padding: '15px', borderRadius: '8px', border: `1px solid ${ev.color || '#cbd5e1'}`, borderRight: `5px solid ${ev.color || 'var(--primary-color)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0 }}>{ev.title} <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 'normal' }}>{ev.type}</span></h4>
                    <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748b' }}>{dateStr} {ev.subtitle ? `| ${ev.subtitle}` : ''}</p>
                  </div>
                  <button onClick={() => handleDeleteEvent(ev.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>מחק</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
