'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Phone, Shield } from 'lucide-react';
import styles from './login.module.css';
import { ThemeContext } from '@/components/ThemeProvider';

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useContext(ThemeContext) || {};

  useEffect(() => {
    if (searchParams.get('error') === 'suspended') {
      setError('חשבונך ננעל ע"י מנהל המערכת. נא פנה למחנך או למנהל.');
    }
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, password })
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect based on role with full reload to ensure middleware gets the cookie
        if (data.user.role === 'admin') window.location.href = '/admin';
        else if (data.user.role === 'staff') window.location.href = '/staff';
        else window.location.href = '/'; // Student dashboard
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'שגיאה בהתחברות. ודא שהפרטים תקינים.');
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
          {theme.logoUrl ? (
            <img src={theme.logoUrl} alt="Institution Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '10px' }} />
          ) : (
            <Shield size={60} color="var(--primary-color)" style={{ marginBottom: '10px' }} />
          )}
          <h2 style={{ fontSize: '24px', color: 'var(--primary-color)' }}>{theme.schoolName || 'יומן מסע אישי'}</h2>
          
          <p style={{ margin: '10px 0 0 0', color: '#64748b' }}>התחברות למערכת</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <div style={{position: 'relative', marginBottom: '15px'}}>
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

          <div style={{position: 'relative', marginBottom: '20px'}}>
            <input 
              type="password" 
              placeholder="סיסמא" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', 
                padding: '15px 15px 15px 15px', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0',
                fontSize: '16px',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {error && <div style={{color: '#e53e3e', marginBottom: '15px', fontSize: '14px'}}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '40px', gap: '15px' }}>
            <button 
              type="submit" 
              disabled={isLoading || !phoneNumber || !password}
              style={{
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                padding: 0,
                cursor: (isLoading || !phoneNumber || !password) ? 'not-allowed' : 'pointer',
                width: '120px',
                height: '120px',
                position: 'relative',
                boxShadow: '0 8px 20px rgba(0,0,0,0.2), 0 -3px 10px rgba(255,255,255,0.8) inset, 0 5px 15px rgba(0,0,0,0.1) inset',
                transition: 'transform 0.15s, box-shadow 0.15s',
                opacity: (isLoading || !phoneNumber || !password) ? 0.6 : 1,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseDown={e => { if (!isLoading && phoneNumber && password) { e.currentTarget.style.transform = 'scale(0.95)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)'; } }}
              onMouseUp={e => { if (!isLoading && phoneNumber && password) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2), 0 -3px 10px rgba(255,255,255,0.8) inset, 0 5px 15px rgba(0,0,0,0.1) inset'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2), 0 -3px 10px rgba(255,255,255,0.8) inset, 0 5px 15px rgba(0,0,0,0.1) inset'; }}
            >
              <img src="/app-logo.png" alt="App Icon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              
              {/* Overlay Text */}
              <div style={{
                position: 'absolute',
                bottom: '15px',
                left: 0,
                right: 0,
                textAlign: 'center',
                color: 'white',
                fontSize: '18px',
                fontWeight: '800',
                textShadow: '0px 2px 4px rgba(0,0,0,0.9), 0px 0px 8px rgba(0,0,0,0.6)',
                letterSpacing: '1px',
                pointerEvents: 'none'
              }}>
                {isLoading ? '...' : 'כניסה'}
              </div>
            </button>
          </div>
        </form>
        
        <p style={{textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b'}}>
          * ההתחברות באמצעות מספר הפלאפון כפי שהוזן על ידי צוות המוסד.
        </p>
      </div>
    </div>
  );
}
