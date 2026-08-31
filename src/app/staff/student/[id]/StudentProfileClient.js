'use client';

import { useState } from 'react';
import { BellPlus } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export default function StudentProfileClient({ studentId }) {
  const [isTriggering, setIsTriggering] = useState(false);
  const toast = useToast();

  const handleTrigger = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch('/api/staff/moods/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });
      if (res.ok) {
        if (toast?.show) toast.show('שאלון נשלח בהצלחה לתלמיד!', 'success');
        else alert('שאלון נשלח בהצלחה לתלמיד!');
      } else {
        if (toast?.show) toast.show('שגיאה בשליחת השאלון', 'error');
        else alert('שגיאה בשליחת השאלון');
      }
    } catch (e) {
      console.error(e);
      if (toast?.show) toast.show('שגיאה בשליחת השאלון', 'error');
    } finally {
      setIsTriggering(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm('האם אתה בטוח שברצונך לאפס את הסיסמה של התלמיד ל-123456? התלמיד יידרש להחליף סיסמה בהתחברות הבאה.')) return;
    
    try {
      const res = await fetch(`/api/staff/student/${studentId}/reset-password`, {
        method: 'POST'
      });
      if (res.ok) {
        if (toast?.show) toast.show('הסיסמה אופסה בהצלחה ל-123456', 'success');
        else alert('הסיסמה אופסה בהצלחה ל-123456');
      } else {
        if (toast?.show) toast.show('שגיאה באיפוס סיסמה', 'error');
        else alert('שגיאה באיפוס סיסמה');
      }
    } catch (e) {
      console.error(e);
      if (toast?.show) toast.show('שגיאה באיפוס סיסמה', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <button 
        onClick={handleResetPassword}
        style={{
          background: '#ef4444',
          color: 'white',
          border: 'none',
          padding: '10px 15px',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          fontWeight: 'bold'
        }}
        title="איפוס סיסמה ל-123456"
      >
        איפוס סיסמה
      </button>
      <button 
        onClick={handleTrigger}
        disabled={isTriggering}
        style={{
          background: 'var(--primary-color)',
          color: 'white',
          border: 'none',
          padding: '10px 15px',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 'bold'
        }}
      >
        <BellPlus size={18} />
        {isTriggering ? 'משגר...' : 'בקש מדד מצב רוח'}
      </button>
    </div>
  );
}
