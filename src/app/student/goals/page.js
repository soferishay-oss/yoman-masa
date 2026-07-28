'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, CheckCircle, Calendar, Eye, EyeOff, Activity, MessageSquare, Frown, Meh, Smile, Edit2, Star } from 'lucide-react';
import styles from './goals.module.css';
import { useToast } from '@/components/ToastProvider';
import AppDate from '@/components/AppDate';
import GoalReminderModal from '@/components/GoalReminderModal';

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', targetDateType: 'weekly', reminderFrequency: 'weekly', isPrivate: false, isVault: false });
  const [updatingGoal, setUpdatingGoal] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
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
        
        // Check if we came from Journal with intent to edit
        const params = new URLSearchParams(window.location.search);
        const editGoalId = params.get('editGoal');
        if (editGoalId) {
          const goalToEdit = data.find(g => g.id === editGoalId);
          if (goalToEdit) {
            setEditingGoal(goalToEdit);
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
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
        setNewGoal({ title: '', targetDateType: 'weekly', reminderFrequency: 'weekly', isPrivate: false, isVault: false });
        fetchGoals();
      } else {
        toast.show('שגיאה ביצירת היעד', 'error');
      }
    } catch (e) {
      console.error(e);
      toast.show('שגיאה ביצירת היעד', 'error');
    }
  };

  const handleTogglePrivacy = async (goal) => {
    try {
      const res = await fetch(`/api/student/goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrivate: !goal.isPrivate })
      });
      if (res.ok) {
        toast.show('הגדרות פרטיות עודכנו', 'success');
        fetchGoals();
      } else {
        toast.show('שגיאה בעדכון פרטיות', 'error');
      }
    } catch (e) {
      console.error(e);
      toast.show('שגיאה בעדכון פרטיות', 'error');
    }
  };

  const handleToggleVault = async (goal) => {
    try {
      const res = await fetch(`/api/student/goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVault: !goal.isVault })
      });
      if (res.ok) {
        toast.show(!goal.isVault ? 'נשמר בכספת' : 'הוסר מהכספת', 'success');
        fetchGoals();
      } else {
        toast.show('שגיאה בעדכון כספת', 'error');
      }
    } catch (e) {
      console.error(e);
      toast.show('שגיאה בעדכון כספת', 'error');
    }
  };

  const handleUpdateGoalInfo = async () => {
    if (!editingGoal.title.trim()) {
      toast.show('יש להזין שם יעד', 'error');
      return;
    }
    
    try {
      const res = await fetch(`/api/student/goals/${editingGoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: editingGoal.title.trim(),
          reminderFrequency: editingGoal.reminderFrequency
        })
      });
      if (res.ok) {
        toast.show('היעד עודכן בהצלחה', 'success');
        setEditingGoal(null);
        fetchGoals();
      } else {
        toast.show('שגיאה בעדכון היעד', 'error');
      }
    } catch (e) {
      console.error(e);
      toast.show('שגיאה בעדכון היעד', 'error');
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button 
                    onClick={() => setEditingGoal(goal)} 
                    style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="ערוך שם יעד"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleToggleVault(goal)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                  >
                    <Star size={20} fill={goal.isVault ? '#f59e0b' : 'none'} color={goal.isVault ? '#f59e0b' : '#94a3b8'} title="שמור בכספת (דברים שרציתי לשמור)" />
                  </button>
                  <button
                    onClick={() => handleTogglePrivacy(goal)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                  >
                    {goal.isPrivate ? <EyeOff size={20} color="#64748b" title="פרטי - רק אתה יכול לראות יעד זה (לחץ לשינוי)" /> : <Eye size={20} color="#16a34a" title="גלוי - משותף עם הצוות (לחץ לשינוי)" />}
                  </button>
                </div>
              </div>
              <div className={styles.goalMeta}>
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
                style={{ width: '100%', marginTop: '15px', padding: '12px', background: '#f8fafc', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
              >
                <Activity size={18} /> איך הולך עם זה?
              </button>
            </div>
          ))
        )}
      </div>

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div className={styles.modalOverlay} onClick={() => setEditingGoal(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, color: 'var(--primary-color)' }}>עריכת יעד</h2>
            
            <label className={styles.label}>
              במה אני רוצה להתפתח? (הגדרת היעד)
              <input 
                type="text" 
                className={styles.input} 
                value={editingGoal.title} 
                onChange={e => setEditingGoal({...editingGoal, title: e.target.value})} 
                placeholder="לדוגמה: ללמוד גיטרה 3 פעמים בשבוע..."
              />
            </label>

            <label className={styles.label}>
              כל כמה זמן להזכיר לי לשאול את עצמי "איך הולך עם זה?"
              <select className={styles.select} value={editingGoal.reminderFrequency} onChange={e => setEditingGoal({...editingGoal, reminderFrequency: e.target.value})}>
                {frequencyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </label>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button className={styles.submitBtn} onClick={handleUpdateGoalInfo}>שמור שינויים</button>
              <button className={styles.cancelBtn} onClick={() => setEditingGoal(null)}>ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
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
              כל כמה זמן להזכיר לי לשאול את עצמי "איך הולך?"
              <select className={styles.select} value={newGoal.reminderFrequency} onChange={e => setNewGoal({...newGoal, reminderFrequency: e.target.value})}>
                {frequencyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </label>

            <div 
              onClick={() => setNewGoal({...newGoal, isPrivate: !newGoal.isPrivate})}
              style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '20px', cursor: 'pointer', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            >
              <div style={{ padding: '10px', borderRadius: '50%', background: newGoal.isPrivate ? '#f1f5f9' : '#dcfce7', color: newGoal.isPrivate ? '#64748b' : '#16a34a', transition: 'all 0.2s' }}>
                {newGoal.isPrivate ? <EyeOff size={36} /> : <Eye size={36} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: '#334155' }}>
                  {newGoal.isPrivate ? 'יעד פרטי' : 'יעד גלוי לצפייה'}
                  <span style={{ fontSize: '11px', color: '#3b82f6', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', marginRight: '8px' }}>לחץ כדי לשנות</span>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{newGoal.isPrivate ? 'רק אני אראה את היעד והעדכונים, לא יוצג לאנשי הצוות.' : 'היעד ישותף עם הצוות כדי שיוכלו לעזור לי בדרך.'}</div>
              </div>
            </div>

            <div 
              onClick={() => setNewGoal({...newGoal, isVault: !newGoal.isVault})}
              style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px', cursor: 'pointer', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            >
              <div style={{ padding: '10px', borderRadius: '50%', background: newGoal.isVault ? '#fef3c7' : '#f1f5f9', color: newGoal.isVault ? '#f59e0b' : '#94a3b8', transition: 'all 0.2s' }}>
                <Star size={36} fill={newGoal.isVault ? '#f59e0b' : 'none'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: '#334155' }}>
                  {newGoal.isVault ? 'שמור בכספת' : 'לא שמור בכספת'}
                  <span style={{ fontSize: '11px', color: '#3b82f6', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', marginRight: '8px' }}>לחץ כדי לשנות</span>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{newGoal.isVault ? 'היעד יופיע בתיקיית "דברים שרציתי לשמור".' : 'לחץ אם תרצה לשמור את היעד הזה בתיקייה המיוחדת שלך.'}</div>
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
