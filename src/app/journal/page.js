'use client';

import { useState, useEffect } from 'react';
import { PenLine, Map, Sunrise, Image as ImageIcon, Video, Mic, Sparkles, Star, Trash2 } from 'lucide-react';
import styles from './journal.module.css';
import { queueSyncAction } from '@/lib/sync/localStore';
import AudioRecorder from '@/components/AudioRecorder';
import { useToast } from '@/components/ToastProvider';
import EmojiPickerButton from '@/components/EmojiPickerButton';

export default function JournalPage() {
  const toast = useToast();
  const [entries, setEntries] = useState([]);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState([]);
  const [isComposing, setIsComposing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [aiThought, setAiThought] = useState('');
  const [smartDraft, setSmartDraft] = useState('');
  const [basicDraft, setBasicDraft] = useState('');
  const [showDrafts, setShowDrafts] = useState(false);

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
    if (!newEntryContent && mediaUrls.length === 0) return;

    try {
      // Strip 'file' object from media to prevent JSON serialization issues
      const cleanMediaUrls = mediaUrls.map(m => ({ type: m.type, url: m.url }));
      
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newEntryTitle || null,
          content: newEntryContent,
          isDraft: false,
          mediaUrls: cleanMediaUrls,
          aiTranscription: basicDraft || null,
          aiThought: aiThought || null
        })
      });

      if (res.ok) {
        const newPost = await res.json();
        setEntries([newPost, ...entries]);
        
        queueSyncAction('CREATE_JOURNAL_ENTRY', {
          title: newEntryTitle,
          bodyText: newEntryContent,
          visibility: 'private'
        });

        setNewEntryTitle('');
        setNewEntryContent('');
        setMediaUrls([]);
        setSmartDraft('');
        setBasicDraft('');
        setShowDrafts(false);
        setAiThought('');
        setIsComposing(false);
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





  const handleTranscribeAll = async () => {
    setIsRecording(true);
    try {
      const audioFiles = mediaUrls.filter(m => m.type === 'audio' && m.file).map(m => m.file);
      if (audioFiles.length === 0) return;

      let combinedBasic = '';
      let combinedSmart = '';
      let lastAiThought = '';

      for (let i = 0; i < audioFiles.length; i++) {
        const formData = new FormData();
        formData.append('audio', audioFiles[i], `recording_${i}.webm`);
        const res = await fetch('/api/ai/transcribe', {
          method: 'POST',
          body: formData
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.basicText?.includes('שגיאה: חסר מפתח')) {
            toast.show(data.basicText + '\n' + data.aiThought, 'error');
            setIsRecording(false);
            return;
          }
          combinedBasic += (combinedBasic ? '\n\n' : '') + (data.basicText || '');
          combinedSmart += (combinedSmart ? '\n\n' : '') + (data.smartText || '');
          if (data.aiThought) lastAiThought = data.aiThought;
        }
      }

      setBasicDraft(combinedBasic);
      setSmartDraft(combinedSmart);
      setAiThought(lastAiThought);
      setShowDrafts(true);
      toast.show('הקלטות תומללו בהצלחה', 'success');
    } catch (err) {
      console.error(err);
      toast.show('שגיאה בתמלול', 'error');
    } finally {
      setIsRecording(false);
    }
  };

  const renderMediaPreview = () => {
    if (mediaUrls.length === 0) return null;
    const audioMedia = mediaUrls.find(m => m.type === 'audio');
    return (
      <div style={{ marginTop: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {mediaUrls.map((media, idx) => (
            <div key={idx} style={{position: 'relative'}}>
              {media.type === 'image' && <img src={media.url} alt="Uploaded" style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px'}} />}
              {media.type === 'video' && <video src={media.url} style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px'}} muted />}
              {media.type === 'audio' && <audio src={media.url} controls style={{width: '100%', maxWidth: '250px'}} />}
              <button type="button" onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))} style={{position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: 24, height: 24, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>X</button>
            </div>
          ))}
        </div>
        {audioMedia && audioMedia.file && !showDrafts && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={handleTranscribeAll} disabled={isRecording} style={{padding: '8px', borderRadius: '8px', background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', flex: 1}}>
              {isRecording ? 'מעבד הקלטות...' : 'עבד הקלטות לטקסט'}
            </button>
          </div>
        )}
        {showDrafts && (
          <div style={{ marginTop: '15px', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{marginBottom: '10px'}}>בחר איזה תמלול להוסיף ליומן:</h4>
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <div 
                onClick={() => { setNewEntryContent(prev => prev ? prev + '\n\n' + basicDraft : basicDraft); setShowDrafts(false); }}
                style={{ padding: '10px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>
                <strong>תמלול רגיל:</strong><br/>{basicDraft}
              </div>
              <div 
                onClick={() => { setNewEntryContent(prev => prev ? prev + '\n\n' + smartDraft : smartDraft); setShowDrafts(false); }}
                style={{ padding: '10px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', borderLeft: '4px solid var(--primary-color)' }}>
                <strong>תמלול חכם (ערוך):</strong><br/>{smartDraft}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleSaveToVault = async (entry) => {
    const newVaultStatus = !entry.isVault;
    
    // Optimistic UI update
    setEntries(entries.map(e => e.id === entry.id ? { ...e, isVault: newVaultStatus } : e));
    
    try {
      const res = await fetch('/api/vault', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: entry.id, isVault: newVaultStatus })
      });
      if (!res.ok) {
        // Revert on failure
        setEntries(entries.map(e => e.id === entry.id ? { ...e, isVault: entry.isVault } : e));
        toast.show('שגיאה בשמירה לכספת', 'error');
      } else {
        toast.show(newVaultStatus ? 'נשמר לכספת' : 'הוסר מהכספת', 'success');
      }
    } catch (error) {
      console.error(error);
      // Revert on failure
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
        toast.show('הרשומה נמחקה בהצלחה', 'success');
      } else {
        const data = await res.json();
        toast.show(data.error || 'שגיאה במחיקת הרשומה.', 'error');
      }
    } catch (error) {
      console.error(error);
      toast.show('שגיאה במחיקת הרשומה.', 'error');
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
          <div style={{fontSize: '12px', color: '#64748b', marginBottom: '10px', textAlign: 'left'}}>
            * רשומה ניתנת לעריכה או מחיקה רק עד חצי שעה מכתיבתה
          </div>
          <input 
            type="text" 
            placeholder="כותרת (אופציונלי)" 
            value={newEntryTitle}
            onChange={(e) => setNewEntryTitle(e.target.value)}
            className={styles.titleInput}
          />
          <div style={{ position: 'relative' }}>
            <textarea 
              placeholder="מה עבר עליך היום?..." 
              value={newEntryContent}
              onChange={(e) => setNewEntryContent(e.target.value)}
              className={styles.contentInput}
              rows={5}
            />
            <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
              <EmojiPickerButton onEmojiClick={(emoji) => setNewEntryContent(prev => prev + emoji)} />
            </div>
          </div>
          
          {aiThought && (
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '10px', borderLeft: '4px solid var(--primary-color)' }}>
              <span style={{color: 'var(--primary-color)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px'}}>
                <Sparkles size={16} /> שאלה למחשבה:
              </span>
              <p style={{fontSize: '14px', margin: '5px 0 0'}}>{aiThought}</p>
            </div>
          )}

          {renderMediaPreview()}

          <div style={{fontSize: '12px', color: '#64748b', marginBottom: '5px', textAlign: 'left'}}>
            * ניתן להעלות קבצים עד 4MB
          </div>
          <div style={{display: 'flex', gap: '10px', marginTop: '5px', marginBottom: '15px'}}>
            <label style={{padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>
              <ImageIcon size={18} /> תמונה
              <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  if (file.size > 4 * 1024 * 1024) {
                    toast.show('הקובץ גדול מדי. ניתן להעלות קבצים עד 4MB', 'error');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onloadend = () => setMediaUrls([...mediaUrls, { type: 'image', url: reader.result }]);
                  reader.readAsDataURL(file);
                }
              }} />
            </label>
            <label style={{padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>
              <Video size={18} /> וידאו
              <input type="file" accept="video/*" style={{display: 'none'}} onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  if (file.size > 4 * 1024 * 1024) {
                    toast.show('הקובץ גדול מדי. ניתן להעלות קבצים עד 4MB', 'error');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onloadend = () => setMediaUrls([...mediaUrls, { type: 'video', url: reader.result }]);
                  reader.readAsDataURL(file);
                }
              }} />
            </label>
            <AudioRecorder onRecordingComplete={(media) => setMediaUrls([...mediaUrls, media])} />
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={() => setIsComposing(false)} className={styles.cancelBtn}>ביטול</button>
            <button type="submit" className={styles.saveBtn} disabled={!newEntryContent && mediaUrls.length === 0}>שמור ביומן</button>
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
            const isDeletable = (new Date() - new Date(entry.createdAt)) / (1000 * 60) <= 30;

            return (
              <div key={entry.id} className={styles.entryCard} style={{position:'relative'}}>
                {isDeletable && (
                  <button 
                    onClick={() => handleDeleteEntry(entry.id)}
                    style={{
                      position:'absolute', left:'45px', top:'15px', background:'none', border:'none', 
                      color:'#ef4444', cursor:'pointer', padding:'5px'
                    }}
                    title="מחק רשומה (זמין עד חצי שעה מהפרסום)"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button 
                  onClick={() => handleSaveToVault(entry)}
                  style={{
                    position:'absolute', left:'15px', top:'15px', background:'none', border:'none', 
                    color: entry.isVault ? '#f59e0b' : '#94a3b8', cursor:'pointer', padding:'5px'
                  }}
                  title={entry.isVault ? "הסר מכספת הזיכרונות" : "שמור לכספת הזיכרונות"}
                >
                  <Star size={20} fill={entry.isVault ? '#f59e0b' : 'none'} />
                </button>
                <div className={styles.entryHeader}>
                  <div className={styles.entryImage}>{renderIcon('default')}</div>
                  <div className={styles.entryMeta}>
                    <h3>{entry.title || 'רשומה ביומן'}</h3>
                    <span className={styles.entryDate}>{dateStr}</span>
                  </div>
                </div>
                
                <p className={styles.entryBody}>{entry.bodyText}</p>
                
                {entry.mediaUrls && entry.mediaUrls.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                    {entry.mediaUrls.map((media, idx) => (
                      media.type === 'image' ? 
                        <img key={idx} src={media.url} alt="Media" style={{width: '100%', maxWidth: '300px', borderRadius: '8px'}} /> :
                        <video key={idx} src={media.url} controls style={{width: '100%', maxWidth: '300px', borderRadius: '8px'}} />
                    ))}
                  </div>
                )}

                {entry.aiThought && (
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginTop: '15px', borderRight: '4px solid var(--primary-color)' }}>
                    <span style={{color: 'var(--primary-color)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px'}}>
                      <Sparkles size={16} /> שאלה למחשבה:
                    </span>
                    <p style={{fontSize: '14px', margin: '0'}}>{entry.aiThought}</p>
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
