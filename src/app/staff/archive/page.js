'use client';

import { useState, useEffect } from 'react';
import { Archive, Bell, Mail, RefreshCw } from 'lucide-react';
import AppDate from '@/components/AppDate';

export default function StaffArchivePage() {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' or 'letters'

  useEffect(() => {
    fetchArchivedAlerts();
  }, []);

  const fetchArchivedAlerts = async () => {
    setIsLoading(true);
    try {
      // Need a way to fetch archived alerts. 
      // I'll create a new endpoint or update the existing GET to accept a query param.
      const res = await fetch('/api/staff/alerts/archive');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const archivedSystemAlerts = alerts.filter(a => a.type !== 'letter');
  const archivedLetters = alerts.filter(a => a.type === 'letter');

  const displayedAlerts = activeTab === 'alerts' ? archivedSystemAlerts : archivedLetters;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }}>
      <header style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Archive color="var(--primary-color)" /> ארכיון התראות ומכתבים
        </h1>
        <button onClick={fetchArchivedAlerts} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}>
          <RefreshCw size={20} />
        </button>
      </header>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('alerts')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'alerts' ? 'var(--primary-color)' : '#e2e8f0', color: activeTab === 'alerts' ? 'white' : '#475569', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
        >
          <Bell size={18} /> התראות מערכת ({archivedSystemAlerts.length})
        </button>
        <button 
          onClick={() => setActiveTab('letters')}
          style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'letters' ? '#3b82f6' : '#e2e8f0', color: activeTab === 'letters' ? 'white' : '#475569', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
        >
          <Mail size={18} /> מכתבים ({archivedLetters.length})
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {isLoading ? (
          <p style={{ textAlign: 'center', color: '#64748b' }}>טוען...</p>
        ) : displayedAlerts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b' }}>אין פריטים בארכיון.</p>
        ) : (
          displayedAlerts.map(alert => (
            <div key={alert.id} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <strong style={{ color: activeTab === 'letters' ? '#1e3a8a' : '#475569' }}>{alert.content}</strong>
                <span style={{ fontSize: '12px', color: '#64748b' }}><AppDate date={alert.createdAt} /></span>
              </div>
              {alert.metadata && (
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '10px', background: '#f8fafc', padding: '10px', borderRadius: '4px' }}>
                  {activeTab === 'letters' ? (
                    <>
                      <div><strong>שולח:</strong> {alert.metadata.senderName}</div>
                      <div style={{ marginTop: '10px', fontStyle: 'italic' }}>* המכתב המלא מופיע בתיבת המכתבים.</div>
                    </>
                  ) : (
                    <>
                      <div><strong>שולח:</strong> {alert.metadata.senderName}</div>
                      <div><strong>נמען:</strong> {alert.metadata.recipientName}</div>
                      <div style={{ marginTop: '5px' }}><strong>הודעה שנפסלה:</strong> "{alert.metadata.messageContent}"</div>
                      <div style={{ marginTop: '5px', color: '#ef4444' }}><strong>סיבה:</strong> {alert.metadata.reason}</div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
