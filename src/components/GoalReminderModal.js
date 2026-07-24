'use client';

import { useState, useEffect } from 'react';
import { Target, X, MessageSquare, ChevronRight } from 'lucide-react';
import { useToast } from './ToastProvider';

export default function GoalReminderModal() {
  const [dueGoals, setDueGoals] = useState([]);
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  const [rating, setRating] = useState(0);
  const [reflection, setReflection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const toast = useToast();

  useEffect(() => {
    // Fetch if any reminders are due
    fetch('/api/student/goals/reminders')
      .then(res => res.json())
      .then(data => {
        if (data.dueGoals && data.dueGoals.length > 0) {
          setDueGoals(data.dueGoals);
          setIsOpen(true);
        }
      })
      .catch(err => console.error('Failed to check goal reminders:', err));
  }, []);

  if (!isOpen || dueGoals.length === 0) return null;

  const currentGoal = dueGoals[currentGoalIndex];
  const lastUpdate = currentGoal.updates && currentGoal.updates.length > 0 ? currentGoal.updates[0] : null;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.show('אנא בחר דירוג כדי להמשיך', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/student/goals/${currentGoal.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, reflection })
      });

      if (res.ok) {
        toast.show('העדכון נשמר בהצלחה, כל הכבוד!', 'success');
        
        // Move to next goal or close
        if (currentGoalIndex < dueGoals.length - 1) {
          setCurrentGoalIndex(currentGoalIndex + 1);
          setRating(0);
          setReflection('');
        } else {
          setIsOpen(false);
        }
      } else {
        toast.show('שגיאה בשמירת העדכון', 'error');
      }
    } catch (e) {
      toast.show('שגיאה בשמירת העדכון', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (currentGoalIndex < dueGoals.length - 1) {
      setCurrentGoalIndex(currentGoalIndex + 1);
      setRating(0);
      setReflection('');
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div style={{
        background: 'white', borderRadius: '24px', width: '100%', maxWidth: '400px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ background: 'var(--primary-color)', padding: '20px', color: 'white', position: 'relative', textAlign: 'center' }}>
          <button 
            onClick={handleSkip}
            style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', marginBottom: '10px' }}>
            <Target size={28} />
          </div>
          <h2 style={{ margin: 0, fontSize: '20px' }}>איך הולך עם זה?</h2>
        </div>

        {/* Content */}
        <div style={{ padding: '25px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* The Goal */}
          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '18px' }}>{currentGoal.title}</h3>
            {lastUpdate && lastUpdate.reflection && (
              <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                עדכון קודם: "{lastUpdate.reflection}"
              </div>
            )}
          </div>

          {/* Rating */}
          <div>
            <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '14px', color: '#475569', fontWeight: 'bold' }}>
              דרג את ההתקדמות שלך כרגע:
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}>
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  onClick={() => setRating(num)}
                  style={{
                    flex: 1, aspectRatio: '1', borderRadius: '12px', border: '2px solid',
                    borderColor: rating === num ? 'var(--primary-color)' : '#e2e8f0',
                    background: rating === num ? 'var(--primary-light)' : 'white',
                    color: rating === num ? 'var(--primary-color)' : '#64748b',
                    fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: rating === num ? '0 4px 10px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '5px', padding: '0 5px' }}>
              <span>עוד רחוק</span>
              <span>ממש ביעד!</span>
            </div>
          </div>

          {/* Text Reflection */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px', fontSize: '14px', color: '#475569', fontWeight: 'bold' }}>
              <MessageSquare size={16} /> רוצה לשתף קצת במילים?
            </div>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="כתוב כאן על ההתקדמות שלך..."
              style={{
                width: '100%', height: '80px', padding: '12px', borderRadius: '12px',
                border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '14px',
                resize: 'none', fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            style={{
              background: rating > 0 ? 'var(--primary-color)' : '#cbd5e1',
              color: 'white', border: 'none', padding: '16px', borderRadius: '12px',
              fontSize: '16px', fontWeight: 'bold', cursor: rating > 0 ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.3s'
            }}
          >
            {isSubmitting ? 'שומר...' : 'שמור עדכון'} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
