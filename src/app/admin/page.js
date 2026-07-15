'use client';

import { useState, useContext, useEffect } from 'react';
import { Settings, Users, Save, Edit } from 'lucide-react';
import styles from './admin.module.css';
import { ThemeContext } from '@/components/ThemeProvider';

export default function AdminDashboard() {
  const theme = useContext(ThemeContext);
  
  const [schoolName, setSchoolName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor);
  const [dateMode, setDateMode] = useState('hebrew');
  const [isLoading, setIsLoading] = useState(true);

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
      }
    } catch (error) {
      console.error('Failed to fetch tenant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/admin/tenant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: schoolName, logoUrl, slogan, primaryColor, dateMode }) 
      });
      if (res.ok) {
        alert('הגדרות נשמרו בהצלחה!');
      } else {
        alert('שגיאה בשמירת הגדרות');
      }
    } catch (error) {
      console.error(error);
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
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>ניהול מוסד</h1>
        <p>הגדרות מערכת למנהלי מוסדות</p>
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
            <div className={styles.colorPickerRow}>
              <input 
                type="color" 
                className={styles.colorPicker} 
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
              <span>{primaryColor}</span>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label>תצוגת תאריכים (ברירת מחדל)</label>
            <select className={styles.input} value={dateMode} onChange={(e) => setDateMode(e.target.value)}>
              <option value="hebrew">לוח שנה עברי</option>
              <option value="gregorian">לוח שנה לועזי</option>
            </select>
          </div>

          <button className={styles.saveBtn} onClick={handleSave}>
            <Save size={18} style={{display:'inline', verticalAlign:'middle', marginRight:'5px'}} />
            שמור שינויים
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><Users size={20} style={{display:'inline', verticalAlign:'middle'}}/> ניהול משתמשים</h2>
        <div className={styles.card}>
          <p style={{marginBottom: '15px'}}>ניהול מלא של תלמידים, אנשי צוות, קבוצות והרשאות מערכת. ניתן להוסיף משתמשים בודדים או לייבא רשימות מאקסל.</p>
          <a href="/admin/users" style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold'
          }}>
            מעבר למערכת ניהול המשתמשים
          </a>
        </div>
      </section>

    </div>
  );
}
