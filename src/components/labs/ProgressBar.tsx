import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  /** 0..1 */
  progress: number;
  caption?: string;
}

/**
 * ProgressBar — thin horizontal indicator used for model download progress.
 * Purely visual; no aria-progressbar role because it's paired with a live
 * text caption that carries the state for AT.
 */
export function ProgressBar({ progress, caption }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <div className={styles.root}>
      <div className={styles.track} aria-hidden="true">
        <div className={styles.fill} style={{ inlineSize: `${pct}%` }} />
      </div>
      {caption && (
        <span className={styles.caption} aria-live="polite">
          {caption}
        </span>
      )}
    </div>
  );
}
