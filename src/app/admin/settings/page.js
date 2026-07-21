'use client';

import { useState, useContext, useEffect } from 'react';
import { Settings, Users, Save, Edit, Calendar } from 'lucide-react';
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
  const [nameFormat, setNameFormat] = useState('last_first');
  const [showHolidays, setShowHolidays] = useState(true);
  const [showParasha, setShowParasha] = useState(true);
  const [showOmer, setShowOmer] = useState(true);
  const [showSchoolEvents, setShowSchoolEvents] = useState(true);
  const [hebrewCalendarNikud, setHebrewCalendarNikud] = useState(false);
  const [moodSurveySchedule, setMoodSurveySchedule] = useState('weekly_first_login');
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  
  const presets = [
    'ההודעה נפסלה לשליחה, מפני שאיננה עומדת בכללי האתיקה שלנו',
    'שומר פיו ולשונו שומר מצרות נפשו',
    'מוות וחיים ביד הלשון'
  ];
  const [moderationMessageSelect, setModerationMessageSelect] = useState(presets[0]);
  const [customModerationMessage, setCustomModerationMessage] = useState('');

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
        if (data.themeConfig?.showHolidays !== undefined) setShowHolidays(data.themeConfig.showHolidays);
        if (data.themeConfig?.showParasha !== undefined) setShowParasha(data.themeConfig.showParasha);
        if (data.themeConfig?.showOmer !== undefined) setShowOmer(data.themeConfig.showOmer);
        if (data.themeConfig?.showSchoolEvents !== undefined) setShowSchoolEvents(data.themeConfig.showSchoolEvents);
        if (data.themeConfig?.hebrewCalendarNikud !== undefined) setHebrewCalendarNikud(data.themeConfig.hebrewCalendarNikud);
        if (data.dominantDateMode) setDateMode(data.dominantDateMode);
        if (data.institutionType) setInstitutionType(data.institutionType);
        if (data.studyYears) setStudyYears(data.studyYears);
        if (data.moderationLevel) setModerationLevel(data.moderationLevel);
        if (data.nameFormat) setNameFormat(data.nameFormat);
        if (data.themeConfig?.moodSurveySchedule) setMoodSurveySchedule(data.themeConfig.moodSurveySchedule);
        if (data.themeConfig?.moderationMessage) {
          if (presets.includes(data.themeConfig.moderationMessage)) {
            setModerationMessageSelect(data.themeConfig.moderationMessage);
          } else {
            setModerationMessageSelect('custom');
            setCustomModerationMessage(data.themeConfig.moderationMessage);
          }
        }
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
        body: JSON.stringify({ 
          name: schoolName, logoUrl, slogan, primaryColor, dateMode, institutionType, studyYears, moderationLevel, nameFormat,
          showHolidays, showParasha, showOmer, showSchoolEvents, hebrewCalendarNikud,
          moodSurveySchedule,
          moderationMessage: moderationMessageSelect === 'custom' ? customModerationMessage : moderationMessageSelect
        }) 
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

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div className={styles.formGroup} style={{ flex: 1, minWidth: '200px' }}>
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
            <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>תצוגת שמות תלמידים (ברירת מחדל)</label>
            <select style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1'}} value={nameFormat} onChange={(e) => setNameFormat(e.target.value)}>
              <option value="last_first">שם משפחה קודם (לדוגמה: ישראלי ישראל)</option>
              <option value="first_last">שם פרטי קודם (לדוגמה: ישראל ישראלי)</option>
            </select>
          </div>

          <div style={{marginBottom:'15px'}}>
            <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>רמת סינון תוכן פוגעני</label>
            <select style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1'}} value={moderationLevel} onChange={(e) => setModerationLevel(Number(e.target.value))}>
              <option value={1}>רמה 1 - מקל מאוד (חוסם רק אלימות קיצונית)</option>
              <option value={2}>רמה 2 - מקל (מתירני לגבי סלנג שגרתי)</option>
              <option value={3}>רמה 3 - מאוזן (ברירת מחדל: חוסם הטרדות וקללות, מאפשר סלנג חיובי)</option>
              <option value={4}>רמה 4 - שמרני (חוסם סלנג גס גם בצחוק)</option>
              <option value={5}>רמה 5 - מחמיר מאוד (אפס סובלנות לכל מילה שלילית או מרומזת)</option>
            </select>
          </div>


          <div style={{marginBottom:'15px', paddingRight: '20px', borderRight: '4px solid var(--primary-light)', backgroundColor: 'var(--bg-color, #f8fafc)', padding: '15px 20px 15px 15px', borderRadius: '8px 0 0 8px', marginTop: '-5px'}}>
            <label style={{display:'block', marginBottom:'5px', fontWeight:'bold', color: 'var(--primary-color)'}}>הודעה לתלמיד על תוכן שנפסל (קשור לרמת הסינון לעיל)</label>
            <select 
              style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1', marginBottom: moderationMessageSelect === 'custom' ? '10px' : '0'}} 
              value={moderationMessageSelect} 
              onChange={(e) => setModerationMessageSelect(e.target.value)}
            >
              {presets.map((p, i) => (
                <option key={i} value={p}>{p}</option>
              ))}
              <option value="custom">אחר (הכנס טקסט חופשי)</option>
            </select>
            {moderationMessageSelect === 'custom' && (
              <textarea 
                className={styles.input} 
                placeholder="הקלד כאן את ההודעה הרצויה שתופיע לתלמיד..."
                value={customModerationMessage}
                onChange={(e) => setCustomModerationMessage(e.target.value)}
                style={{ width: '100%', minHeight: '100px', resize: 'vertical', padding: '12px', marginTop: '10px', fontSize: '1rem', lineHeight: '1.5' }}
              />
            )}
          </div>

          <div style={{marginBottom:'15px'}}>
            <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>תזמון חלון שאלון מצב רוח לתלמיד</label>
            <select style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1'}} value={moodSurveySchedule} onChange={(e) => setMoodSurveySchedule(e.target.value)}>
              <option value="weekly_first_login">פעם בשבוע (בכניסה הראשונה לאותו שבוע)</option>
              <option value="daily">פעם ביום (בכניסה הראשונה לאותו יום)</option>
              <option value="disabled">מופסק (יופעל רק לפי דרישה של איש צוות)</option>
            </select>
            <p style={{fontSize: '13px', color: '#64748b', marginTop: '5px'}}>* השבוע מתאפס במוצאי שבת בחצות. מנהל/מחנך תמיד יכול לדרוש מצב רוח מתלמיד קבוצה.</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><Calendar size={20} style={{display:'inline', verticalAlign:'middle'}}/> הגדרות לוח שנה</h2>
        <div className={styles.card}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showHolidays} onChange={e => setShowHolidays(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <span>הצג חגים ומועדים יהודיים (מובנה בלוח)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showParasha} onChange={e => setShowParasha(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <span>הצג פרשות שבוע בשבתות</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', paddingRight: '25px' }}>
              <input type="checkbox" checked={hebrewCalendarNikud} onChange={e => setHebrewCalendarNikud(e.target.checked)} style={{ width: '18px', height: '18px' }} disabled={!showParasha && !showHolidays} />
              <span>הצג חגים ופרשות עם ניקוד</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showOmer} onChange={e => setShowOmer(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <span>הצג ספירת העומר בימים הרלוונטיים</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showSchoolEvents} onChange={e => setShowSchoolEvents(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <span>הצג אירועים בית ספריים בלוח השנה הראשי כברירת מחדל</span>
            </label>
          </div>
        </div>
      </section>

      <section className={styles.section}>
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
      </section>
    </div>
  );
}
