'use client';

import { useState, useEffect } from 'react';
import { PenLine, Image as ImageIcon, Mic, Send, Sparkles, Star, Trash2 } from 'lucide-react';
import styles from './journal.module.css';
import { queueSyncAction } from '@/lib/sync/localStore';
import AudioRecorder from '@/components/AudioRecorder';
import { useToast } from '@/components/ToastProvider';
import EmojiPickerButton from '@/components/EmojiPickerButton';

export default function JournalPage() {
  const toast = useToast();
  const [entries, setEntries] = useState([]);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [userName, setUserName] = useState('');
  
  // AI Fixing States
  const [isFixingPhrasing, setIsFixingPhrasing] = useState(false);
  const [fixedDraft, setFixedDraft] = useState('');
  const [originalDraft, setOriginalDraft] = useState('');
  const [showFixedDraftOptions, setShowFixedDraftOptions] = useState(false);

  useEffect(() => {
    fetchEntries();
    fetch('/api/profile').then(res => res.ok && res.json()).then(data => {
      if (data && data.fullName) setUserName(data.fullName.split(' ')[0]);
    }).catch(err => console.error(err));
  }, []);

  const hour = new Date().getHours();
  let greetingTime = 'ערב טוב';
  if (hour < 12) greetingTime = 'בוקר טוב';
  else if (hour < 18) greetingTime = 'צהריים טובים';

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
    if (e) e.preventDefault();
    if (!newEntryContent && mediaUrls.length === 0) return;

    try {
      const cleanMediaUrls = mediaUrls.map(m => ({ type: m.type, url: m.url }));
      
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newEntryContent,
          isDraft: false,
          mediaUrls: cleanMediaUrls,
          aiTranscription: originalDraft || null
        })
      });

      if (res.ok) {
        const newPost = await res.json();
        setEntries([newPost, ...entries]);
        
        queueSyncAction('CREATE_JOURNAL_ENTRY', {
          bodyText: newEntryContent,
          visibility: 'private'
        });

        setNewEntryContent('');
        setMediaUrls([]);
        setFixedDraft('');
        setOriginalDraft('');
        setShowFixedDraftOptions(false);
        toast.show('הרשומה נשמרה ביומן', 'success');
      } else {
        const errorData = await res.json();
        toast.show(errorData.error || 'שגיאה בשמירת הרשומה. ייתכן שהקובץ גדול מדי.', 'error');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast.show('שגיאה בשמירת הרשומה. ייתכן שהקובץ גדול מדי.', 'error');
    }
  };

  const handleAudioComplete = async (media) => {
    setIsRecording(true);
    try {
      const formData = new FormData();
      formData.append('audio', media.file, `recording.webm`);
      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.basicText?.includes('שגיאה: חסר מפתח')) {
          toast.show(data.basicText, 'error');
          return;
        }
        
        setNewEntryContent(prev => prev ? prev + ' ' + (data.basicText || '') : (data.basicText || ''));
        setOriginalDraft(data.basicText || '');
        toast.show('ההקלטה תומללה', 'success');
      }
    } catch (err) {
      console.error(err);
      toast.show('שגיאה בתמלול ההקלטה', 'error');
    } finally {
      setIsRecording(false);
    }
  };

  const handleFixPhrasing = async () => {
    if (!newEntryContent) return;
    setIsFixingPhrasing(true);
    try {
      const res = await fetch('/api/ai/fix-phrasing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newEntryContent })
      });
      if (res.ok) {
        const data = await res.json();
        setOriginalDraft(newEntryContent);
        setFixedDraft(data.fixedText);
        setShowFixedDraftOptions(true);
      } else {
        toast.show('שגיאה בתיקון הניסוח', 'error');
      }
    } catch (err) {
      console.error(err);
      toast.show('שגיאה בתיקון הניסוח', 'error');
    } finally {
      setIsFixingPhrasing(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast.show('הקובץ גדול מדי. ניתן להעלות עד 4MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setMediaUrls([...mediaUrls, { type: 'image', url: reader.result }]);
      reader.readAsDataURL(file);
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
      {/* Quick Composition Area */}
      <div className={styles.composeArea}>
        <h2 className={styles.greetingTitle}>{greetingTime}{userName ? `, ${userName}` : ''}</h2>
        <div className={styles.inputWrapper}>
          <textarea 
            className={styles.quickInput}
            placeholder="מה איתך???"
            value={newEntryContent}
            onChange={(e) => setNewEntryContent(e.target.value)}
            rows={6}
          />
          <div className={styles.emojiCorner}>
            <EmojiPickerButton onEmojiClick={(emoji) => setNewEntryContent(prev => prev + emoji)} />
          </div>
        </div>
        <p className={styles.helperText} style={{ textAlign: 'right', marginTop: '-10px', marginBottom: '15px' }}>
          * לא ניתן למחוק רשומה לאחר חצי שעה מפרסומה
        </p>

        {showFixedDraftOptions && (
          <div className={styles.aiDraftOptions}>
            <h4>בחר את הניסוח המועדף:</h4>
            <div 
              className={styles.draftCard} 
              onClick={() => { setNewEntryContent(originalDraft); setShowFixedDraftOptions(false); }}
            >
              <strong>המקורי שלי:</strong> {originalDraft}
            </div>
            <div 
              className={`${styles.draftCard} ${styles.draftSelected}`} 
              onClick={() => { setNewEntryContent(fixedDraft); setShowFixedDraftOptions(false); }}
            >
              <strong>תוקן ע"י AI:</strong> {fixedDraft}
            </div>
          </div>
        )}

        {mediaUrls.length > 0 && (
          <div className={styles.mediaPreview}>
            {mediaUrls.map((media, idx) => (
              media.type === 'image' && (
                <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={media.url} alt="Uploaded" className={styles.previewImage} />
                  <button type="button" onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))} className={styles.removeMediaBtn}>X</button>
                </div>
              )
            ))}
          </div>
        )}

        <div className={styles.actionButtons}>
          <div className={styles.leftActions}>
            <button onClick={handleSave} disabled={!newEntryContent && mediaUrls.length === 0} className={styles.roundActionBtn} style={{ color: '#3b82f6', background: '#eff6ff' }} title="שלח">
              <Send size={20} />
            </button>
            {newEntryContent && !showFixedDraftOptions && (
              <button 
                onClick={handleFixPhrasing} 
                disabled={isFixingPhrasing} 
                className={`${styles.fixPhrasingBtn} ${isFixingPhrasing ? styles.loadingBtn : ''}`}
                title="תקן ניסוח עם AI"
              >
                <Sparkles size={16} /> תקן ניסוח
              </button>
            )}
          </div>
          <div className={styles.rightActions}>
            <AudioRecorder 
              onRecordingComplete={handleAudioComplete} 
              customButton={
                <button className={styles.roundActionBtn} style={{ color: '#ef4444', background: '#fee2e2' }} title="הקלט קול" disabled={isRecording}>
                  <Mic size={20} />
                </button>
              }
            />
            <label className={styles.roundActionBtn} style={{ color: '#64748b', background: '#f1f5f9' }} title="הוסף תמונה">
              <ImageIcon size={20} />
              <input type="file" accept="image/*" style={{display: 'none'}} onChange={handleImageUpload} />
            </label>
          </div>
        </div>
        <p className={styles.helperText} style={{ textAlign: 'left' }}>* ניתן להעלות תמונה עד 4MB</p>
      </div>

      {/* Journal Pages Feed */}
      <div className={styles.pagesFeed}>
        {isLoading ? (
          <p style={{ textAlign: 'center' }}>מדפדף ביומן...</p>
        ) : entries.length === 0 ? (
          <div className={styles.emptyJournal}>אין עדיין רשומות. זה הזמן לכתוב!</div>
        ) : (
          entries.map(entry => {
            const dateStr = new Date(entry.createdAt).toLocaleDateString('he-IL');
            const timeStr = new Date(entry.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
            const isDeletable = (new Date() - new Date(entry.createdAt)) / (1000 * 60) <= 30;

            return (
              <div key={entry.id} className={styles.journalPage}>
                <div className={styles.pageHeader}>
                  <span className={styles.pageDate}>{dateStr} {timeStr}</span>
                  <div className={styles.pageActions}>
                    {isDeletable && (
                      <button onClick={() => handleDeleteEntry(entry.id)} className={styles.deleteBtn}>
                        <Trash2 size={18} />
                      </button>
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
