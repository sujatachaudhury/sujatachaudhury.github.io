import { HTMLAttributes } from "react";
import styles from "./Tag.module.css";

/**
 * Tag — small metadata pill (skills, dates, filters).
 * Not interactive; renders as <span>. If you need it clickable,
 * wrap in a button or TextLink.
 */
export function Tag({ className, children, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={[styles.root, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </span>
  );
}
