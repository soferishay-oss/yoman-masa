'use client';
/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from 'react';
import styles from '@/app/staff/staff.module.css';
import { ChevronDown, ChevronUp, CheckCircle, Clock, Circle, FileText } from 'lucide-react';

export default function TaskTracker() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/staff/tasks/tracking');
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        }
      } catch (error) {
        console.error('Failed to fetch tracking data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק משימה זו? (כל נתוני התלמידים במשימה יימחקו)')) return;
    try {
      const res = await fetch(`/api/staff/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      console.error(err);
      alert('שגיאה במחיקת המשימה');
    }
  };

  const handleArchiveTask = async (taskId, archiveType) => {
    try {
      const res = await fetch(`/api/staff/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true, archiveType })
      });
      if (res.ok) fetchTasks(); // Refresh to reflect archive status
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async (taskId) => {
    try {
      const res = await fetch(`/api/staff/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle })
      });
      if (res.ok) {
        setEditingTask(null);
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <p>טוען משימות...</p>;
  if (tasks.length === 0) return <p>לא נוצרו משימות עדיין.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {tasks.map(task => {
        const total = task.assignments.length;
        const completed = task.assignments.filter(a => a.status === 'completed').length;
        const opened = task.assignments.filter(a => a.status === 'opened').length;
        const assigned = task.assignments.filter(a => a.status === 'assigned').length;
        const isExpanded = expandedTaskId === task.id;

        return (
          <div key={task.id} style={{ background: 'white', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            <div 
              onClick={() => { if (!editingTask) setExpandedTaskId(isExpanded ? null : task.id) }}
              style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: editingTask ? 'default' : 'pointer', background: isExpanded ? '#f8fafc' : 'white' }}
            >
              <div style={{flex: 1}}>
                {editingTask === task.id ? (
                  <div style={{display: 'flex', gap: '10px', alignItems: 'center'}} onClick={e => e.stopPropagation()}>
                    <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1'}} />
                    <button onClick={() => handleSaveEdit(task.id)} style={{background: '#22c55e', color: 'white', padding: '5px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer'}}>שמור</button>
                    <button onClick={() => setEditingTask(null)} style={{background: '#ef4444', color: 'white', padding: '5px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer'}}>ביטול</button>
                  </div>
                ) : (
                  <>
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={18} color="var(--primary-color)"/> 
                      {task.title}
                      {task.isArchived && <span style={{fontSize: '11px', background: '#e2e8f0', color: '#64748b', padding: '2px 6px', borderRadius: '12px'}}>בארכיון ({task.archiveType === 'public' ? 'ציבורי' : 'פרטי'})</span>}
                    </h4>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '5px', display: 'flex', gap: '15px' }}>
                      <span>סה"כ: {total}</span>
                      <span style={{ color: '#22c55e' }}>סיימו: {completed}</span>
                      <span style={{ color: '#f59e0b' }}>באמצע: {opened}</span>
                      <span style={{ color: '#ef4444' }}>לא פתחו: {assigned}</span>
                    </div>
                  </>
                )}
              </div>
              {!editingTask && (
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}} onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setEditTitle(task.title); setEditingTask(task.id); }} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '12px', textDecoration: 'underline'}}>ערוך</button>
                  {!task.isArchived && (
                    <div style={{position: 'relative', display: 'inline-block'}}>
                      <button onClick={(e) => { e.currentTarget.nextSibling.style.display = e.currentTarget.nextSibling.style.display === 'block' ? 'none' : 'block'; }} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '12px', textDecoration: 'underline'}}>ארכיון</button>
                      <div style={{display: 'none', position: 'absolute', top: '100%', right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '5px', zIndex: 10, minWidth: '100px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}>
                        <button onClick={() => handleArchiveTask(task.id, 'private')} style={{display: 'block', width: '100%', padding: '5px', background: 'none', border: 'none', textAlign: 'right', cursor: 'pointer', fontSize: '12px'}}>ארכיון פרטי</button>
                        <button onClick={() => handleArchiveTask(task.id, 'public')} style={{display: 'block', width: '100%', padding: '5px', background: 'none', border: 'none', textAlign: 'right', cursor: 'pointer', fontSize: '12px'}}>ארכיון ציבורי (לכולם)</button>
                      </div>
                    </div>
                  )}
                  <button onClick={() => handleDeleteTask(task.id)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '12px', textDecoration: 'underline'}}>מחק</button>
                  <div style={{cursor: 'pointer'}} onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}>
                    {isExpanded ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
                  </div>
                </div>
              )}
            </div>


            
            {isExpanded && (
              <div style={{ padding: '15px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <h5 style={{ marginBottom: '10px', color: '#475569' }}>פירוט תלמידים:</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {task.assignments.map(assignment => {
                    const studentName = assignment.user.fullName;
                    
                    let statusIcon = <Circle size={16} color="#ef4444" />;
                    let statusText = 'לא נפתח';
                    if (assignment.status === 'completed') {
                      statusIcon = <CheckCircle size={16} color="#22c55e" />;
                      statusText = 'הושלם';
                    } else if (assignment.status === 'opened') {
                      statusIcon = <Clock size={16} color="#f59e0b" />;
                      statusText = 'באמצע';
                    }

                    return (
                      <div key={assignment.id} style={{ background: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {statusIcon}
                          <strong>{studentName}</strong>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{statusText}</span>
                        </div>
                        {task.type === 'checklist' && assignment.checklistState && (
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            סומנו {Object.values(assignment.checklistState).filter(Boolean).length} / {task.checklistItems?.length || 0} פריטים
                          </div>
                        )}
                        {assignment.updatedAt && (
                          <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                            עודכן: {new Date(assignment.updatedAt).toLocaleString('he-IL')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
