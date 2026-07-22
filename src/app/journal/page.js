'use client';

import { useState, useEffect, useContext } from 'react';
import { Star, Trash2, Edit2 } from 'lucide-react';
import { ThemeContext } from '@/components/ThemeProvider';
import AppDate from '@/components/AppDate';
import styles from './journal.module.css';
import { useToast } from '@/components/ToastProvider';
import { useRouter } from 'next/navigation';

export default function JournalPage() {
  const theme = useContext(ThemeContext);
  const router = useRouter();
  
  const toast = useToast();
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

            return (
              <div key={entry.id} className={styles.journalPage}>
                <div className={styles.pageHeader}>
                  <div className={styles.pageDate}><AppDate date={entry.createdAt} /></div>
                  <div className={styles.pageActions}>
                    {isEditable && (
                      <>
                        <button onClick={() => router.push(`/home?edit=${entry.id}`)} className={styles.deleteBtn} style={{ color: '#3b82f6' }} title="ערוך">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteEntry(entry.id)} className={styles.deleteBtn} title="מחק">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                    <button onClick={() => handleSaveToVault(entry)} className={entry.isVault ? styles.starBtnActive : styles.starBtn}>
                      <Star size={18} fill={entry.isVault ? '#f59e0b' : 'none'} />
                    </button>
                  </div>
                </div>
                
                <p className={styles.pageBody}>{entry.bodyText}</p>
                
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
