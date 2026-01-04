import Link from 'next/link';
import { getTranslations } from '../../i18n';
import { type Locale } from '../../i18n';
import { LanguageSelector } from '../language-selector';
import styles from './Navigation.module.css';

export function Navigation({ locale }: { locale: Locale }) {
  const t = getTranslations(locale);
  
  return (
    <nav className={styles.nav}>
      <div className={styles.links}>
        <Link href={`/${locale}`} className={styles.link}>
          {t.common.home}
        </Link>
        <span className={styles.separator}>|</span>
        <Link href={`/${locale}/about`} className={styles.link}>
          {t.common.about}
        </Link>
      </div>
      <LanguageSelector currentLocale={locale} />
    </nav>
  );
}