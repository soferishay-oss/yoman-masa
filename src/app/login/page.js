'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Phone } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect based on role with full reload to ensure middleware gets the cookie
        if (data.user.role === 'admin') window.location.href = '/admin';
        else if (data.user.role === 'staff') window.location.href = '/staff';
        else window.location.href = '/'; // Student dashboard
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'שגיאה בהתחברות. ודא שהמספר תקין או פנה למדריך.');
      }
    } catch (err) {
      console.error(err);
      setError('שגיאת רשת. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2>יומן מסע אישי</h2>
          <p>התחברות למערכת</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <div style={{position: 'relative', marginBottom: '20px'}}>
            <Phone size={20} style={{position: 'absolute', right: '15px', top: '15px', color: '#94a3b8'}} />
            <input 
              type="tel" 
              placeholder="הזן מספר פלאפון" 
              value={phoneNumber} 
              onChange={e => setPhoneNumber(e.target.value)}
              required
              style={{
                width: '100%', 
                padding: '15px 45px 15px 15px', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0',
                fontSize: '16px',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {error && <div style={{color: '#e53e3e', marginBottom: '15px', fontSize: '14px'}}>{error}</div>}

          <button 
            type="submit" 
            className={styles.loginBtn}
            disabled={isLoading || !phoneNumber}
          >
            <LogIn size={20} />
            {isLoading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>
        
        <p style={{textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b'}}>
          * ההתחברות באמצעות מספר הפלאפון כפי שהוזן על ידי צוות המוסד.
        </p>
      </div>
    </div>
  );
}
