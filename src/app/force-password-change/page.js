'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export default function ForcePasswordChangePage() {
  const router = useRouter();
  const toast = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation: 6-8 characters, letters and numbers only
    const regex = /^[A-Za-z0-9א-ת]{6,8}$/;
    if (!regex.test(newPassword)) {
      toast.show('הסיסמה חייבת להיות בין 6 ל-8 תווים, ולהכיל אותיות וספרות בלבד', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.show('הסיסמאות אינן תואמות', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/user/force-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });

      if (res.ok) {
        toast.show('הסיסמה עודכנה בהצלחה!', 'success');
        window.location.href = '/';
      } else {
        const error = await res.json();
        toast.show(error.error || 'אירעה שגיאה בעדכון הסיסמה.', 'error');
      }
    } catch (error) {
      toast.show('שגיאת תקשורת.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: '#f8fafc'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: '#dbeafe',
          color: '#3b82f6',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}>
          <Lock size={32} />
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px' }}>
          אבטחת החשבון שלך
        </h1>
        <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '30px', lineHeight: '1.6' }}>
          זיהינו שאתה עדיין משתמש בסיסמת ברירת המחדל. למען האבטחה והפרטיות של המידע שלך ביומן המסע, עליך לבחור סיסמה אישית חדשה.
        </p>
        
        <div style={{
          background: '#f1f5f9',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'right',
          marginBottom: '30px',
          fontSize: '14px',
          color: '#475569',
        }}>
          <ul style={{ paddingRight: '20px', margin: 0, listStyleType: 'disc' }}>
            <li>הסיסמה חייבת להיות באורך של <strong>6 עד 8 תווים</strong>.</li>
            <li>ניתן להשתמש ב<strong>אותיות (עברית/אנגלית) וספרות</strong>.</li>
            <li>אין צורך בתווים מיוחדים.</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} style={{ textAlign: 'right' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>סיסמה חדשה</label>
            <input 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="הקלד סיסמה חדשה"
              style={{
                width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                fontSize: '16px', outline: 'none', transition: 'border 0.2s', direction: 'ltr'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>אימות סיסמה</label>
            <input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="הקלד את הסיסמה שוב"
              style={{
                width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                fontSize: '16px', outline: 'none', transition: 'border 0.2s', direction: 'ltr'
              }}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !newPassword || !confirmPassword}
            style={{
              width: '100%',
              padding: '14px',
              background: (isSubmitting || !newPassword || !confirmPassword) ? '#cbd5e1' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: (isSubmitting || !newPassword || !confirmPassword) ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isSubmitting ? 'מעדכן...' : 'עדכן סיסמה והיכנס למערכת'}
            {!isSubmitting && <ArrowLeft size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
