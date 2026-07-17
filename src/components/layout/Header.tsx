import Link from "next/link";
import { ReactNode } from "react";
import styles from "./Header.module.css";

export interface NavItem {
  href: string;
  label: string;
}

interface HeaderProps {
  locale: string;
  brand: string;
  homeHref: string;
  items: NavItem[];
  currentPath: string;
  controls?: ReactNode;
}

/**
 * Header — sticky top bar with brand, nav, and locale/theme controls.
 * `currentPath` is the page path *relative to the locale root* (e.g. "/", "/work").
 * Marks the active link with aria-current="page".
 */
export function Header({ brand, homeHref, items, currentPath, controls }: HeaderProps) {
  return (
    <header className={styles.root}>
      <div className={styles.inner}>
        <Link className={styles.brand} href={homeHref}>
          {brand}
        </Link>
        <nav className={styles.nav} aria-label="Primary">
          <ul className={styles.navList}>
            {items.map((item) => {
              const active = normalize(item.href).endsWith(normalize(currentPath));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={styles.navLink}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {controls && <div className={styles.controls}>{controls}</div>}
        </nav>
      </div>
    </header>
  );
}

function normalize(path: string) {
  return path.replace(/\/+$/, "") || "/";
}
