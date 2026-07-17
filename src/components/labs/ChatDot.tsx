"use client";

import { useEffect, useState } from "react";
import styles from "./ChatDot.module.css";

interface ChatDotProps {
  onClick: () => void;
  primaryLabel: string;
  metaLabel: string;
  a11yLabel: string;
}

/**
 * ChatDot — the low-visibility entry point.
 *
 * Fixed bottom-right, ~14px, colored with the ink token so it reads as
 * intentional but not attention-grabbing. Hover / focus reveals a two-line
 * tooltip: task label on top ("Ask about my work"), tech qualifier below
 * ("Local AI · beta") in muted monospace.
 *
 * Mounts after requestIdleCallback so it can't compete with the hero for
 * attention on first paint. Never rendered server-side.
 */
export function ChatDot({ onClick, primaryLabel, metaLabel, a11yLabel }: ChatDotProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const id = idle ? idle(() => setMounted(true)) : window.setTimeout(() => setMounted(true), 800);
    return () => {
      if (idle) window.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, []);

  if (!mounted) return null;

  return (
    <button type="button" className={styles.root} aria-label={a11yLabel} onClick={onClick}>
      <span className={styles.tooltip} role="tooltip">
        <span className={styles.tooltipPrimary}>{primaryLabel}</span>
        <span className={styles.tooltipMeta}>{metaLabel}</span>
      </span>
    </button>
  );
}
