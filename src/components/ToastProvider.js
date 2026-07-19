'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const show = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        message,
        onConfirm: () => {
          setConfirmDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        }
      });
    });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.alert = (message) => {
        show(message, message.includes('שגיאה') || message.includes('תקלה') ? 'error' : 'success', 3000);
      };
    }
  }, [show]);

  return (
    <ToastContext.Provider value={{ show, confirm }}>
      {children}
      
      {/* Toasts Container */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 9999,
        pointerEvents: 'none'
      }}>
        {toasts.map((toast) => (
          <div key={toast.id} style={{
            background: toast.type === 'error' ? '#ef4444' : '#10b981',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '24px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            fontWeight: 'bold',
            textAlign: 'center',
            fontSize: '14px',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {toast.message}
          </div>
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
            maxWidth: '300px',
            width: '90%',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#334155' }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={confirmDialog.onCancel}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer', flex: 1 }}
              >
                ביטול
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: 'white', cursor: 'pointer', flex: 1, fontWeight: 'bold' }}
              >
                אישור
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
