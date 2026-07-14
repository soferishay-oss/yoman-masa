'use client';

import { useState, useContext } from 'react';
import { Settings, Users, Save, Edit } from 'lucide-react';
import styles from './admin.module.css';
import { ThemeContext } from '@/components/ThemeProvider';

export default function AdminDashboard() {
  const theme = useContext(ThemeContext);
  
  const [schoolName, setSchoolName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor);
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
        // We'll map slogan and color later if we add them to DB schema, for now just use theme/local
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
        body: JSON.stringify({ name: schoolName, logoUrl })
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
            <label>לוגו מוסד (כתובת URL)</label>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="https://..."
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
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
            <select className={styles.input} defaultValue="hebrew">
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
          <div className={styles.userList}>
            {mockUsers.map(user => (
              <div key={user.id} className={styles.userRow}>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.name}</span>
                  <span className={styles.userRole}>{user.role}</span>
                </div>
                <button className={styles.actionBtn}>
                  <Edit size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
