'use client';

import { useState, useEffect } from 'react';
import { Lock, Star, BookOpen, Clock, X } from 'lucide-react';
import styles from '../journal/journal.module.css'; // Reusing journal styles
import { useToast } from '@/components/ToastProvider';

export default function VaultPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchVaultItems();
  }, []);

  const fetchVaultItems = async () => {
    try {
      const res = await fetch('/api/vault');
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromVault = async (id) => {
    const confirmed = await toast.confirm('האם להסיר מכספת הזיכרונות? זה לא ימחק את הפוסט עצמו.');
    if (!confirmed) return;
    try {
      const res = await fetch('/api/vault', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: id, isVault: false })
      });
      if (res.ok) {
        setItems(items.filter(item => item.id !== id));
        toast.show('הוסר מהכספת בהצלחה', 'success');
      } else {
        toast.show('שגיאה בהסרת הפריט', 'error');
      }
    } catch (err) {
      console.error(err);
      toast.show('שגיאה בהסרת הפריט', 'error');
    }
  };

  if (isLoading) return <div style={{padding:'20px'}}>טוען כספת...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
          <div style={{background:'var(--primary-color)', padding:'10px', borderRadius:'12px', color:'white'}}>
            <Lock size={24} />
          </div>
          <h1>כספת הזיכרונות שלך</h1>
        </div>
        <p>כאן שמורים הרגעים והתובנות החשובים ביותר שסימנת לאורך השנה, שייכנסו לספר המסע האישי שלך.</p>
      </header>

      <div className={styles.entriesList}>
        {items.map(item => (
          <div key={item.id} className={styles.entryCard} style={{position: 'relative'}}>
            <button 
              onClick={() => handleRemoveFromVault(item.id)}
              style={{
                position:'absolute', left:'15px', top:'15px', background:'none', border:'none', 
                color:'#94a3b8', cursor:'pointer', padding:'5px'
              }}
              title="הסר מהכספת"
            >
              <X size={20} />
            </button>
            <div className={styles.entryHeader}>
              <h3 className={styles.entryTitle}>{item.title || 'רשומה ללא כותרת'}</h3>
              <div className={styles.entryMeta}>
                <span className={styles.metaItem}>
                  <Clock size={14} />
                  {new Date(item.createdAt).toLocaleDateString('he-IL')}
                </span>
                <span className={styles.metaItem}>
                  <BookOpen size={14} />
                  {item.type === 'journal' ? 'יומן' : item.type === 'letter' ? 'מכתב' : 'סיכום'}
                </span>
              </div>
            </div>
            
            <p className={styles.entryPreview}>
              {item.bodyText?.substring(0, 150) || ''}
              {item.bodyText?.length > 150 ? '...' : ''}
            </p>
            
            <div className={styles.entryFooter}>
              <div className={styles.tagList}>
                <span className={styles.tag} style={{background: 'var(--primary-light)', color: 'var(--primary-color)'}}>
                  <Star size={12} style={{display:'inline', verticalAlign:'middle', marginRight:'3px'}}/> נשמר לכספת
                </span>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className={styles.emptyState}>
            <Lock size={48} className={styles.emptyIcon} style={{opacity: 0.2}} />
            <p>הכספת ריקה. כשאתה קורא מכתב או כותב יומן, סמן אותם כ"שמור לכספת" והם יופיעו כאן.</p>
          </div>
        )}
      </div>
    </div>
  );
}
