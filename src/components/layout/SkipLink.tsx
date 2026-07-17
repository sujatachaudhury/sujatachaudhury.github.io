import styles from "./SkipLink.module.css";

/**
 * SkipLink — visually hidden until focused. First tab stop on every page.
 * Anchors to <main id="main">. Do not remove.
 */
export function SkipLink({ label }: { label: string }) {
  return (
    <a className={styles.root} href="#main">
      {label}
    </a>
  );
}
