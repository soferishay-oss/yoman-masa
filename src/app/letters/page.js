'use client';

import { useState, useEffect } from 'react';
import { Heart, User, Image as ImageIcon, Video, Mic, Sparkles } from 'lucide-react';
import styles from './letters.module.css';

export default function LettersPage() {
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

  const handleSimulateMediaUpload = (type) => {
    if (type === 'image') {
      setMediaUrls([...mediaUrls, { type: 'image', url: 'https://via.placeholder.com/400x300.png?text=Simulated+Letter+Image' }]);
    } else {
      setMediaUrls([...mediaUrls, { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4' }]);
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
            setLetterContent(prev => prev ? prev + '\n' + data.smartText : data.smartText);
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
        alert('המכתב נשלח בהצלחה!');
        setIsComposing(false);
        setLetterContent('');
        setSelectedUser('');
        setMediaUrls([]);
        setAiThought('');
        setAiTranscription('');
        fetchLetters();
      } else {
        alert('שגיאה בשליחת המכתב');
      }
    } catch (error) {
      console.error(error);
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
            <textarea 
              value={letterContent}
              onChange={e => setLetterContent(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '100px' }}
            />
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

          <div style={{display: 'flex', gap: '10px', marginTop: '10px', marginBottom: '15px'}}>
            <button type="button" onClick={() => handleSimulateMediaUpload('image')} style={{padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>
              <ImageIcon size={18} /> תמונה
            </button>
            <button type="button" onClick={() => handleSimulateMediaUpload('video')} style={{padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>
              <Video size={18} /> וידאו
            </button>
            <button type="button" onClick={handleSimulateAudioRecording} disabled={isRecording} style={{padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: isRecording ? '#fee2e2' : 'white', color: isRecording ? '#ef4444' : 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>
              <Mic size={18} /> {isRecording ? 'מקליט...' : 'הקלטה'}
            </button>
          </div>

          <button type="submit" disabled={!selectedUser || (!letterContent && mediaUrls.length === 0)} style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer' }}>
            שלח מכתב
          </button>
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
                <span className={styles.letterDate}>{new Date(letter.createdAt).toLocaleDateString('he-IL')}</span>
              </div>
              <p className={styles.letterBody}>"{letter.content}"</p>

              {letter.mediaUrls && letter.mediaUrls.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                  {letter.mediaUrls.map((media, idx) => (
                    media.type === 'image' ? 
                      <img key={idx} src={media.url} alt="Media" style={{width: '100%', maxWidth: '300px', borderRadius: '8px'}} /> :
                      <video key={idx} src={media.url} controls style={{width: '100%', maxWidth: '300px', borderRadius: '8px'}} />
                  ))}
                </div>
              )}
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
