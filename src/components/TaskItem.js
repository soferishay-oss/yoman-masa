'use client';
import { useState } from 'react';
import { Star, ChevronDown, ChevronUp, Check } from 'lucide-react';
import styles from '@/app/page.module.css';

export default function TaskItem({ assignment, onComplete, onProgress }) {
  const [expanded, setExpanded] = useState(false);
  const task = assignment.task;
  const isChecklist = task.type === 'checklist';
  
  // checklistState is an object mapping item index (or value) to boolean
  const [checklistState, setChecklistState] = useState(assignment.checklistState || {});

  const toggleChecklist = (index) => {
    const newState = { ...checklistState, [index]: !checklistState[index] };
    setChecklistState(newState);
    onProgress(assignment.id, newState, 'opened');
  };

  const allChecked = isChecklist && task.checklistItems?.length > 0 && 
    task.checklistItems.every((_, i) => checklistState[i]);
  const hasSomeChecked = isChecklist && Object.values(checklistState).some(v => v);

  const handleComplete = () => {
    if (isChecklist && !allChecked) {
      if (!window.confirm('המשימה לא הושלמה במלואה, האם לשלוח בכל זאת?')) {
        return;
      }
    } else {
      if (!window.confirm('האם סיימת את המשימה?')) {
        return;
      }
    }
    onComplete(assignment.id, checklistState);
  };

  // Determine status text
  let statusText = 'לביצוע';
  let statusClass = styles.tagOpen;
  if (assignment.status === 'opened' || (isChecklist && hasSomeChecked)) {
    statusText = 'באמצע';
    statusClass = styles.tagInProgress || styles.tagOpen;
  }

  return (
    <div className={styles.activityCard} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div 
        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', width: '100%' }}
        onClick={() => {
          setExpanded(!expanded);
          if (assignment.status === 'assigned' && !expanded) {
             onProgress(assignment.id, checklistState, 'opened');
          }
        }}
      >
        <div className={`${styles.iconWrapper} ${styles.bgOrange}`}>
           <Star size={24} color="var(--primary-color)" />
        </div>
        <div className={styles.activityContent} style={{ flex: 1, marginRight: '15px' }}>
          <h3>{task.title}</h3>
          {!expanded && <p>{task.content ? task.content.substring(0, 40) + '...' : ''}</p>}
        </div>
        <span className={`${styles.statusTag} ${statusClass}`}>{statusText}</span>
        {expanded ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
      </div>

      {expanded && (
        <div style={{ marginTop: '15px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
          {task.content && <p style={{ marginBottom: '15px', whiteSpace: 'pre-wrap' }}>{task.content}</p>}
          
          {task.mediaUrls && task.mediaUrls.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
              {task.mediaUrls.map((media, idx) => (
                media.type === 'image' ? 
                  <img key={idx} src={media.url} alt="Media" style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px'}} /> :
                media.type === 'video' ? 
                  <video key={idx} src={media.url} controls style={{width: '100%', maxWidth: '200px', borderRadius: '8px'}} /> :
                media.type === 'audio' ? 
                  <audio key={idx} src={media.url} controls style={{width: '100%'}} /> : null
              ))}
            </div>
          )}

          {isChecklist && task.checklistItems && (
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {task.checklistItems.map((item, idx) => (
                <label key={idx} onClick={(e) => { e.preventDefault(); toggleChecklist(idx); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                  <div style={{ 
                    width: '24px', height: '24px', borderRadius: '4px', border: '2px solid var(--primary-color)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: checklistState[idx] ? 'var(--primary-color)' : 'transparent'
                  }}>
                    {checklistState[idx] && <Check size={16} color="white" />}
                  </div>
                  <span style={{ textDecoration: checklistState[idx] ? 'line-through' : 'none', color: checklistState[idx] ? '#94a3b8' : 'inherit' }}>
                    {item}
                  </span>
                </label>
              ))}
            </div>
          )}

          {task.requireCompletion && (
            <button 
              onClick={handleComplete}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                background: (isChecklist && !allChecked) ? '#cbd5e1' : 'var(--primary-color)',
                color: (isChecklist && !allChecked) ? '#475569' : 'white',
                fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              בוצע
            </button>
          )}
        </div>
      )}
    </div>
  );
}
