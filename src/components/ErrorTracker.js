'use client';

import { useEffect, useState } from 'react';

export default function ErrorTracker() {
  const [logs, setLogs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const addLog = (type, message, details) => {
      setLogs(prev => {
        const newLogs = [...prev, { time: new Date().toISOString(), type, message, details }];
        return newLogs.slice(-50); // Keep last 50
      });
    };

    // Intercept console.error
    const originalConsoleError = console.error;
    console.error = (...args) => {
      addLog('ERROR', 'console.error', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      originalConsoleError.apply(console, args);
    };

    // Intercept window errors
    window.onerror = (message, source, lineno, colno, error) => {
      addLog('EXCEPTION', message, `${source}:${lineno}:${colno} - ${error?.stack || ''}`);
    };

    // Intercept fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
      try {
        const response = await originalFetch(...args);
        
        // Only log errors or API calls for debugging
        if (!response.ok && url?.includes('/api/')) {
          // Clone the response so we can read it without locking it for the actual app
          const clone = response.clone();
          let errBody = '';
          try {
            errBody = await clone.text();
          } catch(e) {}
          addLog('FETCH_ERROR', `Failed ${url} (${response.status})`, errBody);
        }
        return response;
      } catch (error) {
        addLog('FETCH_FAIL', `Network error to ${url}`, error.message);
        throw error;
      }
    };

    return () => {
      console.error = originalConsoleError;
      window.fetch = originalFetch;
    };
  }, []);

  const copyLogs = () => {
    const text = logs.map(l => `[${l.time}] [${l.type}] ${l.message}\nDetails: ${l.details}`).join('\n\n');
    navigator.clipboard.writeText(text).then(() => alert('הלוגים הועתקו! הדבק אותם לרובוט.'));
  };

  if (logs.length === 0) return null;

  return (
    <>
      {isOpen && (
        <div style={{
          position: 'fixed', top: 50, left: 10, right: 10, bottom: 100, 
          background: 'rgba(0,0,0,0.9)', color: 'lime', zIndex: 9999, 
          padding: 20, overflowY: 'auto', borderRadius: 10, direction: 'ltr'
        }}>
          <button onClick={() => setIsOpen(false)} style={{float: 'right', background: 'red', color: 'white', padding: 5}}>סגור</button>
          <button onClick={copyLogs} style={{float: 'right', background: 'blue', color: 'white', padding: 5, marginRight: 10}}>העתק לוגים</button>
          <h3>Debug Logs</h3>
          {logs.map((l, i) => (
            <div key={i} style={{marginBottom: 10, borderBottom: '1px solid #333', paddingBottom: 10}}>
              <div><strong>[{l.time}] {l.type}</strong>: {l.message}</div>
              <div style={{fontSize: '0.8em', whiteSpace: 'pre-wrap'}}>{l.details}</div>
            </div>
          ))}
        </div>
      )}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', top: 10, left: 10, zIndex: 9998,
            background: 'red', color: 'white', padding: '5px 10px', borderRadius: 5,
            fontWeight: 'bold', border: '2px solid white', boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
          }}
        >
          🚨 שגיאות ({logs.length})
        </button>
      )}
    </>
  );
}
