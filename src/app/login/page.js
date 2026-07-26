'use client';

import { useState, useEffect, useContext, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Phone, Shield, Search, ChevronDown, Check } from 'lucide-react';
import styles from './login.module.css';
import { ThemeContext } from '@/components/ThemeProvider';

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Splash
  const [showSplash, setShowSplash] = useState(false);
  const [isSplashFading, setIsSplashFading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  
  // Multi-tenant
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Click outside to close dropdown
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchParams.get('error') === 'suspended') {
      setError('חשבונך ננעל ע"י מנהל המערכת. נא פנה למחנך או למנהל.');
    }

    // Fetch tenants
    fetch('/api/tenants/public')
      .then(r => r.json())
      .then(data => {
        if (data.tenants) {
          setTenants(data.tenants);
          // Try to load saved tenant from localStorage
          const savedCode = localStorage.getItem('yoman_institution_code');
          if (savedCode) {
            const found = data.tenants.find(t => t.institutionCode === savedCode);
            if (found) setSelectedTenant(found);
          }
        }
      })
      .catch(err => console.error('Error fetching tenants:', err));
  }, [searchParams]);

  const handleSelectTenant = (tenant) => {
    setSelectedTenant(tenant);
    localStorage.setItem('yoman_institution_code', tenant.institutionCode);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const filteredTenants = tenants.filter(t => 
    t.name.includes(searchQuery) || 
    (t.institutionCode && t.institutionCode.includes(searchQuery))
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading || !phoneNumber || !password) return;
    
    if (!selectedTenant) {
      setError('נא לבחור מוסד מהרשימה תחילה.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber, 
          password,
          institutionCode: selectedTenant.institutionCode
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUserRole(data.user.role);
        setShowSplash(true);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'שגיאה בהתחברות. ודא שהפרטים תקינים.');
      }
    } catch (err) {
      console.error(err);
      setError('שגיאת רשת. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {showSplash && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#ffffff',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <video 
            src="/clip.mp4" 
            autoPlay 
            muted 
            playsInline
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              opacity: isSplashFading ? 0 : 1,
              transition: 'opacity 1.5s ease-out'
            }}
            onTimeUpdate={(e) => {
              const vid = e.target;
              if (vid.duration && vid.currentTime >= vid.duration - 1.5 && !isSplashFading) {
                setIsSplashFading(true);
              }
            }}
            onEnded={(e) => {
              if (userRole === 'admin') window.location.href = '/admin';
              else if (userRole === 'staff') window.location.href = '/staff';
              else window.location.href = '/home';
            }}
          />
        </div>
      )}

      <div className={styles.card} style={{ maxWidth: '400px', width: '100%' }}>
        
        {/* App Logo & Title - Dominant at the top */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img src="/app-logo.png" alt="יומן מסע" style={{ width: '100px', height: '100px', objectFit: 'contain', marginBottom: '10px' }} />
          <h1 style={{ fontSize: '28px', color: '#16a34a', margin: '0 0 5px 0', fontWeight: '800' }}>יומן מסע</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>התחברות למערכת</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={{position: 'relative'}}>
            <Phone size={20} style={{position: 'absolute', right: '15px', top: '15px', color: '#94a3b8'}} />
            <input 
              type="tel" 
              placeholder="מספר פלאפון" 
              value={phoneNumber} 
              onChange={e => setPhoneNumber(e.target.value)}
              required
              style={{
                width: '100%', 
                padding: '15px 45px 15px 15px', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0',
                fontSize: '16px',
                fontFamily: 'inherit',
                backgroundColor: '#f8fafc'
              }}
            />
          </div>

          <div style={{position: 'relative'}}>
            <input 
              type="password" 
              placeholder="סיסמא" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', 
                padding: '15px 15px 15px 15px', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0',
                fontSize: '16px',
                fontFamily: 'inherit',
                backgroundColor: '#f8fafc'
              }}
            />
          </div>

          {/* School Details - Below inputs but smaller */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', gap: '10px', padding: '15px', backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
            {selectedTenant ? (
              <>
                {selectedTenant.logoUrl ? (
                  <img src={selectedTenant.logoUrl} alt="Institution Logo" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                ) : (
                  <Shield size={40} color="#94a3b8" />
                )}
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '16px', color: '#334155', margin: '0 0 4px 0', fontWeight: '600' }}>{selectedTenant.name}</h3>
                  <span style={{ fontSize: '12px', color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px' }}>
                    סמל: {selectedTenant.institutionCode}
                  </span>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b' }}>
                <Shield size={40} color="#cbd5e1" style={{ margin: '0 auto 8px auto' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>לא נבחר מוסד</p>
              </div>
            )}

            {/* Dropdown for School Selection */}
            <div ref={dropdownRef} style={{ width: '100%', position: 'relative', marginTop: '5px' }}>
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '12px 15px', backgroundColor: 'white', border: '1px solid #cbd5e1', 
                  borderRadius: '8px', cursor: 'pointer' 
                }}
              >
                <span style={{ fontSize: '14px', color: selectedTenant ? '#0f172a' : '#94a3b8' }}>
                  {selectedTenant ? 'החלף מוסד' : 'בחר מוסד מרשימה...'}
                </span>
                <ChevronDown size={18} color="#64748b" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>

              {isDropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0,
                  backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  zIndex: 50, overflow: 'hidden', border: '1px solid #e2e8f0'
                }}>
                  <div style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', position: 'relative' }}>
                    <Search size={16} color="#94a3b8" style={{ position: 'absolute', right: '20px', top: '20px' }} />
                    <input 
                      type="text" 
                      placeholder="חפש מוסד או סמל..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ 
                        width: '100%', padding: '8px 30px 8px 10px', borderRadius: '6px', 
                        border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#f8fafc' 
                      }}
                      autoFocus
                    />
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {filteredTenants.length === 0 ? (
                      <div style={{ padding: '15px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        לא נמצאו מוסדות
                      </div>
                    ) : (
                      filteredTenants.map(t => (
                        <div 
                          key={t.id}
                          onClick={() => handleSelectTenant(t)}
                          style={{
                            padding: '12px 15px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            backgroundColor: selectedTenant?.id === t.id ? '#f0fdf4' : 'transparent'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = selectedTenant?.id === t.id ? '#f0fdf4' : 'transparent'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {t.logoUrl ? (
                              <img src={t.logoUrl} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                            ) : (
                              <Shield size={24} color="#94a3b8" />
                            )}
                            <div>
                              <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{t.name}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>סמל: {t.institutionCode}</div>
                            </div>
                          </div>
                          {selectedTenant?.id === t.id && <Check size={18} color="#16a34a" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && <div style={{color: '#e53e3e', fontSize: '14px', textAlign: 'center', marginTop: '5px'}}>{error}</div>}

          <button 
            type="submit" 
            disabled={isLoading || !phoneNumber || !password || !selectedTenant}
            style={{
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '15px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: (isLoading || !phoneNumber || !password || !selectedTenant) ? 'not-allowed' : 'pointer',
              marginTop: '10px',
              boxShadow: '0 4px 10px rgba(22, 163, 74, 0.3)',
              opacity: (isLoading || !phoneNumber || !password || !selectedTenant) ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            {isLoading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>
      </div>
    </div>
  );
}
