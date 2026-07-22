'use client';

import { useState, useEffect } from 'react';
import { Heart, User, Image as ImageIcon, Mic, Sparkles, Reply, Smile, Star, Send } from 'lucide-react';
import styles from './letters.module.css';
import { useToast } from '@/components/ToastProvider';
import AudioRecorder from '@/components/AudioRecorder';
import EmojiPickerButton from '@/components/EmojiPickerButton';

export default function LettersPage() {
  const toast = useToast();
  const [letters, setLetters] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComposing, setIsComposing] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [letterContent, setLetterContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [aiThought, setAiThought] = useState('');
  const [aiTranscription, setAiTranscription] = useState('');

  useEffect(() => {
    fetchLetters();
    fetchUsers();
  }, []);

  const fetchLetters = async () => {
    try {
      const res = await fetch('/api/letters');
      if (res.ok) {
        const data = await res.json();
        setLetters(data);
      }
    } catch (error) {
      console.error('Failed to fetch letters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users/group');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

    if (type === 'image') {
      setMediaUrls([...mediaUrls, { type: 'image', url: 'https://via.placeholder.com/400x300.png?text=Simulated+Letter+Image' }]);
    }



  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedUser || (!letterContent && mediaUrls.length === 0)) return;

    try {
      const res = await fetch('/api/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recipientId: selectedUser, 
          content: letterContent,
          mediaUrls,
          aiTranscription,
          aiThought 
        })
      });
      if (res.ok) {
        toast.show('המכתב נשלח בהצלחה!', 'success');
        setIsComposing(false);
        setLetterContent('');
        setSelectedUser('');
        setMediaUrls([]);
        setAiThought('');
        setAiTranscription('');
        fetchLetters();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.show(errData.error || 'שגיאה בשליחת המכתב', 'error');
      }
    } catch (error) {
      console.error(error);
      toast.show('שגיאה בשליחת המכתב', 'error');
    }
  };

  const handleTranscribeAll = async (type = 'smart') => {
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

      if (type === 'smart') {
        setLetterContent(prev => prev ? prev + '\n' + combinedSmart : combinedSmart);
        setAiThought(lastAiThought);
      } else {
        setLetterContent(prev => prev ? prev + '\n' + combinedBasic : combinedBasic);
      }
      toast.show('ההקלטות תומללו בהצלחה', 'success');
    } catch (err) {
      console.error(err);
      toast.show('שגיאה בתמלול', 'error');
    } finally {
      setIsRecording(false);
    }
  };

  const handleAddReaction = async (letterId, emoji) => {
    const letter = letters.find(l => l.id === letterId);
    if (!letter) return;
    
    let currentReactions = Array.isArray(letter.reactions) ? letter.reactions : [];
    const newReactions = [...currentReactions, emoji];

    // Optimistic
    setLetters(letters.map(l => l.id === letterId ? { ...l, reactions: newReactions } : l));
    
    try {
      const res = await fetch(`/api/letters/${letterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactions: newReactions })
      });
      if (!res.ok) {
        toast.show('שגיאה בהוספת תגובה', 'error');
        setLetters(letters.map(l => l.id === letterId ? { ...l, reactions: currentReactions } : l));
      }
    } catch (err) {
      console.error(err);
      setLetters(letters.map(l => l.id === letterId ? { ...l, reactions: currentReactions } : l));
    }
  };

  const handleSaveToVault = async (letter) => {
    const newVaultStatus = !letter.isVault;
    setLetters(letters.map(l => l.id === letter.id ? { ...l, isVault: newVaultStatus } : l));
    try {
      const res = await fetch('/api/vault', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: letter.id, isVault: newVaultStatus, type: 'letter' })
      });
      if (!res.ok) {
        setLetters(letters.map(l => l.id === letter.id ? { ...l, isVault: letter.isVault } : l));
        toast.show('שגיאה בשמירה לתיבה', 'error');
      } else {
        toast.show(newVaultStatus ? 'נשמר בדברים המיוחדים' : 'הוסר מהדברים המיוחדים', 'success');
      }
    } catch (error) {
      console.error(error);
      setLetters(letters.map(l => l.id === letter.id ? { ...l, isVault: letter.isVault } : l));
    }
  };

  const renderMediaPreview = () => {
    if (mediaUrls.length === 0) return null;
    const audioMedia = mediaUrls.find(m => m.type === 'audio');
    return (
      <div style={{ marginTop: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {mediaUrls.map((media, idx) => {
            return (
              <div key={idx} style={{position: 'relative', display: 'inline-block'}}>
                {media.type === 'image' && <img src={media.url} alt="Uploaded" style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px'}} />}
                <button type="button" onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))} style={{position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: 24, height: 24, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>X</button>
              </div>
            );
          })}
        </div>
        {audioMedia && audioMedia.file && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => handleTranscribeAll('basic')} disabled={isRecording} style={{padding: '8px', borderRadius: '8px', background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', flex: 1}}>
              {isRecording ? 'מעבד...' : 'תמלול רגיל'}
            </button>
            <button type="button" onClick={() => handleTranscribeAll('smart')} disabled={isRecording} style={{padding: '8px', borderRadius: '8px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', flex: 1}}>
              {isRecording ? 'מעבד...' : 'תמלול חכם'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>מה כתבו לי</h1>
        <p>מילים טובות מהחברים והצוות</p>
      </header>

      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button 
          onClick={() => setIsComposing(!isComposing)}
          style={{ padding: '10px 20px', borderRadius: '20px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          {isComposing ? 'ביטול' : 'כתוב מכתב חדש'}
        </button>
      </div>

      {isComposing && (
        <form onSubmit={handleSend} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', marginBottom: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>למי תרצה לכתוב?</label>
            <select 
              value={selectedUser} 
              onChange={e => setSelectedUser(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
              required
            >
              <option value="">-- בחר/י --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>תוכן המכתב</label>
            <div style={{ position: 'relative' }}>
              <textarea 
                value={letterContent}
                onChange={e => setLetterContent(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '100px' }}
              />
              <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
                <EmojiPickerButton onEmojiClick={(emoji) => setLetterContent(prev => prev + emoji)} />
              </div>
            </div>
          </div>

          {aiThought && (
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '10px', borderLeft: '4px solid var(--primary-color)' }}>
              <span style={{color: 'var(--primary-color)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px'}}>
                <Sparkles size={16} /> עצה מה-AI לתוספת אישית:
              </span>
              <p style={{fontSize: '14px', margin: '5px 0 0'}}>{aiThought}</p>
            </div>
          )}

          {renderMediaPreview()}

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', marginBottom: '15px'}}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={!selectedUser || (!letterContent && mediaUrls.length === 0)} style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#3b82f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="שלח מכתב">
                <Send size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <AudioRecorder 
                onRecordingComplete={(media) => setMediaUrls([...mediaUrls, media])} 
                customButton={
                  <button type="button" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="הקלט קול" disabled={isRecording}>
                    <Mic size={20} />
                  </button>
                }
              />
              <label style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="הוסף תמונה">
                <ImageIcon size={20} />
                <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => {
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
                }} />
              </label>
            </div>
          </div>
        </form>
      )}

      <div className={styles.lettersList}>
        {isLoading ? (
          <p>טוען מכתבים...</p>
        ) : letters.length > 0 ? (
          letters.map(letter => (
            <div key={letter.id} className={styles.letterCard}>
              <div className={styles.letterHeader}>
                <div className={styles.senderInfo}>
                  <User size={18} className={styles.senderIcon} />
                  <span className={styles.senderName}>{letter.author?.fullName || 'חבר אנונימי'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span className={styles.letterDate}>{new Date(letter.createdAt).toLocaleDateString('he-IL')}</span>
                  <button 
                    onClick={() => handleSaveToVault(letter)} 
                    style={{ background: 'none', border: 'none', padding: '0', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title={letter.isVault ? "הסר מדברים מיוחדים" : "שמור בדברים מיוחדים"}
                  >
                    <Star size={20} fill={letter.isVault ? '#f59e0b' : 'none'} color={letter.isVault ? '#f59e0b' : '#94a3b8'} />
                  </button>
                </div>
              </div>
              <p className={styles.letterBody}>"{letter.content}"</p>

              {letter.mediaUrls && letter.mediaUrls.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                  {letter.mediaUrls.map((media, idx) => (
                    media.type === 'image' && <img key={idx} src={media.url} alt="Media" style={{width: '100%', maxWidth: '300px', borderRadius: '8px'}} />
                  ))}
                </div>
              )}

              {/* Reactions UI */}
              {Array.isArray(letter.reactions) && letter.reactions.length > 0 && (
                <div style={{ display: 'flex', gap: '5px', marginTop: '10px', flexWrap: 'wrap' }}>
                  {letter.reactions.map((rx, idx) => (
                    <span key={idx} style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '16px', fontSize: '14px' }}>{rx}</span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                <EmojiPickerButton onEmojiClick={(emoji) => handleAddReaction(letter.id, emoji)} />
                {letter.authorId && (
                  <button 
                    onClick={() => {
                      setSelectedUser(letter.authorId);
                      setIsComposing(true);
                      setLetterContent(`בתגובה למכתבך מהתאריך ${new Date(letter.createdAt).toLocaleDateString('he-IL')}:\n\n`);
                      window.scrollTo(0, 0);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', fontWeight: 'bold' }}
                  >
                    <Reply size={16} /> השב
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <Heart size={40} color="#cbd5e0" />
            <p>עדיין אין מכתבים. אבל הם יגיעו!</p>
          </div>
        )}
      </div>
    </div>
  );
}
