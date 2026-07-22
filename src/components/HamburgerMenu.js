'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, User, Home, Heart, BookOpen, Calendar, Shield, Activity, LogOut, Star } from 'lucide-react';
import styles from './HamburgerMenu.module.css';

export default function HamburgerMenu({ isDutyStudent }) {
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

  const navItems = [
    { href: '/profile', icon: User, label: 'פרופיל אישי' },
    { href: '/home', icon: Home, label: 'בית' },
    { href: '/letters', icon: Heart, label: 'מה כתבו לי' },
    { href: '/journal', icon: BookOpen, label: 'היומן שלי' },
    { href: '/calendar', icon: Calendar, label: 'לוח מסע' },
    ...(isDutyStudent ? [{ href: '/duty', icon: Shield, label: 'תורן' }] : []),
    { href: '/student/mood-chart', icon: Activity, label: 'גרפים' },
    { href: '/vault', icon: Star, label: 'דברים שרציתי לשמור' },
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
        <div className={styles.drawerHeader}>
          <h2>תפריט</h2>
          <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
            <X size={24} color="#64748b" />
          </button>
        </div>
        
        <nav className={styles.drawerNav}>
          {navItems.map((item, idx) => (
            <Link key={idx} href={item.href} className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}>
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
          
          <div className={styles.divider} />
          
          <Link href="/api/auth/logout" className={`${styles.navItem} ${styles.logoutItem}`}>
            <LogOut size={20} />
            <span>התנתק</span>
          </Link>
        </nav>
      </div>
    </>
  );
}
