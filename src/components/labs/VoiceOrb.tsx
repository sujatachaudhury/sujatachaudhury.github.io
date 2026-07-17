"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./VoiceOrb.module.css";

export type VoiceOrbState = "idle" | "listening" | "thinking" | "speaking" | "error";

/**
 * AmplitudeSource — the orb subscribes directly to a per-frame amplitude
 * stream rather than receiving it as a React prop. This is the critical
 * perf pattern: driving the orb's transform via setState() at 60Hz forces a
 * full app-wide re-reconcile every frame, which on a page also running
 * WebGPU inference locks the main thread. The Source lets us go
 * subscribe-once, write-DOM-directly instead.
 */
export interface AmplitudeSource {
  subscribe: (cb: (amp: number) => void) => () => void;
}

interface VoiceOrbProps {
  state: VoiceOrbState;
  amplitudeSource?: AmplitudeSource;
  caption: string;
  orbLabel: string;
  backToChatLabel: string;
  onBackToChat: () => void;
}

/**
 * VoiceOrb — voice-mode UI shaped as a pill that expands on tap.
 *
 * Closed: only the orb is visible on the right. It carries all voice-state
 * animations (idle breathing, listening pulse, thinking arc, speaking glow).
 *
 * Open (after clicking the orb): a second circle emerges from underneath
 * the orb and slides to the left, joined by a continuous pill-shaped
 * background so the two circles read as one shape. The second circle is an
 * icon-only button that returns to text chat.
 *
 * Accessibility:
 *   - The orb is a <button> with aria-haspopup="true" and aria-expanded.
 *   - Caption is a sibling role="status" region so state announcements
 *     don't collide with the button's accessible name.
 *   - The action button is aria-hidden when the pill is closed (visually
 *     hidden behind the orb) so AT users don't hit an unfocusable target.
 *   - Escape and outside-click both dismiss.
 */
const HINT_DELAY_MS = 250;
const HINT_HOLD_MS = 1600;

export function VoiceOrb({
  state,
  amplitudeSource,
  caption,
  orbLabel,
  backToChatLabel,
  onBackToChat,
}: VoiceOrbProps) {
  const orbRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const reactive = state === "listening" || state === "speaking";
  const [open, setOpen] = useState(false);

  /*
   * On first mount (i.e. when voice mode is entered), briefly reveal the
   * pill so users notice the "back to chat" affordance without needing to
   * discover the tap-to-open interaction on their own.
   *
   * Respects prefers-reduced-motion: users who opt out of motion don't want
   * gratuitous nudges either.
   *
   * Cancelled if the user opens the pill themselves during the hint window
   * (the state transition to open bypasses the auto-close timer).
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let userOpened = false;
    const openTimer = window.setTimeout(() => {
      if (userOpened) return;
      setOpen(true);
      // Close after the hold window, but only if the user hasn't kept it open.
      window.setTimeout(() => {
        setOpen((cur) => (userOpened ? cur : false));
      }, HINT_HOLD_MS);
    }, HINT_DELAY_MS);
    // Any manual toggle disables the auto-close half of the hint.
    const markUserInteracted = () => {
      userOpened = true;
    };
    const root = rootRef.current;
    root?.addEventListener("mousedown", markUserInteracted);
    root?.addEventListener("keydown", markUserInteracted);
    return () => {
      window.clearTimeout(openTimer);
      root?.removeEventListener("mousedown", markUserInteracted);
      root?.removeEventListener("keydown", markUserInteracted);
    };
  }, []);

  useEffect(() => {
    const el = orbRef.current;
    if (!el) return;
    if (!reactive || !amplitudeSource) {
      el.style.transform = "";
      return;
    }
    return amplitudeSource.subscribe((amp) => {
      const scale = 1 + Math.min(0.18, amp * 0.9);
      el.style.transform = `scale(${scale.toFixed(3)})`;
    });
  }, [amplitudeSource, reactive]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
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

  return (
    <div ref={rootRef} className={`${styles.root} ${styles[state]}`}>
      <div className={`${styles.pill} ${open ? styles.pillOpen : ""}`}>
        <span className={styles.pillBg} aria-hidden="true" />
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => {
            setOpen(false);
            onBackToChat();
          }}
          aria-label={backToChatLabel}
          aria-hidden={!open}
          tabIndex={open ? 0 : -1}
        >
          <svg className={styles.actionIcon} viewBox="0 0 24 24" aria-hidden="true">
            {/* Phosphor: chat-circle-text (regular) */}
            <path
              d="M12 3a9 9 0 0 0-9 9v7a2 2 0 0 0 2 2h7a9 9 0 0 0 0-18Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 11h8M8 15h5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className={styles.orbButton}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label={orbLabel}
        >
          <span ref={orbRef} className={styles.orb} aria-hidden="true" />
          {state === "thinking" && <span className={styles.arc} aria-hidden="true" />}
        </button>
      </div>
      <span role="status" aria-live="polite" className={styles.caption}>
        {caption}
      </span>
    </div>
  );
}
