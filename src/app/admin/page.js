'use client';

import { useState, useContext } from 'react';
import { Settings, Users, Save, Edit } from 'lucide-react';
import styles from './admin.module.css';
import { ThemeContext } from '@/components/ThemeProvider';

export default function AdminDashboard() {
  const theme = useContext(ThemeContext);
  
  const [schoolName, setSchoolName] = useState(theme.schoolName);
  const [slogan, setSlogan] = useState(theme.slogan);
  const [primaryColor, setPrimaryColor] = useState(theme.primaryColor);

  const mockUsers = [
    { id: 1, name: 'ישראל ישראלי', role: 'חניך' },
    { id: 2, name: 'דוד המדריך', role: 'צוות' },
  ];

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

          <button className={styles.saveBtn}>
            <Save size={18} style={{display:'inline', verticalAlign:'middle', marginRight:'5px'}} />
            שמור שינויים (Mock)
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
