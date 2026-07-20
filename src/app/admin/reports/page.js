'use client';

import { useState } from 'react';
import { Download, Users, Calendar, Activity, FileSpreadsheet } from 'lucide-react';
import styles from './reports.module.css';

export default function AdminReports() {
  const [isExporting, setIsExporting] = useState(false);

  const downloadExcel = (data, filename) => {
    if (!data || !data.length) {
      alert('אין נתונים לייצוא');
      return;
    }

    const headers = Object.keys(data[0]);
    
    // Create an HTML table that Excel can open natively
    const htmlTable = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; direction: rtl; font-family: Arial, sans-serif; }
          th { background-color: #f1f5f9; font-weight: bold; border: 1px solid #cbd5e1; padding: 10px; text-align: center; }
          td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${data.map(row => `<tr>${headers.map(h => {
              const cell = row[h] === null || row[h] === undefined ? '' : row[h];
              return `<td>${cell}</td>`;
            }).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async (type) => {
    setIsExporting(true);
    try {
      let endpoint = '';
      let filename = '';
      let formatData = (d) => d;

      switch (type) {
        case 'users':
          endpoint = '/api/admin/users';
          filename = 'users_export';
          formatData = (data) => data.map(u => ({
            'מזהה': u.id,
            'שם מלא': u.fullName,
            'טלפון': u.phoneNumber,
            'דוא"ל': u.email || '',
            'תפקיד': u.role,
            'קבוצה/כיתה': u.group ? u.group.name : '',
            'סטטוס': u.status
          }));
          break;
        case 'events':
          endpoint = '/api/admin/dashboard'; // Hack: dashboard returns events if we modify it or we create a specific one. Let's create an endpoint or just export mock for now.
          alert('ייצוא אירועים יתווסף בקרוב');
          setIsExporting(false);
          return;
      }

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        downloadExcel(formatData(data), filename);
      } else {
        alert('שגיאה בייצוא הנתונים');
      }
    } catch (error) {
      console.error(error);
      alert('שגיאה בתקשורת');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>דוחות וייצוא נתונים</h1>
        <p>ייצוא נתוני המערכת לאקסל לצורך ניתוח ובקרה</p>
      </header>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.iconWrapper}><Users size={32} /></div>
          <h2>דוח משתמשים</h2>
          <p>ייצוא רשימת כל התלמידים ואנשי הצוות במוסד, כולל שיוך לכיתות.</p>
          <button 
            className={styles.exportBtn} 
            onClick={() => handleExport('users')}
            disabled={isExporting}
          >
            <FileSpreadsheet size={18} /> הורד דוח מעוצב (אקסל)
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.iconWrapper}><Calendar size={32} /></div>
          <h2>דוח אירועים ונוכחות</h2>
          <p>ייצוא היסטוריית אירועים וסטטוס הרשמה ונוכחות של חניכים.</p>
          <button 
            className={styles.exportBtn} 
            onClick={() => handleExport('events')}
            disabled={isExporting}
          >
            <FileSpreadsheet size={18} /> הורד דוח מעוצב (אקסל)
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.iconWrapper}><Activity size={32} /></div>
          <h2>דוח מדדי רגשות</h2>
          <p>ייצוא נתוני מדד הרגשות ההיסטורי לצורך ניתוח מגמות וסיכון.</p>
          <button 
            className={styles.exportBtn} 
            onClick={() => alert('פיתוח יתווסף בהמשך')}
            disabled={isExporting}
          >
            <FileSpreadsheet size={18} /> הורד דוח מעוצב (אקסל)
          </button>
        </div>
      </div>
    </div>
  );
}
