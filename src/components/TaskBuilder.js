'use client';
/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from 'react';
import styles from '@/app/staff/staff.module.css';
import { Plus, Trash, Image as ImageIcon, Video, Mic, Upload, FileText, CheckSquare, AlignLeft } from 'lucide-react';

export default function TaskBuilder({ onTaskCreated }) {
  const [taskType, setTaskType] = useState('short_message');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [checklistItems, setChecklistItems] = useState([{ text: '', required: true }]);
  const [mediaUrls, setMediaUrls] = useState([]);
  const [requireCompletion, setRequireCompletion] = useState(true);
  const [timerDeadline, setTimerDeadline] = useState('');
  const [dateMode, setDateMode] = useState('gregorian');
  const [linkedEventId, setLinkedEventId] = useState('');
  const [relativeDaysToEvent, setRelativeDaysToEvent] = useState(0);
  const [events, setEvents] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    fetch('/api/staff/events').then(r => r.json()).then(data => setEvents(Array.isArray(data) ? data : [])).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return;
    setIsSubmitting(true);
    setStatusMsg('שומר...');
    
    const taskData = {
      title,
      type: taskType,
      content,
      requireCompletion,
      dateMode
    };

    if (taskType === 'checklist') {
      taskData.checklistItems = checklistItems.filter(i => i.text && i.text.trim() !== '');
    }
    if (timerDeadline) {
      taskData.timerDeadline = new Date(timerDeadline).toISOString();
    }
    if (mediaUrls.length > 0) {
      taskData.mediaUrls = mediaUrls;
    }
    if (linkedEventId) {
      taskData.linkedEventId = linkedEventId;
      taskData.relativeDaysToEvent = Number(relativeDaysToEvent);
    }

    try {
      const res = await fetch('/api/staff/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      if (res.ok) {
        setStatusMsg('המשימה נוצרה בהצלחה!');
        setTimeout(() => setStatusMsg(''), 3000);
        if (onTaskCreated) onTaskCreated();
        setTitle('');
        setContent('');
        setChecklistItems([{ text: '', required: true }]);
        setMediaUrls([]);
        setTimerDeadline('');
      } else {
        const data = await res.json();
        setStatusMsg('שגיאה: ' + (data.error || 'תקלה לא ידועה'));
      }
    } catch (error) {
      console.error(error);
      setStatusMsg('שגיאה בשמירת המשימה');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.card} style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px' }}>יצירת משימה חדשה</h3>
      {statusMsg && (
        <div style={{ marginBottom: '15px', padding: '10px', background: statusMsg.includes('שגיאה') ? '#fee2e2' : '#d1fae5', color: statusMsg.includes('שגיאה') ? '#ef4444' : '#059669', borderRadius: '8px', textAlign: 'center' }}>
          {statusMsg}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setTaskType('short_message')} 
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: taskType === 'short_message' ? '#e0f2fe' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
        >
          <FileText size={18} /> הודעה קצרה
        </button>
        <button 
          onClick={() => setTaskType('long_message')} 
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: taskType === 'long_message' ? '#e0f2fe' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
        >
          <AlignLeft size={18} /> הודעה ארוכה
        </button>
        <button 
          onClick={() => setTaskType('checklist')} 
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: taskType === 'checklist' ? '#e0f2fe' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
        >
          <CheckSquare size={18} /> צ'ק ליסט
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="כותרת המשימה" 
          required 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px' }}
        />
        
        <textarea 
          placeholder="תוכן המשימה (אופציונלי)" 
          rows="4"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', fontFamily: 'inherit' }}
        />

        {taskType === 'checklist' && (
          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ marginBottom: '10px' }}>פריטי הצ'ק ליסט (אנטר להוספת שורה, הדבק רשימה לפיצול)</h4>
            {checklistItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  id={`checklist-item-${idx}`}
                  placeholder={`פריט ${idx + 1}`}
                  value={item.text}
                  onChange={(e) => {
                    const newItems = [...checklistItems];
                    newItems[idx].text = e.target.value;
                    setChecklistItems(newItems);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const newItems = [...checklistItems];
                      newItems.splice(idx + 1, 0, { text: '', required: true });
                      setChecklistItems(newItems);
                      setTimeout(() => document.getElementById(`checklist-item-${idx + 1}`)?.focus(), 0);
                    }
                  }}
                  onPaste={(e) => {
                    const pasteData = e.clipboardData.getData('Text');
                    if (pasteData.includes('\n')) {
                      e.preventDefault();
                      const lines = pasteData.split('\n').map(l => l.trim()).filter(l => l);
                      const newItems = [...checklistItems];
                      newItems[idx].text = lines[0];
                      const newEntries = lines.slice(1).map(l => ({ text: l, required: true }));
                      newItems.splice(idx + 1, 0, ...newEntries);
                      setChecklistItems(newItems);
                    }
                  }}
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={item.required}
                    onChange={(e) => {
                      const newItems = [...checklistItems];
                      newItems[idx].required = e.target.checked;
                      setChecklistItems(newItems);
                    }}
                  />
                  חובה
                </label>
                <button type="button" onClick={() => {
                  const newItems = checklistItems.filter((_, i) => i !== idx);
                  setChecklistItems(newItems.length ? newItems : [{ text: '', required: true }]);
                }} style={{ padding: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Trash size={16}/></button>
              </div>
            ))}
            <button type="button" onClick={() => setChecklistItems([...checklistItems, { text: '', required: true }])} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#475569' }}>
              <Plus size={16} /> הוסף פריט
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input type="checkbox" checked={requireCompletion} onChange={(e) => setRequireCompletion(e.target.checked)} />
            דורש אישור ביצוע מאת התלמיד
          </label>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>תאריך יעד (טיימר נעילה):</label>
          <input 
            type="datetime-local" 
            value={timerDeadline}
            onChange={(e) => setTimerDeadline(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#475569' }}>תזמון יחסית לאירוע (אופציונלי)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '5px' }}>בחר אירוע מלוח השנה</label>
              <select value={linkedEventId} onChange={e => setLinkedEventId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <option value="">ללא קישור לאירוע</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title} ({new Date(ev.scheduledDate).toLocaleDateString('he-IL')})</option>)}
              </select>
            </div>
            {linkedEventId && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '5px' }}>תזמון ביחס לאירוע</label>
                <select value={relativeDaysToEvent} onChange={e => setRelativeDaysToEvent(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <option value={0}>ביום האירוע</option>
                  <option value={-1}>יום לפני</option>
                  <option value={-2}>יומיים לפני</option>
                  <option value={-3}>3 ימים לפני</option>
                  <option value={-7}>שבוע לפני</option>
                  <option value={1}>יום אחרי</option>
                  <option value={2}>יומיים אחרי</option>
                  <option value={7}>שבוע אחרי</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} style={{ padding: '12px', borderRadius: '8px', background: 'var(--primary-color)', color: 'white', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '10px' }}>
          {isSubmitting ? 'יוצר משימה...' : 'שלח לתלמידים'}
        </button>
      </form>
    </div>
  );
}
