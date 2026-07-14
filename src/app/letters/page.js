'use client';

import { useState, useEffect } from 'react';
import { Heart, User } from 'lucide-react';
import styles from './letters.module.css';

export default function LettersPage() {
  const [letters, setLetters] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComposing, setIsComposing] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [letterContent, setLetterContent] = useState('');

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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedUser || !letterContent) return;

    try {
      const res = await fetch('/api/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: selectedUser, content: letterContent })
      });
      if (res.ok) {
        alert('המכתב נשלח בהצלחה!');
        setIsComposing(false);
        setLetterContent('');
        setSelectedUser('');
      } else {
        alert('שגיאה בשליחת המכתב');
      }
    } catch (error) {
      console.error(error);
    }
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
              required
            />
          </div>
          <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer' }}>
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
