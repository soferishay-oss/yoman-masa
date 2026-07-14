'use client';

import { useState, useEffect } from 'react';
import { Heart, User } from 'lucide-react';
import styles from './letters.module.css';

export default function LettersPage() {
  const [letters, setLetters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLetters();
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>מה כתבו לי</h1>
        <p>מילים טובות מהחברים והצוות</p>
      </header>

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
