"use client";

import { ReactNode } from "react";
import styles from "./ChatPanel.module.css";

interface ChatPanelProps {
  mode: "compact" | "expanded";
  titlePrimary: string;
  titleMeta: string;
  expandLabel: string;
  collapseLabel: string;
  closeLabel: string;
  onToggleMode: () => void;
  onClose: () => void;
  onExpandFromOverflow?: () => void;
  overflowHint?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * ChatPanel — the reusable container.
 *
 * Renders in one of two modes:
 *   - compact  → small floating panel bottom-right
 *   - expanded → centered overlay
 *
 * Doesn't know anything about chat state. Composition target: the caller
 * places messages inside as children and the input row as `footer`. Same
 * component covers both the disclosure/start state and the live-chat state.
 *
 * a11y: role="dialog", aria-modal only in expanded mode (compact is
 * non-modal — page content stays interactive).
 */
export function ChatPanel({
  mode,
  titlePrimary,
  titleMeta,
  expandLabel,
  collapseLabel,
  closeLabel,
  onToggleMode,
  onClose,
  onExpandFromOverflow,
  overflowHint,
  children,
  footer,
}: ChatPanelProps) {
  const isExpanded = mode === "expanded";
  return (
    <section
      className={`${styles.root} ${isExpanded ? styles.expanded : styles.compact}`}
      role="dialog"
      aria-modal={isExpanded || undefined}
      aria-label={titlePrimary}
    >
      <header className={styles.header}>
        <div className={styles.title}>
          <span className={styles.titlePrimary}>{titlePrimary}</span>
          <span className={styles.titleMeta}>{titleMeta}</span>
        </div>
        <button
          type="button"
          className={styles.headerBtn}
          onClick={onToggleMode}
          aria-label={isExpanded ? collapseLabel : expandLabel}
          title={isExpanded ? collapseLabel : expandLabel}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            {isExpanded ? (
              <path d="M4 4h6v6" stroke="currentColor" strokeWidth="1.5" fill="none" />
            ) : (
              <path d="M2 8v4h4M12 6V2H8" stroke="currentColor" strokeWidth="1.5" fill="none" />
            )}
          </svg>
        </button>
        <button
          type="button"
          className={styles.headerBtn}
          onClick={onClose}
          aria-label={closeLabel}
          title={closeLabel}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </header>
      <div className={styles.body}>{children}</div>
      {overflowHint && (
        <button type="button" className={styles.expandHint} onClick={onExpandFromOverflow}>
          {overflowHint}
        </button>
      )}
      {footer}
    </section>
  );
}
