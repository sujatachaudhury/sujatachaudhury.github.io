"use client";

import { FormEvent, KeyboardEvent, useRef, useState } from "react";
import styles from "./ChatInput.module.css";

interface ChatInputProps {
  onSend: (text: string) => void;
  onToggleVoice: () => void;
  disabled?: boolean;
  voiceActive: boolean;
  placeholder: string;
  sendLabel: string;
  voiceLabelOn: string;
  voiceLabelOff: string;
}

/**
 * ChatInput — one-line text field, send button, and voice toggle.
 *
 * Cmd/Ctrl+Enter or Enter submits (no Shift+Enter multiline — kept single
 * line to match the compact panel's constraints; users can still paste long
 * questions). Auto-clears on send.
 */
export function ChatInput({
  onSend,
  onToggleVoice,
  disabled,
  voiceActive,
  placeholder,
  sendLabel,
  voiceLabelOn,
  voiceLabelOff,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    ref.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form className={styles.root} onSubmit={submit}>
      <textarea
        ref={ref}
        className={styles.field}
        rows={1}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        aria-label={placeholder}
      />
      <button
        type="button"
        className={styles.iconButton}
        onClick={onToggleVoice}
        aria-pressed={voiceActive}
        aria-label={voiceActive ? voiceLabelOn : voiceLabelOff}
      >
        <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true">
          <rect x="6" y="2" width="4" height="8" rx="2" fill="currentColor" />
          <path d="M4 8a4 4 0 0 0 8 0M8 12v3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      <button
        type="submit"
        className={`${styles.iconButton} ${styles.sendButton}`}
        disabled={disabled || value.trim().length === 0}
        aria-label={sendLabel}
      >
        <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true">
          <path d="M2 8l12-6-4 14-3-6-5-2z" fill="currentColor" />
        </svg>
      </button>
    </form>
  );
}
