'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, CheckCircle, Calendar, Eye, EyeOff, Activity, MessageSquare, Frown, Meh, Smile } from 'lucide-react';
import styles from './goals.module.css';
import { useToast } from '@/components/ToastProvider';
import AppDate from '@/components/AppDate';
import GoalReminderModal from '@/components/GoalReminderModal';

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', targetDateType: 'weekly', reminderFrequency: 'weekly', isPrivate: false });
  const [updatingGoal, setUpdatingGoal] = useState(null);
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
                {goal.isPrivate ? <EyeOff size={20} color="#64748b" title="פרטי - רק אתה יכול לראות יעד זה" /> : <Eye size={20} color="#16a34a" title="גלוי - משותף עם הצוות" />}
              </div>
              <div className={styles.goalMeta}>
                <span className={styles.metaBadge}><Calendar size={14} /> {targetDateOptions.find(o => o.value === goal.targetDateType)?.label}</span>
                <span className={styles.metaBadge}><CheckCircle size={14} /> {frequencyOptions.find(o => o.value === goal.reminderFrequency)?.label}</span>
              </div>
              
              {goal.updates && goal.updates.length > 0 ? (
                <div style={{ marginTop: '15px', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px', fontWeight: 'bold' }}>היסטוריית עדכונים:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '150px', overflowY: 'auto', paddingRight: '5px' }}>
                    {goal.updates.map(update => (
                      <div key={update.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {update.rating === 1 ? <Frown size={24} color="#ef4444" /> : update.rating === 2 ? <Meh size={24} color="#f59e0b" /> : update.rating === 3 ? <Smile size={24} color="#22c55e" /> : '⚪'}
                        </div>
                        <div style={{ flex: 1, fontSize: '14px', color: '#334155' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}><AppDate date={update.createdAt} /></div>
                          <div>{update.reflection || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>ללא מלל</span>}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ fontStyle: 'italic', color: '#94a3b8', textAlign: 'center', marginTop: '15px', padding: '10px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  טרם עודכן. לחץ למטה כדי לעדכן התקדמות!
                </div>
              )}
              
              <button 
                onClick={() => setUpdatingGoal(goal)}
                style={{ width: '100%', marginTop: '15px', padding: '12px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Activity size={18} /> איך הולך?
              </button>
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

            <div 
              onClick={() => setNewGoal({...newGoal, isPrivate: !newGoal.isPrivate})}
              style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '20px', cursor: 'pointer', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            >
              <div style={{ padding: '10px', borderRadius: '50%', background: newGoal.isPrivate ? '#f1f5f9' : '#dcfce7', color: newGoal.isPrivate ? '#64748b' : '#16a34a' }}>
                {newGoal.isPrivate ? <EyeOff size={36} /> : <Eye size={36} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: '#334155' }}>{newGoal.isPrivate ? 'יעד פרטי' : 'יעד גלוי לצפייה'}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{newGoal.isPrivate ? 'רק אני אראה את היעד והעדכונים, לא יוצג לאנשי הצוות.' : 'היעד ישותף עם הצוות כדי שיוכלו לעזור לי בדרך.'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button className={styles.submitBtn} onClick={handleAddGoal}>צור יעד</button>
              <button className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>ביטול</button>
            </div>
          </div>
        </div>
      )}
      {updatingGoal && (
        <GoalReminderModal 
          manualGoal={updatingGoal} 
          onClose={() => { setUpdatingGoal(null); fetchGoals(); }} 
        />
      )}
    </div>
  );
}
