'use client';

import { useState, useEffect } from 'react';
import { PenLine, Map, Sunrise, Image as ImageIcon } from 'lucide-react';
import styles from './journal.module.css';
import { queueSyncAction } from '@/lib/sync/localStore';

export default function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [isComposing, setIsComposing] = useState(false);
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newEntryContent) return;

    // Build the string: if title exists, we might want to store it in DB (we don't have title column in schema, but we can prepend it to content for now, or just use content)
    // Actually schema for JournalPost only has `content`. We'll just prepend title as bold text if provided.
    let finalContent = newEntryContent;
    if (newEntryTitle) {
      finalContent = `**${newEntryTitle}**\n${newEntryContent}`;
    }

    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newEntryTitle || null,
          content: newEntryContent,
          isDraft: false
        })
      });

      if (res.ok) {
        const newPost = await res.json();
        setEntries([newPost, ...entries]);
        
        // Also queue sync action just in case we need offline support later
        queueSyncAction('CREATE_JOURNAL_ENTRY', {
          title: newEntryTitle,
          bodyText: newEntryContent,
          visibility: 'private'
        });

        setNewEntryTitle('');
        setNewEntryContent('');
        setIsComposing(false);
      }
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleSaveToVault = async (id) => {
    try {
      const res = await fetch('/api/vault', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: id, isVault: true })
      });
      if (res.ok) {
        alert('נשמר לכספת הזיכרונות!');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'map': return <Map size={24} color="var(--primary-color)" />;
      case 'sunrise': return <Sunrise size={24} color="var(--primary-color)" />;
      default: return <ImageIcon size={24} color="var(--primary-color)" />;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>היומן האישי</h1>
        <p>מרחב בטוח לתיעוד המסע שלך</p>
      </header>

      {!isComposing ? (
        <button className={styles.composeBtn} onClick={() => setIsComposing(true)}>
          <span className={styles.composeIcon}><PenLine size={20} /></span>
          כתוב רשומה חדשה
        </button>
      ) : (
        <form onSubmit={handleSave} className={styles.composeForm}>
          <input 
            type="text" 
            placeholder="כותרת (אופציונלי)" 
            value={newEntryTitle}
            onChange={(e) => setNewEntryTitle(e.target.value)}
            className={styles.titleInput}
          />
          <textarea 
            placeholder="מה עבר עליך היום?..." 
            value={newEntryContent}
            onChange={(e) => setNewEntryContent(e.target.value)}
            className={styles.contentInput}
            required
            rows={5}
          />
          <div className={styles.formActions}>
            <button type="button" onClick={() => setIsComposing(false)} className={styles.cancelBtn}>ביטול</button>
            <button type="submit" className={styles.saveBtn}>שמור ביומן</button>
          </div>
        </form>
      )}

      <div className={styles.timeline}>
        {isLoading ? (
          <p>טוען יומן...</p>
        ) : entries.length === 0 ? (
          <p>אין עדיין רשומות ביומן. זה הזמן לכתוב את הראשונה!</p>
        ) : (
          entries.map(entry => {
            const dateStr = new Date(entry.createdAt).toLocaleDateString('he-IL');

            return (
              <div key={entry.id} className={styles.entryCard} style={{position:'relative'}}>
                <button 
                  onClick={() => handleSaveToVault(entry.id)}
                  style={{
                    position:'absolute', left:'15px', top:'15px', background:'none', border:'none', 
                    color:'#94a3b8', cursor:'pointer', padding:'5px'
                  }}
                  title="שמור לכספת הזיכרונות"
                >
                  <Star size={20} />
                </button>
                <div className={styles.entryHeader}>
                  <div className={styles.entryImage}>{renderIcon('default')}</div>
                  <div className={styles.entryMeta}>
                    <h3>{entry.title || 'רשומה ביומן'}</h3>
                    <span className={styles.entryDate}>{dateStr}</span>
                  </div>
                </div>
                <p className={styles.entryBody}>{entry.bodyText}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
