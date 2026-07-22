'use client';

import { useState, useEffect } from 'react';
import { Book, Printer, Download } from 'lucide-react';
import AppDate from '@/components/AppDate';

export default function BookExportPage() {
  const [bookData, setBookData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBook() {
      try {
        const res = await fetch('/api/reports/book');
        if (res.ok) {
          setBookData(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBook();
  }, []);

  if (isLoading) return <div style={{padding:'20px'}}>מכין את הספר שלך...</div>;
  if (!bookData) return <div style={{padding:'20px'}}>שגיאה בטעינת הספר.</div>;

  return (
    <div style={{maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'serif'}}>
      {/* Action Bar (Not printed) */}
      <div style={{display: 'flex', justifyContent: 'flex-end', gap: '15px', marginBottom: '30px'}} className="no-print">
        <button onClick={() => window.print()} style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: '1px solid #ccc', background: 'white', cursor: 'pointer'}}>
          <Printer size={18} /> הדפס כ-PDF
        </button>
      </div>

      {/* Book Cover */}
      <div style={{textAlign: 'center', padding: '100px 20px', borderBottom: '2px solid #eee', marginBottom: '40px', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <Book size={64} color="var(--primary-color)" style={{marginBottom: '20px'}} />
        <h1 style={{fontSize: '42px', fontWeight: 'bold', marginBottom: '20px', color: '#111'}}>
          {bookData.bookTitle}
        </h1>
        <p style={{fontSize: '20px', color: '#666'}}>
          יומן מסע אישי • תשפ"ה
        </p>
      </div>

      {/* Chapters / Entries */}
      <div style={{padding: '0 20px'}}>
        {bookData.entries.length === 0 ? (
          <p style={{textAlign: 'center', color: '#666'}}>ספר המסע שלך ריק כרגע. תוכל להוסיף רשומות מהיומן על ידי שמירתן בכספת הזיכרונות.</p>
        ) : (
          bookData.entries.map((entry, idx) => (
            <div key={entry.id} style={{marginBottom: '60px', pageBreakInside: 'avoid'}}>
              <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', color: 'var(--primary-color)'}}>
                {entry.title || `פרק ${idx + 1}`}
              </h2>
              <div style={{fontSize: '14px', color: '#888', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
                <AppDate date={entry.createdAt} /> &bull; {entry.type === 'journal' ? 'יומן אישי' : entry.type === 'letter' ? 'מכתב' : 'תיעוד'}
              </div>
              <div style={{fontSize: '18px', lineHeight: '1.8', color: '#222', whiteSpace: 'pre-wrap'}}>
                {entry.bodyText}
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx global>{`
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          nav, header { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  );
}
