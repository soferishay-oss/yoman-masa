'use client';
import { useState, useEffect } from 'react';
import { X, Calendar, Flag } from 'lucide-react';
import TaskItem from '@/components/TaskItem';
import { useToast } from '@/components/ToastProvider';

export default function EventDetailsModal({ event, onClose }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (!event) return;
    const fetchTasks = async () => {
      try {
        const res = await fetch(`/api/student/events/${event.id}/tasks`);
        if (res.ok) {
          setTasks(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch event tasks:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [event]);

  if (!event) return null;

  const eventDate = new Date(event.scheduledDate);
  const dateStr = eventDate.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px',
        maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div style={{
          background: event.color || 'var(--primary-color)', color: 'white',
          padding: '20px', borderRadius: '16px 16px 0 0', position: 'relative'
        }}>
          <button 
            onClick={onClose}
            style={{
              position: 'absolute', top: '15px', left: '15px', background: 'rgba(255,255,255,0.2)',
              border: 'none', borderRadius: '50%', width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '50%' }}>
              <Flag size={24} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px' }}>{event.title}</h2>
              {event.subtitle && <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '14px' }}>{event.subtitle}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.9, fontSize: '14px' }}>
            <Calendar size={16} />
            <span>{dateStr}</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {event.description && (
            <div style={{ marginBottom: '20px', color: '#475569', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {event.description}
            </div>
          )}

          <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
            משימות הקשורות לאירוע
          </h3>

          {isLoading ? (
            <p style={{ textAlign: 'center', color: '#64748b' }}>טוען משימות...</p>
          ) : tasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {tasks.map(assignment => {
                const relativeDays = assignment.task.relativeDaysToEvent;
                let timingText = '';
                if (relativeDays !== null && relativeDays !== undefined) {
                  if (relativeDays < 0) timingText = `${Math.abs(relativeDays)} ימים לפני האירוע`;
                  else if (relativeDays === 0) timingText = `ביום האירוע`;
                  else timingText = `${relativeDays} ימים אחרי האירוע`;
                }

                return (
                  <div key={assignment.id} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {timingText && (
                      <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold', paddingRight: '10px' }}>
                        תזמון ביצוע: {timingText}
                      </div>
                    )}
                    <TaskItem 
                      assignment={assignment} 
                      onComplete={async (assignmentId, checklistState) => {
                    const res = await fetch('/api/student/tasks', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ assignmentId, status: 'completed', checklistState })
                    });
                    if(res.ok) {
                      if (toast?.show) toast.show('כל הכבוד! המשימה הושלמה.', 'success');
                      setTasks(tasks.map(t => t.id === assignmentId ? { ...t, status: 'completed', checklistState } : t));
                    }
                  }}
                  onProgress={async (assignmentId, checklistState, status) => {
                    await fetch('/api/student/tasks', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ assignmentId, status, checklistState })
                    });
                    setTasks(tasks.map(t => t.id === assignmentId ? { ...t, status, checklistState } : t));
                  }}
                />
              </div>
              )})}
            </div>
          ) : (
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', textAlign: 'center', color: '#64748b' }}>
              אין משימות משויכות לאירוע זה.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
