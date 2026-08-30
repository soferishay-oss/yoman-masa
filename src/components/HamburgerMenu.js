'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, User, Home, Heart, BookOpen, Calendar, Shield, Activity, LogOut, Star, Compass } from 'lucide-react';
import styles from './HamburgerMenu.module.css';

export default function HamburgerMenu({ isDutyStudent, academicYears = [], currentYear = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    // Close menu when route changes
    setIsOpen(false);
  }, [pathname]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { href: '/profile', icon: User, label: 'פרופיל אישי' },
    { href: '/home', icon: Home, label: 'בית' },
    { href: '/journeys', icon: Compass, label: 'מסעות מתגלגלים' },
    { href: '/letters', icon: Heart, label: 'מכתבים בלב' },
    { href: '/journal', icon: BookOpen, label: 'יומן מסע אישי' },
    { href: '/calendar', icon: Calendar, label: 'לוח שנה' },
    ...(isDutyStudent ? [{ href: '/duty', icon: Shield, label: 'תורנויות' }] : []),
    { href: '/student/charts', icon: Activity, label: 'גרפים' },
    { href: '/vault', icon: Star, label: 'הדברים הטובים שעשיתי' },
  ];

  return (
    <>
      <button 
        onClick={toggleMenu} 
        className={styles.hamburgerBtn}
        aria-label="פתח תפריט"
      >
        <Menu size={28} color="#1e293b" />
      </button>

      {/* Overlay */}
      {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}

      {/* Drawer */}
      <div ref={menuRef} className={`${styles.drawer} ${isOpen ? styles.open : ''}`}>
        <div className={styles.drawerHeader} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '15px' }}>
          {academicYears && academicYears.length > 0 && (
            <div style={{ width: '100%' }}>
              <select 
                defaultValue={currentYear?.id || ''}
                onChange={(e) => {
                  document.cookie = `selected_academic_year=${e.target.value}; path=/; max-age=31536000`;
                  window.location.reload();
                }}
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  border: '1px solid #cbd5e1',
                  background: 'var(--primary-light)',
                  color: 'var(--primary-color)',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {academicYears.map(year => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h2>תפריט</h2>
            <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
              <X size={24} color="#64748b" />
            </button>
          </div>
        </div>
        
        <nav className={styles.drawerNav}>
          {navItems.map((item, idx) => (
            <Link key={idx} href={item.href} className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}>
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
          
          <div className={styles.divider} />
          
          <button onClick={handleLogout} className={`${styles.navItem} ${styles.logoutItem}`} style={{background: 'none', border: 'none', width: '100%', textAlign: 'right', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit'}}>
            <LogOut size={20} />
            <span>התנתק</span>
          </button>
        </nav>
      </div>
    </>
  );
}
