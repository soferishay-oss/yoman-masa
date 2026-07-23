'use client';

import { useState, useEffect } from 'react';
import { Map, Save } from 'lucide-react';
import styles from '../dashboard.module.css';

export default function GuidanceTrackPage() {
  const [guidanceTrack, setGuidanceTrack] = useState('documentation_only');
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    fetchTenant();
  }, []);

  const fetchTenant = async () => {
    try {
      const res = await fetch('/api/admin/tenant');
      if (res.ok) {
        const data = await res.json();
        if (data.guidanceTrack) setGuidanceTrack(data.guidanceTrack);
      }
    } catch (error) {
      console.error('Failed to fetch tenant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveStatus('שומר...');
    try {
      const res = await fetch('/api/admin/tenant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guidanceTrack }) 
      });
      if (res.ok) {
        setSaveStatus('מסלול הליווי נשמר בהצלחה!');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setSaveStatus('שגיאה בשמירה: ' + (errData.error || res.statusText));
      }
    } catch (error) {
      console.error(error);
      setSaveStatus('שגיאה בתקשורת');
    }
  };

  if (isLoading) {
    return <div className={styles.container}><p style={{padding:'20px'}}>טוען הגדרות מוסד...</p></div>;
  }

  return (
    <div style={{display:'flex', flexDirection:'column', gap:'32px'}}>
      <header>
        <h1 style={{fontSize:'2rem', margin:'0 0 8px 0'}}>מסלול ליווי חינוכי</h1>
        <p style={{color:'#64748b', margin:0}}>
          בחר את האופן שבו המערכת תשתלב בתהליך החינוכי של המוסד. בחירת מסלול משפיעה על הכלים והאפשרויות הזמינות לצוות ולתלמידים.
        </p>
      </header>

      <section className={styles.section}>
        <div className={styles.card}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <label style={{ 
              display: 'flex', gap: '15px', alignItems: 'flex-start', padding: '15px', 
              border: guidanceTrack === 'documentation_only' ? '2px solid var(--primary-color)' : '1px solid #cbd5e1',
              borderRadius: '8px', cursor: 'pointer', backgroundColor: guidanceTrack === 'documentation_only' ? 'var(--primary-light)' : 'transparent'
            }}>
              <input 
                type="radio" 
                name="guidanceTrack" 
                value="documentation_only" 
                checked={guidanceTrack === 'documentation_only'} 
                onChange={(e) => setGuidanceTrack(e.target.value)} 
                style={{ marginTop: '5px' }} 
              />
              <div>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>תיעוד בלבד</h3>
                <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  המערכת משמשת כיומן דיגיטלי בלבד. התלמידים יכולים לתעד, ואנשי הצוות יכולים לקרוא את התוכן. המערכת אינה יוצרת שאלות, משימות או תהליכי ליווי.
                </p>
              </div>
            </label>

            <label style={{ 
              display: 'flex', gap: '15px', alignItems: 'flex-start', padding: '15px', 
              border: guidanceTrack === 'manual' ? '2px solid var(--primary-color)' : '1px solid #cbd5e1',
              borderRadius: '8px', cursor: 'pointer', backgroundColor: guidanceTrack === 'manual' ? 'var(--primary-light)' : 'transparent'
            }}>
              <input 
                type="radio" 
                name="guidanceTrack" 
                value="manual" 
                checked={guidanceTrack === 'manual'} 
                onChange={(e) => setGuidanceTrack(e.target.value)} 
                style={{ marginTop: '5px' }} 
              />
              <div>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>ליווי ידני</h3>
                <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  הצוות החינוכי אחראי באופן מלא על תהליך הליווי. הוא בונה את הטפסים, השאלות, המשימות ותהליכי הרפלקציה, בעוד שהמערכת מספקת את הכלים לביצוע.
                </p>
              </div>
            </label>

            <label style={{ 
              display: 'flex', gap: '15px', alignItems: 'flex-start', padding: '15px', 
              border: guidanceTrack === 'automatic' ? '2px solid var(--primary-color)' : '1px solid #cbd5e1',
              borderRadius: '8px', cursor: 'pointer', backgroundColor: guidanceTrack === 'automatic' ? 'var(--primary-light)' : 'transparent'
            }}>
              <input 
                type="radio" 
                name="guidanceTrack" 
                value="automatic" 
                checked={guidanceTrack === 'automatic'} 
                onChange={(e) => setGuidanceTrack(e.target.value)} 
                style={{ marginTop: '5px' }} 
              />
              <div>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>ליווי אוטומטי</h3>
                <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  המוסד בוחר מסלול ליווי מתוך מספר מסלולים שהמערכת מציעה. כל מסלול כולל רצף של שאלות, משימות ונקודות עצירה לאורך השנה (בקרוב).
                </p>
              </div>
            </label>

            <label style={{ 
              display: 'flex', gap: '15px', alignItems: 'flex-start', padding: '15px', 
              border: guidanceTrack === 'hybrid' ? '2px solid var(--primary-color)' : '1px solid #cbd5e1',
              borderRadius: '8px', cursor: 'pointer', backgroundColor: guidanceTrack === 'hybrid' ? 'var(--primary-light)' : 'transparent'
            }}>
              <input 
                type="radio" 
                name="guidanceTrack" 
                value="hybrid" 
                checked={guidanceTrack === 'hybrid'} 
                onChange={(e) => setGuidanceTrack(e.target.value)} 
                style={{ marginTop: '5px' }} 
              />
              <div>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>ליווי היברידי</h3>
                <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  מבוסס על מסלול אוטומטי, אך מאפשר לצוות לערוך אותו באופן מלא: להוסיף, למחוק, לשנות ולהזיז שאלות, משימות ושלבים (בקרוב).
                </p>
              </div>
            </label>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className={styles.saveBtn} onClick={handleSave}>
              <Save size={18} style={{display:'inline', verticalAlign:'middle', marginRight:'5px'}} />
              שמור מסלול
            </button>
            {saveStatus && (
              <span style={{ color: saveStatus.includes('שגיאה') ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                {saveStatus}
              </span>
            )}
        </div>
      </section>
    </div>
  );
}
