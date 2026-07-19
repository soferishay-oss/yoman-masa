'use client';

import { useState, useContext, useEffect } from 'react';
import { Settings, Users, Save, Edit } from 'lucide-react';
import styles from '../dashboard.module.css'; // changed to dashboard.module.css since we removed admin.module.css
import { ThemeContext } from '@/components/ThemeProvider';
import { HexColorPicker } from 'react-colorful';

export default function AdminDashboard() {
  const theme = useContext(ThemeContext);
  
  const [schoolName, setSchoolName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor);
  const [dateMode, setDateMode] = useState('hebrew');
  const [institutionType, setInstitutionType] = useState('highschool');
  const [studyYears, setStudyYears] = useState(1);
  const [moderationLevel, setModerationLevel] = useState(3);
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
        setSchoolName(data.name || '');
        setLogoUrl(data.logoUrl || '');
        if (data.slogan) setSlogan(data.slogan);
        if (data.themeConfig?.primaryColor) setPrimaryColor(data.themeConfig.primaryColor);
        if (data.dominantDateMode) setDateMode(data.dominantDateMode);
        if (data.institutionType) setInstitutionType(data.institutionType);
        if (data.studyYears) setStudyYears(data.studyYears);
        if (data.moderationLevel) setModerationLevel(data.moderationLevel);
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
        body: JSON.stringify({ name: schoolName, logoUrl, slogan, primaryColor, dateMode, institutionType, studyYears, moderationLevel }) 
      });
      if (res.ok) {
        setSaveStatus('ההגדרות נשמרו בהצלחה!');
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

  const mockUsers = [
    { id: 1, name: 'ישראל ישראלי', role: 'חניך' },
    { id: 2, name: 'דוד המדריך', role: 'צוות' },
  ];

  if (isLoading) {
    return <div className={styles.container}><p style={{padding:'20px'}}>טוען הגדרות מוסד...</p></div>;
  }

  return (
    <div style={{display:'flex', flexDirection:'column', gap:'32px'}}>
      <header>
        <h1 style={{fontSize:'2rem', margin:'0 0 8px 0'}}>הגדרות מוסד</h1>
        <p style={{color:'#64748b', margin:0}}>הגדרות מערכת למנהלי מוסדות</p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><Settings size={20} style={{display:'inline', verticalAlign:'middle'}}/> הגדרות מיתוג (White-Label)</h2>
        <div className={styles.card}>
          <div className={styles.formGroup}>
            <label>שם המוסד</label>
            <input 
              type="text" 
              className={styles.input} 
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>לוגו מוסד</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="text" 
                className={styles.input} 
                placeholder="כתובת URL לתמונה (או העלה קובץ)"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                style={{ flex: 1 }}
              />
              <label style={{
                padding: '10px 15px', 
                backgroundColor: 'var(--primary-color)', 
                color: 'white', 
                borderRadius: '8px', 
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}>
                העלה קובץ
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // In a real app, upload to S3/Cloudinary and get URL. 
                      // Here we use Base64 for demonstration or a placeholder if too large.
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        setLogoUrl(evt.target.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
            {logoUrl && (
              <div style={{ marginTop: '10px' }}>
                <img src={logoUrl} alt="לוגו מוסד" style={{ maxHeight: '60px', borderRadius: '8px' }} />
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>סלוגן המוסד</label>
            <input 
              type="text" 
              className={styles.input} 
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>צבע ראשי למערכת</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', maxWidth: '200px' }}>
              <HexColorPicker color={primaryColor} onChange={setPrimaryColor} style={{ width: '100%' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '4px', backgroundColor: primaryColor, border: '1px solid #cbd5e1' }}></div>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{ fontFamily: 'monospace', flex: 1 }}
                />
              </div>
            </div>
          </div>
          
          <div style={{marginBottom:'15px'}}>
            <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>סוג המוסד</label>
            <select style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1'}} value={institutionType} onChange={(e) => setInstitutionType(e.target.value)}>
              <option value="elementary">בית ספר יסודי</option>
              <option value="middleschool">חטיבת ביניים</option>
              <option value="highschool">תיכון / ישיבה תיכונית</option>
              <option value="college">מכללה</option>
              <option value="mechina">מכינה קדם צבאית</option>
              <option value="other">אחר</option>
            </select>
          </div>

          <div style={{marginBottom:'15px'}}>
            <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>משך שנות הלימוד במוסד (לדוגמה: למסע רב-שנתי)</label>
            <select style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1'}} value={studyYears} onChange={(e) => setStudyYears(Number(e.target.value))}>
              <option value={1}>שנה אחת</option>
              <option value={2}>שנתיים</option>
              <option value={3}>שלוש שנים</option>
              <option value={4}>ארבע שנים</option>
              <option value={6}>שש שנים</option>
              <option value={8}>שמונה שנים</option>
            </select>
          </div>

          <div style={{marginBottom:'15px'}}>
            <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>תצוגת תאריכים (ברירת מחדל)</label>
            <select style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1'}} value={dateMode} onChange={(e) => setDateMode(e.target.value)}>
              <option value="hebrew">לוח שנה עברי</option>
              <option value="gregorian">לוח שנה לועזי</option>
            </select>
          </div>

          <div style={{marginBottom:'15px'}}>
            <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>רמת סינון לתוכן ה-AI (הודעות/מכתבים)</label>
            <select style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1'}} value={moderationLevel} onChange={(e) => setModerationLevel(Number(e.target.value))}>
              <option value={1}>רמה 1 - מקל מאוד (חוסם רק אלימות קיצונית)</option>
              <option value={2}>רמה 2 - מקל (מתירני לגבי סלנג שגרתי)</option>
              <option value={3}>רמה 3 - מאוזן (ברירת מחדל: חוסם הטרדות וקללות, מאפשר סלנג חיובי)</option>
              <option value={4}>רמה 4 - שמרני (חוסם סלנג גס גם בצחוק)</option>
              <option value={5}>רמה 5 - מחמיר מאוד (אפס סובלנות לכל מילה שלילית או מרומזת)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className={styles.saveBtn} onClick={handleSave}>
              <Save size={18} style={{display:'inline', verticalAlign:'middle', marginRight:'5px'}} />
              שמור שינויים
            </button>
            {saveStatus && (
              <span style={{ color: saveStatus.includes('שגיאה') ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                {saveStatus}
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
