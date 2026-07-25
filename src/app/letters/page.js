'use client';

import { useState, useEffect } from 'react';
import { Heart, User, Image as ImageIcon, Mic, Reply, Star, Send, Search, ChevronDown, ChevronUp } from 'lucide-react';
import AppDate, { formatAppDateString } from '@/components/AppDate';
import styles from './letters.module.css';
import { useToast } from '@/components/ToastProvider';
import AudioRecorder from '@/components/AudioRecorder';
import EmojiPickerButton from '@/components/EmojiPickerButton';

export default function LettersPage() {
  const toast = useToast();
  const [inboxLetters, setInboxLetters] = useState([]);
  const [outboxLetters, setOutboxLetters] = useState([]);
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' or 'outbox'
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComposing, setIsComposing] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [letterContent, setLetterContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [filterType, setFilterType] = useState('my_groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [letterSearchQuery, setLetterSearchQuery] = useState('');
  const [expandedThreads, setExpandedThreads] = useState({});
  const [replyParentId, setReplyParentId] = useState(null);

  const filteredUsers = users.filter(u => {
    if (searchQuery && !u.fullName.includes(searchQuery)) return false;
    if (filterType === 'my_groups') return u.sharesGroup && u.role === 'student';
    if (filterType === 'staff') return ['admin', 'staff', 'teacher', 'owner'].includes(u.role);
    if (filterType === 'all') return u.role === 'student';
    return true;
  });

  useEffect(() => {
    fetchLetters();
    fetchUsers();
  }, []);

  const fetchLetters = async () => {
    try {
      const res = await fetch('/api/letters');
      if (res.ok) {
        const data = await res.json();
        setInboxLetters(data.received || []);
        setOutboxLetters(data.sent || []);
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
          parentId: replyParentId
        })
      });
      if (res.ok) {
        toast.show('המכתב נשלח בהצלחה!', 'success');
        setIsComposing(false);
        setLetterContent('');
        setSelectedUser('');
        setMediaUrls([]);
        setReplyParentId(null);
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

  const handleTranscribe = async () => {
    setIsRecording(true);
    try {
      const audioFiles = mediaUrls.filter(m => m.type === 'audio' && m.file).map(m => m.file);
      if (audioFiles.length === 0) return;

      let combinedBasic = '';

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
            toast.show(data.basicText, 'error');
            setIsRecording(false);
            return;
          }
          combinedBasic += (combinedBasic ? '\n\n' : '') + (data.basicText || '');
        }
      }

      setLetterContent(prev => prev ? prev + '\n' + combinedBasic : combinedBasic);
      toast.show('ההקלטה תומללה בהצלחה', 'success');
      // Remove audio files from mediaUrls after transcription so they don't upload
      setMediaUrls(prev => prev.filter(m => m.type !== 'audio'));
    } catch (err) {
      console.error(err);
      toast.show('שגיאה בתמלול', 'error');
    } finally {
      setIsRecording(false);
    }
  };

  const handleAddReaction = async (letterId, emoji, isInbox) => {
    const lettersList = isInbox ? inboxLetters : outboxLetters;
    const letter = lettersList.find(l => l.id === letterId);
    if (!letter) return;
    
    let currentReactions = Array.isArray(letter.reactions) ? letter.reactions : [];
    const newReactions = [...currentReactions, emoji];

    if (isInbox) {
      setInboxLetters(inboxLetters.map(l => l.id === letterId ? { ...l, reactions: newReactions } : l));
    } else {
      setOutboxLetters(outboxLetters.map(l => l.id === letterId ? { ...l, reactions: newReactions } : l));
    }
    
    try {
      const res = await fetch(`/api/letters/${letterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactions: newReactions })
      });
      if (!res.ok) {
        toast.show('שגיאה בהוספת תגובה', 'error');
        if (isInbox) {
          setInboxLetters(inboxLetters.map(l => l.id === letterId ? { ...l, reactions: currentReactions } : l));
        } else {
          setOutboxLetters(outboxLetters.map(l => l.id === letterId ? { ...l, reactions: currentReactions } : l));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveToVault = async (letter, isInbox) => {
    const newVaultStatus = !letter.isVault;
    if (isInbox) {
      setInboxLetters(inboxLetters.map(l => l.id === letter.id ? { ...l, isVault: newVaultStatus } : l));
    } else {
      setOutboxLetters(outboxLetters.map(l => l.id === letter.id ? { ...l, isVault: newVaultStatus } : l));
    }
    try {
      const res = await fetch('/api/vault', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: letter.id, isVault: newVaultStatus, type: 'letter' })
      });
      if (!res.ok) {
        if (isInbox) {
          setInboxLetters(inboxLetters.map(l => l.id === letter.id ? { ...l, isVault: letter.isVault } : l));
        } else {
          setOutboxLetters(outboxLetters.map(l => l.id === letter.id ? { ...l, isVault: letter.isVault } : l));
        }
        toast.show('שגיאה בשמירה לתיבה', 'error');
      } else {
        toast.show(newVaultStatus ? 'נשמר בדברים המיוחדים' : 'הוסר מהדברים המיוחדים', 'success');
      }
    } catch (error) {
      console.error(error);
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
                {media.type === 'audio' && <div style={{width: '100px', height: '100px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px'}}><Mic size={24} color="#64748b" /></div>}
                <button type="button" onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))} style={{position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: 24, height: 24, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>X</button>
              </div>
            );
          })}
        </div>
        {audioMedia && audioMedia.file && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => handleTranscribe()} disabled={isRecording} style={{padding: '8px', borderRadius: '8px', background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', flex: 1}}>
              {isRecording ? 'מתמלל...' : 'הפוך הקלטה לטקסט'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderLetterNode = (letter, isInbox, isReply = false) => {
    const isExpanded = expandedThreads[letter.id];
    
    // Filter by search query
    if (letterSearchQuery) {
      const term = letterSearchQuery.toLowerCase();
      const contentMatch = letter.content?.toLowerCase().includes(term);
      const authorMatch = letter.author?.fullName?.toLowerCase().includes(term);
      const recipientMatch = letter.recipient?.fullName?.toLowerCase().includes(term);
      
      // If none match, and we are at the top level, don't render. 
      // We still render replies if the parent matches.
      if (!isReply && !contentMatch && !authorMatch && !recipientMatch) {
        return null;
      }
    }

    const firstSentence = letter.content ? (letter.content.split(/[.\n]/)[0].substring(0, 50) + '...') : '';

    return (
      <div key={letter.id} className={styles.letterCard} style={{ marginLeft: isReply ? '20px' : '0', background: isReply ? '#f8fafc' : (isInbox ? '#ffffff' : '#f0fdf4'), border: isInbox ? 'none' : '1px solid #bbf7d0' }}>
        
        {!isExpanded && !isReply ? (
          <div onClick={() => setExpandedThreads({...expandedThreads, [letter.id]: true})} style={{ cursor: 'pointer', padding: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                {isInbox ? `מאת: ${letter.author?.fullName || 'חבר אנונימי'}` : `אל: ${letter.recipient?.fullName || 'חבר אנונימי'}`}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}><AppDate date={letter.createdAt} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
              <p style={{ margin: 0, color: '#475569', fontSize: '14px' }}>{firstSentence}</p>
              <ChevronDown size={20} color="#94a3b8" />
            </div>
          </div>
        ) : (
          <>
            {!isReply && (
              <div onClick={() => setExpandedThreads({...expandedThreads, [letter.id]: false})} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <ChevronUp size={20} color="#94a3b8" />
              </div>
            )}
            <div className={styles.letterHeader}>
              <div className={styles.senderInfo}>
                <User size={18} className={styles.senderIcon} />
                <span className={styles.senderName}>
                  {isInbox ? `מאת: ${letter.author?.fullName || 'חבר אנונימי'}` : `נשלח אל: ${letter.recipient?.fullName || 'חבר אנונימי'}`}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span className={styles.letterDate}><AppDate date={letter.createdAt} /></span>
                <button 
                  onClick={() => handleSaveToVault(letter, isInbox)} 
                  style={{ background: 'none', border: 'none', padding: '0', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title={letter.isVault ? "הסר מדברים מיוחדים" : "שמור בדברים מיוחדים"}
                >
                  <Star size={20} fill={letter.isVault ? '#f59e0b' : 'none'} color={letter.isVault ? '#f59e0b' : '#94a3b8'} />
                </button>
              </div>
            </div>
            <p className={styles.letterBody} style={{ whiteSpace: 'pre-wrap' }}>{letter.content}</p>

            {letter.mediaUrls && letter.mediaUrls.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                {letter.mediaUrls.map((media, idx) => (
                  media.type === 'image' && <img key={idx} src={media.url} alt="Media" style={{width: '100%', maxWidth: '300px', borderRadius: '8px'}} />
                ))}
              </div>
            )}

            {Array.isArray(letter.reactions) && letter.reactions.length > 0 && (
              <div style={{ display: 'flex', gap: '5px', marginTop: '10px', flexWrap: 'wrap' }}>
                {letter.reactions.map((rx, idx) => (
                  <span key={idx} style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '16px', fontSize: '14px' }}>{rx}</span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
              <EmojiPickerButton onEmojiClick={(emoji) => handleAddReaction(letter.id, emoji, isInbox)} />
              {(letter.authorId || letter.recipientId) && (
                <button 
                  onClick={() => {
                    const recipient = isInbox ? letter.authorId : letter.recipientId;
                    setSelectedUser(recipient);
                    setReplyParentId(letter.id);
                    setIsComposing(true);
                    setLetterContent(''); // Clean reply
                    window.scrollTo(0, 0);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', fontWeight: 'bold' }}
                >
                  <Reply size={16} /> השב
                </button>
              )}
            </div>

            {/* Render Replies recursively */}
            {letter.replies && letter.replies.length > 0 && (
              <div style={{ marginTop: '15px', borderRight: '2px solid #e2e8f0', paddingRight: '15px' }}>
                {letter.replies.map(reply => renderLetterNode(reply, reply.recipientId === (isInbox ? letter.recipientId : letter.authorId), true))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const activeLetters = activeTab === 'inbox' ? inboxLetters : outboxLetters;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>מה כתבו לי</h1>
        <p>מילים טובות מהחברים והצוות</p>
      </header>

      <div style={{ marginBottom: '20px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button 
          onClick={() => { setIsComposing(!isComposing); setReplyParentId(null); setSelectedUser(''); setLetterContent(''); setMediaUrls([]); }}
          style={{ padding: '10px 20px', borderRadius: '20px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          {isComposing ? 'ביטול כתיבה' : 'כתוב מכתב חדש'}
        </button>
      </div>

      {isComposing && (
        <form onSubmit={handleSend} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', marginBottom: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          {replyParentId && (
            <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '8px', marginBottom: '15px', color: '#b45309', fontSize: '14px', fontWeight: 'bold' }}>
              כותב תגובה לשרשור
            </div>
          )}
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>{replyParentId ? 'נמען התגובה:' : 'למי תרצה לכתוב?'}</label>
            
            {!selectedUser ? (
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <button type="button" onClick={() => setFilterType('my_groups')} style={{ flex: 1, padding: '8px', borderRadius: '20px', border: '1px solid var(--primary-color)', background: filterType === 'my_groups' ? 'var(--primary-color)' : 'white', color: filterType === 'my_groups' ? 'white' : 'var(--primary-color)', cursor: 'pointer' }}>מהקבוצות שלי</button>
                  <button type="button" onClick={() => setFilterType('all')} style={{ flex: 1, padding: '8px', borderRadius: '20px', border: '1px solid var(--primary-color)', background: filterType === 'all' ? 'var(--primary-color)' : 'white', color: filterType === 'all' ? 'white' : 'var(--primary-color)', cursor: 'pointer' }}>כולם</button>
                  <button type="button" onClick={() => setFilterType('staff')} style={{ flex: 1, padding: '8px', borderRadius: '20px', border: '1px solid var(--primary-color)', background: filterType === 'staff' ? 'var(--primary-color)' : 'white', color: filterType === 'staff' ? 'white' : 'var(--primary-color)', cursor: 'pointer' }}>צוות</button>
                </div>
                
                <input 
                  type="text" 
                  placeholder="חיפוש לפי שם..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '15px' }}
                />
                
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}>
                  {filteredUsers.length > 0 ? filteredUsers.map(u => (
                    <div 
                      key={u.id} 
                      onClick={() => setSelectedUser(u.id)}
                      style={{ padding: '10px 15px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                    >
                      {u.fullName} {u.role !== 'student' && `(${u.role})`}
                    </div>
                  )) : (
                    <div style={{ padding: '15px', textAlign: 'center', color: '#94a3b8' }}>לא נמצאו תוצאות</div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eff6ff', padding: '12px 15px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>
                  {users.find(u => u.id === selectedUser)?.fullName || 'טוען נמען...'}
                </span>
                {!replyParentId && (
                  <button type="button" onClick={() => setSelectedUser('')} style={{ background: 'none', border: 'none', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }}>שנה נמען</button>
                )}
              </div>
            )}
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>תוכן המכתב</label>
            <div style={{ position: 'relative' }}>
              <textarea 
                value={letterContent}
                onChange={e => setLetterContent(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '100px' }}
                placeholder="כתוב כאן הודעה לחבר..."
              />
              <div style={{ position: 'absolute', bottom: '10px', left: '10px' }}>
                <EmojiPickerButton onEmojiClick={(emoji) => setLetterContent(prev => prev + emoji)} />
              </div>
            </div>
          </div>

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
                  <button type="button" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="הקלט קול ותמלל" disabled={isRecording}>
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

      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
        <button 
          onClick={() => setActiveTab('inbox')}
          style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: activeTab === 'inbox' ? '3px solid var(--primary-color)' : 'none', color: activeTab === 'inbox' ? 'var(--primary-color)' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
        >
          מכתבים נכנסים
        </button>
        <button 
          onClick={() => setActiveTab('outbox')}
          style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: activeTab === 'outbox' ? '3px solid var(--primary-color)' : 'none', color: activeTab === 'outbox' ? 'var(--primary-color)' : '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
        >
          מכתבים ששלחתי
        </button>
      </div>

      {/* Search Letters */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="חפש במכתבים (לפי שם, תאריך או תוכן)..." 
          value={letterSearchQuery}
          onChange={(e) => setLetterSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '10px 40px 10px 10px', borderRadius: '20px', border: '1px solid #cbd5e1' }}
        />
        <Search size={18} color="#94a3b8" style={{ position: 'absolute', right: '15px', top: '12px' }} />
      </div>

      <div className={styles.lettersList}>
        {isLoading ? (
          <p style={{ textAlign: 'center' }}>טוען מכתבים...</p>
        ) : activeLetters.length > 0 ? (
          activeLetters.map(letter => renderLetterNode(letter, activeTab === 'inbox'))
        ) : (
          <div className={styles.emptyState}>
            <Heart size={40} color="#cbd5e0" />
            <p>{activeTab === 'inbox' ? 'עדיין אין מכתבים נכנסים.' : 'עוד לא שלחת מכתבים.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
