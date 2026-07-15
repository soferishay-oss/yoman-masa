'use client';
import { useState, useEffect } from 'react';
import styles from '@/app/staff/staff.module.css';
import { ChevronDown, ChevronUp, CheckCircle, Clock, Circle, FileText } from 'lucide-react';

export default function TaskTracker() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

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
              onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
              style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? '#f8fafc' : 'white' }}
            >
              <div>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="var(--primary-color)"/> {task.title}
                </h4>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '5px', display: 'flex', gap: '15px' }}>
                  <span>סה"כ: {total}</span>
                  <span style={{ color: '#22c55e' }}>סיימו: {completed}</span>
                  <span style={{ color: '#f59e0b' }}>באמצע: {opened}</span>
                  <span style={{ color: '#ef4444' }}>לא פתחו: {assigned}</span>
                </div>
              </div>
              {isExpanded ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
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
