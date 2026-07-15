'use client';

import { useState, useEffect } from 'react';
import { PenLine, Map, Sunrise, Image as ImageIcon, Video, Mic, Sparkles, Star } from 'lucide-react';
import styles from './journal.module.css';
import { queueSyncAction } from '@/lib/sync/localStore';

export default function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState([]);
  const [isComposing, setIsComposing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [aiThought, setAiThought] = useState('');
  const [aiTranscription, setAiTranscription] = useState('');

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
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newEntryTitle || null,
          content: newEntryContent,
          isDraft: false,
          mediaUrls,
          aiTranscription,
          aiThought
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
        setAiTranscription('');
        setAiThought('');
        setIsComposing(false);
      }
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };



  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  const handleStartAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        setIsRecording(true);
        try {
          const res = await fetch('/api/ai/transcribe', {
            method: 'POST',
            body: formData
          });
          if (res.ok) {
            const data = await res.json();
            if (data.basicText?.includes('שגיאה: חסר מפתח')) {
              alert(data.basicText + '\n' + data.aiThought);
              return;
            }
            setNewEntryContent(prev => prev ? prev + '\n' + data.smartText : data.smartText);
            setAiTranscription(data.basicText);
            setAiThought(data.aiThought);
          }
        } catch (err) {
          console.error('Failed to transcribe', err);
          alert('שגיאה בעיבוד הקלטה');
        } finally {
          setIsRecording(false);
          setAudioChunks([]);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
    } catch (err) {
      console.error('Microphone access denied', err);
      alert('יש לאפשר גישה למיקרופון כדי להקליט');
    }
  };

  const handleStopAudioRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setMediaRecorder(null);
    }
  };

  const renderMediaPreview = () => {
    if (mediaUrls.length === 0) return null;
    return (
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
        {mediaUrls.map((media, idx) => (
          media.type === 'image' ? 
            <img key={idx} src={media.url} alt="Uploaded" style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px'}} /> :
            <video key={idx} src={media.url} style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px'}} muted />
        ))}
      </div>
    );
  };

  const handleSaveToVault = async (id) => {
    try {
      const res = await fetch('/api/vault', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: id, isVault: true })
      });
      if (res.ok) alert('נשמר לכספת הזיכרונות!');
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
            rows={5}
          />
          
          {aiThought && (
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '10px', borderLeft: '4px solid var(--primary-color)' }}>
              <span style={{color: 'var(--primary-color)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px'}}>
                <Sparkles size={16} /> שאלה למחשבה:
              </span>
              <p style={{fontSize: '14px', margin: '5px 0 0'}}>{aiThought}</p>
            </div>
          )}

          {renderMediaPreview()}

          <div style={{display: 'flex', gap: '10px', marginTop: '10px', marginBottom: '15px'}}>
            <label style={{padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>
              <ImageIcon size={18} /> תמונה
              <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
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
                  const reader = new FileReader();
                  reader.onloadend = () => setMediaUrls([...mediaUrls, { type: 'video', url: reader.result }]);
                  reader.readAsDataURL(file);
                }
              }} />
            </label>
            <button 
              type="button"
              onClick={mediaRecorder ? handleStopAudioRecording : handleStartAudioRecording} 
              className={mediaRecorder ? styles.recording : ''}
              title="הקלטה קולית חכמה"
              style={{padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: mediaRecorder ? '#fee2e2' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}
            >
              <Mic size={20}/> {mediaRecorder && <span className={styles.pulsingDot}></span>}
            </button>
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
