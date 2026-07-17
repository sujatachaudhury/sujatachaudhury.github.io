"use client";

import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.css";

type Theme = "light" | "dark";

interface ThemeToggleProps {
  labelLight: string;
  labelDark: string;
}

/**
 * ThemeToggle — flips data-theme on <html>. Persists to localStorage.
 * Falls back to prefers-color-scheme when nothing is stored.
 * SSR-safe: renders as null on first paint to avoid hydration mismatch.
 */
export function ThemeToggle({ labelLight, labelDark }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("theme")) as Theme | null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.dataset.theme = stored;
    } else {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      setTheme(mql.matches ? "dark" : "light");
    }
  }, []);

  if (!theme) {
    return <span className={styles.root} aria-hidden="true" style={{ visibility: "hidden" }} />;
  }

  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = theme === "dark" ? labelLight : labelDark;

  return (
    <button
      type="button"
      className={styles.root}
      aria-label={label}
      title={label}
      onClick={() => {
        setTheme(next);
        document.documentElement.dataset.theme = next;
        localStorage.setItem("theme", next);
      }}
    >
      {theme === "dark" ? (
        <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="3" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <line x1="8" y1="1" x2="8" y2="3" />
            <line x1="8" y1="13" x2="8" y2="15" />
            <line x1="1" y1="8" x2="3" y2="8" />
            <line x1="13" y1="8" x2="15" y2="8" />
            <line x1="3" y1="3" x2="4.5" y2="4.5" />
            <line x1="11.5" y1="11.5" x2="13" y2="13" />
            <line x1="3" y1="13" x2="4.5" y2="11.5" />
            <line x1="11.5" y1="4.5" x2="13" y2="3" />
          </g>
        </svg>
      ) : (
        <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true">
          <path d="M14 9.5A6 6 0 0 1 6.5 2a6 6 0 1 0 7.5 7.5z" fill="currentColor" />
        </svg>
      )}
    </button>
  );
}
