'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { type Locale, locales } from '../../i18n';
import styles from './LanguageSelector.module.css';

export function LanguageSelector({ currentLocale }: { currentLocale: Locale }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (newLocale: Locale) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');
    router.push(newPath);
    setIsOpen(false);
  };

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <button 
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
      >
        {currentLocale.toUpperCase()}
        <span className={styles.arrow}>▼</span>
      </button>
      {isOpen && (
        <div className={styles.menu}>
          {locales.map((locale, index) => (
            <button
              key={locale}
              onClick={() => handleLanguageChange(locale)}
              className={`${styles.option} ${locale === currentLocale ? styles.active : ''} ${index === 0 ? styles.first : ''} ${index === locales.length - 1 ? styles.last : ''}`}
            >
              {locale.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}