'use client';
import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, X, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/ToastProvider';
import styles from '@/app/page.module.css';

export default function ExcelImportModal({ role, onImportComplete, onClose }) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);
  const { show } = useToast();

  const handleDownloadTemplate = () => {
    let wsData = [];
    if (role === 'student') {
      wsData = [['תז', 'שם משפחה', 'שם פרטי', 'כיתה', 'מקבילה', 'טלפון נייד']];
    } else {
      wsData = [['תז', 'שם מורה', 'טלפון נייד', 'מייל']];
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // Make columns wider
    ws['!cols'] = Array(wsData[0].length).fill({ wch: 15 });
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `template_${role}.xlsx`);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Convert sheet to array of arrays
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // Find header row (usually the first row that is not completely empty, maybe row 0, 1, or 2)
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(data.length, 5); i++) {
          const rowStr = data[i].join('').trim();
          if (rowStr.length > 0 && (data[i].includes('תז') || data[i].includes('שם') || data[i].includes('טלפון'))) {
            headerRowIndex = i;
            break;
          }
        }

        const foundHeaders = data[headerRowIndex].map(h => String(h).trim());
        const rawRows = data.slice(headerRowIndex + 1);
        
        // Convert rows to objects
        const jsonRows = rawRows.map(row => {
          let obj = {};
          foundHeaders.forEach((h, index) => {
            if (h) obj[h] = row[index];
          });
          return obj;
        }).filter(row => Object.keys(row).some(k => String(row[k]).trim() !== ''));

        setFile(selectedFile);
        setHeaders(foundHeaders.filter(Boolean));
        setParsedData(jsonRows);
      } catch (err) {
        show('שגיאה בפענוח הקובץ', 'error');
        console.error(err);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleConfirmImport = async () => {
    if (!parsedData || parsedData.length === 0) {
      show('לא נמצאו נתונים לייבוא', 'error');
      return;
    }

    setIsImporting(true);
    show('מייבא נתונים...', 'info');

    try {
      const res = await fetch('/api/admin/users/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: parsedData, role })
      });

      if (res.ok) {
        const result = await res.json();
        if (result.errors && result.errors.length > 0) {
          show(`יובאו ${result.count} רשומות, אך היו שגיאות ב-${result.errors.length} שורות`, 'error');
          // We can log them or show them in a custom alert, for now show the first error in toast
          console.error("Import errors:", result.errors);
          show(result.errors[0], 'error');
        } else {
          show(`יובאו בהצלחה ${result.count} משתמשים!`);
        }
        onImportComplete();
      } else {
        const err = await res.json();
        show('שגיאה בייבוא: ' + (err.error || ''), 'error');
      }
    } catch (err) {
      show('שגיאה בתקשורת', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', padding: '25px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={24} color="#0284c7" /> ייבוא מאקסל
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
        </div>

        {!parsedData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>שלב 1: הכן את הקובץ</h3>
              <p style={{ fontSize: '13px', color: '#475569', marginBottom: '15px' }}>
                הורד את התבנית הריקה, מלא אותה בנתונים לפי העמודות ושמור כקובץ אקסל (XLSX).
              </p>
              <button onClick={handleDownloadTemplate} style={{ padding: '8px 16px', background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                <Download size={16} /> הורד תבנית ריקה
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>שלב 2: העלה את הקובץ</h3>
              <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
              <button onClick={() => fileInputRef.current.click()} className={styles.primaryButton} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <Upload size={18} /> בחר קובץ להעלאה
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ background: '#dcfce7', color: '#166534', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Check size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>הקובץ נסרק בהצלחה!</strong>
                <span style={{ fontSize: '13px' }}>נמצאו <strong>{parsedData.length}</strong> שורות לייבוא.</span><br/>
                <span style={{ fontSize: '13px' }}>עמודות שזוהו: {headers.join(', ')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button onClick={() => { setParsedData(null); setFile(null); }} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>בטל והעלה קובץ אחר</button>
              <button onClick={handleConfirmImport} disabled={isImporting} className={styles.primaryButton} style={{ opacity: isImporting ? 0.7 : 1 }}>
                {isImporting ? 'מייבא...' : 'אשר ובצע ייבוא'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
