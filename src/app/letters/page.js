'use client';

import { Heart, User } from 'lucide-react';
import styles from './letters.module.css';

export default function LettersPage() {
  const letters = [
    {
      id: 1,
      sender: 'דוד המדריך',
      date: '10.06.25',
      content: 'ישראל, היה מדהים לראות את ההתקדמות שלך במסע האחרון. הוכחת מנהיגות שקטה ויכולת הקשבה נדירה. תמשיך ככה!'
    },
    {
      id: 2,
      sender: 'חבר אנונימי',
      date: '28.05.25',
      content: 'תודה על העזרה השבוע בניווטים. לא הייתי מסתדר בלעדיך.'
    }
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>מה כתבו לי</h1>
        <p>מילים טובות מהחברים והצוות</p>
      </header>

      <div className={styles.lettersList}>
        {letters.length > 0 ? (
          letters.map(letter => (
            <div key={letter.id} className={styles.letterCard}>
              <div className={styles.letterHeader}>
                <div className={styles.senderInfo}>
                  <User size={18} className={styles.senderIcon} />
                  <span className={styles.senderName}>{letter.sender}</span>
                </div>
                <span className={styles.letterDate}>{letter.date}</span>
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
