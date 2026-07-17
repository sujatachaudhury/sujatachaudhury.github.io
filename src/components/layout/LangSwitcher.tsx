"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { writePreferredLocale } from "@/lib/i18n/preference";
import { isLocale } from "@/lib/i18n/config";
import styles from "./LangSwitcher.module.css";

export interface LangOption {
  code: string;
  label: string;
  native: string;
}

interface LangSwitcherProps {
  current: string;
  options: LangOption[];
  ariaLabel: string;
}

/**
 * LangSwitcher — accessible listbox-style menu.
 * On selection, replaces the leading /{locale}/ segment in the current path.
 * Closes on outside click and Escape.
 */
export function LangSwitcher({ current, options, ariaLabel }: LangSwitcherProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const currentOption = options.find((o) => o.code === current) ?? options[0];

  const switchTo = (code: string) => {
    setOpen(false);
    if (code === current) return;
    if (isLocale(code)) writePreferredLocale(code);
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0 || !options.some((o) => o.code === segments[0])) {
      router.push(`/${code}/`);
    } else {
      segments[0] = code;
      router.push(`/${segments.join("/")}/`);
    }
  };

  return (
    <div ref={ref} className={styles.root}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        {currentOption.code.toUpperCase()}
        <svg className={styles.caret} width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {open && (
        <ul className={styles.menu} role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <li key={option.code}>
              <button
                type="button"
                role="option"
                aria-selected={option.code === current}
                className={[styles.item, option.code === current && styles.itemActive]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => switchTo(option.code)}
              >
                <span>{option.native}</span>
                <span className={styles.itemCode}>{option.code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
