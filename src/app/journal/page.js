'use client';

import { useState, useEffect, useContext } from 'react';
import { Star, Trash2, Edit2, Eye, EyeOff } from 'lucide-react';
import { ThemeContext } from '@/components/ThemeProvider';
import AppDate from '@/components/AppDate';
import styles from './journal.module.css';
import { useToast } from '@/components/ToastProvider';
import { useRouter } from 'next/navigation';
import JournalComposer from '@/components/JournalComposer';
import { Plus, X } from 'lucide-react';

export default function JournalPage() {
  const theme = useContext(ThemeContext);
  const router = useRouter();
  
  const toast = useToast();
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/journal');
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (error) {
      console.error('Failed to fetch journal entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToVault = async (entry) => {
    const newVaultStatus = !entry.isVault;
    setEntries(entries.map(e => e.id === entry.id ? { ...e, isVault: newVaultStatus } : e));
    try {
      const res = await fetch('/api/vault', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: entry.id, isVault: newVaultStatus })
      });
      if (!res.ok) {
        setEntries(entries.map(e => e.id === entry.id ? { ...e, isVault: entry.isVault } : e));
        toast.show('שגיאה בשמירה לתיבה', 'error');
      } else {
        toast.show(newVaultStatus ? 'נשמר בדברים המיוחדים' : 'הוסר מהדברים המיוחדים', 'success');
      }
    } catch (error) {
      console.error(error);
      setEntries(entries.map(e => e.id === entry.id ? { ...e, isVault: entry.isVault } : e));
    }
  };

  const handleToggleVisibility = async (entry) => {
    const newVisibility = entry.visibility === 'staff' ? 'private' : 'staff';
    setEntries(entries.map(e => e.id === entry.id ? { ...e, visibility: newVisibility } : e));
    
    try {
      const res = await fetch('/api/journal/visibility', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: entry.id, visibility: newVisibility })
      });
      
      if (!res.ok) {
        setEntries(entries.map(e => e.id === entry.id ? { ...e, visibility: entry.visibility } : e));
        toast.show('שגיאה בעדכון הרשאות הצפייה', 'error');
      } else {
        toast.show(newVisibility === 'staff' ? 'שיתוף עם הצוות הופעל' : 'השיתוף בוטל, הרשומה פרטית', 'success');
      }
    } catch (error) {
      console.error(error);
      setEntries(entries.map(e => e.id === entry.id ? { ...e, visibility: entry.visibility } : e));
      toast.show('שגיאה בעדכון הרשאות הצפייה', 'error');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    const isConfirmed = await toast.confirm('האם אתה בטוח שברצונך למחוק רשומה זו?');
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/journal/${entryId}`, { method: 'DELETE' });
      if (res.ok) {
        setEntries(entries.filter(e => e.id !== entryId));
        toast.show('הרשומה נמחקה', 'success');
      } else {
        toast.show('שגיאה במחיקת הרשומה.', 'error');
      }
    } catch (error) {
      toast.show('שגיאה במחיקת הרשומה.', 'error');
    }
  };

  return (
    <div className={styles.container}>

      {/* Floating Action Button for Composer */}
      <div style={{ position: 'fixed', bottom: '80px', left: '20px', zIndex: 100 }}>
        <button 
          onClick={() => setIsComposing(!isComposing)}
          style={{
            width: '60px', height: '60px', borderRadius: '30px', 
            background: 'var(--primary-color)', color: 'white',
            border: 'none', cursor: 'pointer', display: 'flex', 
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'transform 0.2s'
          }}
        >
          {isComposing ? <X size={30} /> : <Plus size={30} />}
        </button>
      </div>

      {isComposing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{ width: '100%', maxWidth: '600px', background: 'white', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
            <JournalComposer onPostCreated={(newPost) => {
              setEntries([newPost, ...entries]);
              setIsComposing(false);
            }} onCancelEdit={() => setIsComposing(false)} />
          </div>
        </div>
      )}

      {/* Journal Pages Feed */}
      <div className={styles.pagesFeed}>
        {isLoading ? (
          <p style={{ textAlign: 'center' }}>מדפדף ביומן...</p>
        ) : entries.length === 0 ? (
          <div className={styles.emptyJournal}>אין עדיין רשומות. זה הזמן לכתוב!</div>
        ) : (
          entries.map(entry => {
            const timeRef = entry.updatedAt ? new Date(entry.updatedAt) : new Date(entry.createdAt);
            const isEditable = (new Date() - timeRef) / (1000 * 60) <= 30;
            const isMood = entry.category === 'mood';
            let moodEmoji = '📝';
            if (isMood && Array.isArray(entry.tags) && entry.tags[1]) {
              const rating = parseInt(entry.tags[1]);
              if (rating === 1) moodEmoji = '😞';
              if (rating === 2) moodEmoji = '😕';
              if (rating === 3) moodEmoji = '😐';
              if (rating === 4) moodEmoji = '🙂';
              if (rating === 5) moodEmoji = '🤩';
            }

            return (
              <div 
                key={entry.id} 
                className={styles.journalPage} 
                style={isMood ? { 
                  paddingTop: '20px', 
                  paddingBottom: '20px' 
                } : {}}
              >
                {isMood && (
                  <div style={{
                    position: 'absolute',
                    left: '20px',
                    top: '50%',
                    transform: 'translate(-50%, -50%) rotate(-90deg)',
                    transformOrigin: 'center center',
                    color: '#94a3b8', // Soft grey to match the notebook style
                    fontWeight: 'bold',
                    fontSize: '14px',
                    letterSpacing: '2px',
                    whiteSpace: 'nowrap'
                  }}>
                    מצב הרוח
                  </div>
                )}
                <div className={styles.pageHeader}>
                  <div className={styles.pageDate}>
                    <AppDate date={entry.createdAt} />
                  </div>
                  <div className={styles.pageActions} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {isEditable && !isMood && (
                        <>
                          <button onClick={() => router.push(`/home?edit=${entry.id}`)} className={styles.deleteBtn} style={{ color: '#3b82f6' }} title="ערוך">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDeleteEntry(entry.id)} className={styles.deleteBtn} title="מחק">
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                      {isEditable && isMood && (
                        <button onClick={() => handleDeleteEntry(entry.id)} className={styles.deleteBtn} title="מחק">
                          <Trash2 size={18} />
                        </button>
                      )}
                      <button onClick={() => handleSaveToVault(entry)} className={entry.isVault ? styles.starBtnActive : styles.starBtn} title="שמור במועדפים">
                        <Star size={18} fill={entry.isVault ? '#f59e0b' : 'none'} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleToggleVisibility(entry)} 
                        className={styles.deleteBtn} 
                        style={{ color: entry.visibility === 'staff' ? '#10b981' : '#94a3b8' }}
                        title={entry.visibility === 'staff' ? 'משותף עם הצוות' : 'פרטי'}
                      >
                        {entry.visibility === 'staff' ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
                
                {isMood ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                    <span style={{ fontSize: '32px' }}>{moodEmoji}</span>
                    {entry.bodyText && (
                      <p className={styles.pageBody} style={{ fontStyle: 'italic', margin: 0 }}>"{entry.bodyText}"</p>
                    )}
                  </div>
                ) : (
                  <p className={styles.pageBody}>{entry.bodyText}</p>
                )}
                
                {entry.mediaUrls && entry.mediaUrls.length > 0 && (
                  <div className={styles.pageMedia}>
                    {entry.mediaUrls.map((media, idx) => (
                      media.type === 'image' && <img key={idx} src={media.url} alt="Media" className={styles.pageImage} />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
