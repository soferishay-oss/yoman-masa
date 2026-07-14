'use client';

import { useState, useEffect } from 'react';
import styles from './journal.module.css';
import { queueSyncAction } from '@/lib/sync/localStore';

export default function JournalPage() {
  const [entries, setEntries] = useState([
    { id: 1, title: 'מסע יהודה', content: 'רגעים פשוטים שהפכו למשמעותיים. למדתי הרבה על החברים ועל עצמי.', date: '22.05.25', image: '🏔️' },
    { id: 2, title: 'התחלה חדשה', content: 'היום הראשון במכינה. יש המון חששות אבל גם ציפייה גדולה.', date: '01.09.24', image: '🌅' }
  ]);
  
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  // In a real app, we would load local and remote entries here
  useEffect(() => {
    // loadEntries();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newEntryContent) return;

    const newLocalEntry = {
      id: Date.now(),
      title: newEntryTitle || 'רשומה ללא כותרת',
      content: newEntryContent,
      date: new Date().toLocaleDateString('he-IL'),
      image: '📝'
    };

    // Add to local UI state
    setEntries([newLocalEntry, ...entries]);
    
    // Queue offline sync action
    await queueSyncAction('CREATE_JOURNAL_ENTRY', {
      title: newLocalEntry.title,
      bodyText: newLocalEntry.content,
      visibility: 'private'
    });

    setNewEntryTitle('');
    setNewEntryContent('');
    setIsComposing(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>היומן האישי</h1>
        <p>מרחב בטוח לתיעוד המסע שלך</p>
      </header>

      {!isComposing ? (
        <button className={styles.composeBtn} onClick={() => setIsComposing(true)}>
          <span className={styles.composeIcon}>✏️</span>
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
        {entries.map(entry => (
          <div key={entry.id} className={styles.entryCard}>
            <div className={styles.entryHeader}>
              <div className={styles.entryImage}>{entry.image}</div>
              <div className={styles.entryMeta}>
                <h3>{entry.title}</h3>
                <span className={styles.entryDate}>{entry.date}</span>
              </div>
            </div>
            <p className={styles.entryBody}>{entry.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
