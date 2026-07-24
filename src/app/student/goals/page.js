'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, CheckCircle, Calendar, Lock } from 'lucide-react';
import styles from './goals.module.css';
import { useToast } from '@/components/ToastProvider';
import AppDate from '@/components/AppDate';

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', targetDateType: 'weekly', reminderFrequency: 'weekly', isPrivate: false });
  const toast = useToast();

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/student/goals');
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.title.trim()) {
      toast.show('יש להזין כותרת ליעד', 'error');
      return;
    }

    try {
      const res = await fetch('/api/student/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal)
      });
      if (res.ok) {
        toast.show('היעד נוצר בהצלחה!', 'success');
        setShowAddModal(false);
        setNewGoal({ title: '', targetDateType: 'weekly', reminderFrequency: 'weekly', isPrivate: false });
        fetchGoals();
      } else {
        toast.show('שגיאה ביצירת היעד', 'error');
      }
    } catch (e) {
      console.error(e);
      toast.show('שגיאה ביצירת היעד', 'error');
    }
  };

  const targetDateOptions = [
    { value: 'weekly', label: 'שבועי' },
    { value: 'monthly', label: 'חודשי' },
    { value: 'trimester', label: 'טרימסטר' },
    { value: 'semester', label: 'מחצית' },
    { value: 'yearly', label: 'שנתי' },
    { value: 'two_years', label: 'שנתיים' },
    { value: 'lifetime', label: 'לחיים' }
  ];

  const frequencyOptions = [
    { value: 'daily', label: 'תזכורת יומית' },
    { value: 'weekly', label: 'תזכורת שבועית' },
    { value: 'monthly', label: 'תזכורת חודשית' }
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Target size={28} color="var(--primary-color)" />
          <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--primary-color)' }}>היעדים שלי</h1>
        </div>
        <p style={{ margin: '10px 0 0 0', color: '#64748b' }}>ניהול התהליך האישי והצבת מטרות להתפתחות</p>
      </header>

      <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
        <Plus size={20} /> הוסף יעד אישי חדש
      </button>

      <div className={styles.goalsList}>
        {isLoading ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>טוען יעדים...</p>
        ) : goals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <Target size={48} color="#cbd5e1" style={{ marginBottom: '15px' }} />
            <h3 style={{ margin: '0 0 10px 0', color: '#475569' }}>אין לך יעדים פעילים</h3>
            <p style={{ margin: 0, color: '#64748b' }}>לחץ על הכפתור למעלה כדי להציב את היעד הראשון שלך!</p>
          </div>
        ) : (
          goals.map(goal => (
            <div key={goal.id} className={styles.goalCard}>
              <div className={styles.goalHeader}>
                <h3 className={styles.goalTitle}>{goal.title}</h3>
                {goal.isPrivate && <Lock size={16} color="#64748b" title="פרטי - רק אתה יכול לראות יעד זה" />}
              </div>
              <div className={styles.goalMeta}>
                <span className={styles.metaBadge}><Calendar size={14} /> {targetDateOptions.find(o => o.value === goal.targetDateType)?.label}</span>
                <span className={styles.metaBadge}><CheckCircle size={14} /> {frequencyOptions.find(o => o.value === goal.reminderFrequency)?.label}</span>
              </div>
              
              {goal.updates && goal.updates.length > 0 ? (
                <div className={styles.lastUpdateBox}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>עדכון אחרון (<AppDate date={goal.updates[0].createdAt} />):</div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div className={styles.ratingCircle} style={{ background: getRatingColor(goal.updates[0].rating) }}>
                      {goal.updates[0].rating}
                    </div>
                    <div style={{ flex: 1, fontSize: '14px', color: '#334155' }}>
                      {goal.updates[0].reflection || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>ללא מילים</span>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.lastUpdateBox} style={{ fontStyle: 'italic', color: '#94a3b8', textAlign: 'center' }}>
                  טרם עודכן. תזכורת תופיע במועד הקרוב!
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, color: 'var(--primary-color)' }}>יעד חדש</h2>
            
            <label className={styles.label}>
              במה אני רוצה להתפתח? (הגדרת היעד)
              <input 
                type="text" 
                className={styles.input} 
                value={newGoal.title} 
                onChange={e => setNewGoal({...newGoal, title: e.target.value})} 
                placeholder="לדוגמה: להקפיד על לימוד יומי, לשמור על כושר..."
              />
            </label>

            <label className={styles.label}>
              למתי היעד הזה?
              <select className={styles.select} value={newGoal.targetDateType} onChange={e => setNewGoal({...newGoal, targetDateType: e.target.value})}>
                {targetDateOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </label>

            <label className={styles.label}>
              כל כמה זמן להזכיר לי לשאול את עצמי "איך הולך?"
              <select className={styles.select} value={newGoal.reminderFrequency} onChange={e => setNewGoal({...newGoal, reminderFrequency: e.target.value})}>
                {frequencyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', cursor: 'pointer', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <input 
                type="checkbox" 
                checked={newGoal.isPrivate} 
                onChange={e => setNewGoal({...newGoal, isPrivate: e.target.checked})} 
                style={{ width: '18px', height: '18px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: '#334155' }}>הפוך לפרטי (מוצפן)</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>רק אני אראה את היעד והעדכונים, לא יוצג לאנשי הצוות.</div>
              </div>
            </label>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button className={styles.submitBtn} onClick={handleAddGoal}>צור יעד</button>
              <button className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getRatingColor(rating) {
  if (rating === 1) return '#ef4444';
  if (rating === 2) return '#f97316';
  if (rating === 3) return '#eab308';
  if (rating === 4) return '#84cc16';
  if (rating === 5) return '#22c55e';
  return '#cbd5e1';
}
