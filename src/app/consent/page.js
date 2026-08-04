'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export default function ConsentPage() {
  const router = useRouter();
  const toast = useToast();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!agreed) {
      toast.show('יש לסמן את תיבת האישור כדי להמשיך', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/user/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        toast.show('תודה! תנאי השימוש אושרו בהצלחה.', 'success');
        router.push('/'); // Redirect back to home
        router.refresh();
      } else {
        toast.show('אירעה שגיאה בשמירת האישור.', 'error');
      }
    } catch (error) {
      toast.show('שגיאת תקשורת.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: '#f8fafc'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: '#dcfce7',
          color: '#16a34a',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}>
          <ShieldCheck size={32} />
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px' }}>
          ברוכים הבאים ליומן מסע
        </h1>
        <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '30px', lineHeight: '1.6' }}>
          כדי להבטיח סביבה בטוחה ופרטית לכולם, וכחלק מהעמידה בתקנות משרד החינוך, עלינו לבקש את אישורך לתנאי השימוש ומדיניות הפרטיות של המערכת.
        </p>

        <div style={{
          background: '#f1f5f9',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'right',
          marginBottom: '30px',
          maxHeight: '200px',
          overflowY: 'auto',
          fontSize: '14px',
          color: '#475569',
          lineHeight: '1.6'
        }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>עיקרי מדיניות הפרטיות:</h3>
          <ul style={{ paddingRight: '20px', listStyleType: 'disc' }}>
            <li>המערכת שומרת את הנתונים שלך באופן מאובטח ומוצפן בהתאם לתקני האבטחה המחמירים.</li>
            <li>היומן האישי שלך נגיש <strong>אך ורק לך ולצוות החינוכי</strong> המוסמך בבית הספר.</li>
            <li>אנו לא מעבירים ולא נעביר את המידע האישי שלך לשום צד שלישי שאינו מורשה לכך.</li>
            <li>השימוש במערכת כפוף לכללי ההתנהגות המקובלים במוסד החינוכי. הטרדות, שפה פוגענית או שימוש לרעה במערכת אינם מותרים ויטופלו בהתאם.</li>
          </ul>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', marginBottom: '30px', textAlign: 'right' }}>
          <input 
            type="checkbox" 
            id="consent-checkbox" 
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ width: '20px', height: '20px', accentColor: '#16a34a', cursor: 'pointer' }}
          />
          <label htmlFor="consent-checkbox" style={{ fontSize: '15px', color: '#334155', cursor: 'pointer', userSelect: 'none' }}>
            קראתי והבנתי את תנאי השימוש ומדיניות הפרטיות, ואני מסכים/ה להם.
          </label>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={!agreed || isSubmitting}
          style={{
            width: '100%',
            padding: '14px',
            background: agreed ? '#16a34a' : '#cbd5e1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: agreed ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {isSubmitting ? 'שומר...' : 'אני מאשר/ת, בואו נתחיל'}
          {!isSubmitting && <ArrowLeft size={18} />}
        </button>
      </div>
    </div>
  );
}
