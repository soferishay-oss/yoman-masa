import React, { useState, useEffect } from 'react';
import styles from './moodModal.module.css';
import { Send } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export default function MoodSurveyModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodExplanation, setMoodExplanation] = useState('');
  const [showMoodOptions, setShowMoodOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [weekId, setWeekId] = useState('');
  
  const toast = useToast();

  useEffect(() => {
    // Generate a unique week identifier (Year-WeekNumber)
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    const currentWeekId = `${d.getUTCFullYear()}-W${weekNo}`;
    setWeekId(currentWeekId);

    async function checkStatus() {
      // Check if user clicked "remind me later" during this session/week
      const postponed = sessionStorage.getItem(`moodSurveyPostponed_${currentWeekId}`);
      if (postponed) return;

      try {
        const res = await fetch('/api/student/mood/status');
        if (res.ok) {
          const data = await res.json();
          if (data.shouldShow) {
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.error('Failed to check mood status', err);
      }
    }

    checkStatus();
  }, []);

  const handlePostpone = () => {
    sessionStorage.setItem(`moodSurveyPostponed_${weekId}`, 'true');
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    if (!selectedMood) return;
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/student/mood', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ ratingValue: selectedMood, explanation: moodExplanation || 'דיווח מהאפליקציה' })
      });
      if (res.ok) {
        if (toast?.show) toast.show('נשמר בהצלחה, תודה על השיתוף!', 'success');
        setIsOpen(false);
      } else {
        if (toast?.show) toast.show('שגיאה בעדכון מצב רוח', 'error');
      }
    } catch (err) {
      if (toast?.show) toast.show('שגיאה בתקשורת', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header} style={{ justifyContent: 'center' }}>
          <h2>איך המרגש היום?</h2>
        </div>

        <div className={styles.content}>
          {!showMoodOptions ? (
            <>
              <p className={styles.subtitle}>נשמח לדעת מה שלומך.</p>
              <div className={styles.emojiContainer}>
                {[
                  { val: 1, emoji: '😞' },
                  { val: 2, emoji: '😕' },
                  { val: 3, emoji: '😐' },
                  { val: 4, emoji: '🙂' },
                  { val: 5, emoji: '🤩' },
                ].map(item => (
                  <div 
                    key={item.val}
                    className={`${styles.emojiBtn} ${selectedMood === item.val ? styles.selected : ''}`}
                    onClick={() => {
                      setSelectedMood(item.val);
                      setShowMoodOptions(true);
                    }}
                  >
                    {item.emoji}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.detailsContainer}>
              <div className={styles.selectedEmoji}>
                { [null, '😞', '😕', '😐', '🙂', '🤩'][selectedMood] }
              </div>
              <textarea
                className={styles.textarea}
                placeholder="רוצה לשתף קצת יותר? (לא חובה)"
                value={moodExplanation}
                onChange={e => setMoodExplanation(e.target.value)}
              />
              <div className={styles.actions}>
                <button 
                  type="button" 
                  className={styles.switchBtn}
                  onClick={() => {
                    setShowMoodOptions(false);
                    setSelectedMood(null);
                    setMoodExplanation('');
                  }} 
                >
                  החלף רגש
                </button>
                <button 
                  type="button" 
                  className={styles.submitBtn}
                  onClick={handleSubmit} 
                  disabled={isLoading}
                >
                  {isLoading ? 'שומר...' : <Send size={20} />}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {!showMoodOptions && (
          <div className={styles.footer}>
            <button className={styles.postponeBtn} onClick={handlePostpone}>
              תזכיר לי מאוחר יותר
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
