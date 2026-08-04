import Link from 'next/link';

export default function AccessibilityPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', lineHeight: '1.6', color: '#334155' }}>
      <h1 style={{ color: '#1e293b', marginBottom: '20px' }}>הצהרת נגישות</h1>
      <p>
        אנו ב<strong>יומן מסע</strong> רואים חשיבות רבה במתן שירות שוויוני ונגיש לכלל התלמידים, המורים והמשתמשים במערכת,
        ומשקיעים מאמצים רבים בהנגשת האתר והאפליקציה בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלויות.
      </p>

      <h2 style={{ color: '#0f172a', marginTop: '30px' }}>רמת הנגישות</h2>
      <p>
        אנו פועלים להתאמת המערכת לתקן הישראלי (ת"י 5568) ברמת נגישות AA, ולפי הנחיות התקן הבינלאומי WCAG 2.1.
        נעשות פעולות רבות לשיפור הניווט במקלדת, התאמה לקוראי מסך, ויצירת ניגודיות (קונטרסט) ברורה לנוחות המשתמשים.
      </p>

      <h2 style={{ color: '#0f172a', marginTop: '30px' }}>אפשרויות הנגישות במערכת</h2>
      <ul style={{ paddingRight: '20px' }}>
        <li>תמיכה מלאה בניווט בעזרת המקלדת בלבד (מקשי Tab, Enter, וחיצים).</li>
        <li>הוספת טקסטים חלופיים (Alt) לתמונות, כפתורים ואייקונים משמעותיים.</li>
        <li>שימוש בתגיות HTML סמנטיות ובמאפייני ARIA לשיפור החוויה עם קוראי מסך.</li>
        <li>אפשרות הפעלת "דילוג לתוכן המרכזי" לחיסכון בזמן הניווט.</li>
      </ul>

      <h2 style={{ color: '#0f172a', marginTop: '30px' }}>דיווח על תקלות נגישות</h2>
      <p>
        למרות המאמצים הרבים, ייתכן שיתגלו חלקים במערכת שטרם הונגשו במלואם, או שנתקלתם בבעיה בזמן השימוש.
        אם מצאתם בעיית נגישות, נשמח מאוד לקבל מכם פנייה כדי שנוכל לתקן ולשפר את החוויה עבור כולם.
      </p>
      <p>ניתן ליצור איתנו קשר דרך עמוד <Link href="/contact-us" style={{ color: '#2563eb', textDecoration: 'underline' }}>יצירת הקשר</Link> או בפנייה לצוות בית הספר.</p>

      <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
        <Link href="/" style={{ padding: '10px 20px', background: '#e2e8f0', color: '#1e293b', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  );
}
