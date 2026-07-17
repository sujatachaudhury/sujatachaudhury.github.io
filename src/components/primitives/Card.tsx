import { HTMLAttributes } from "react";
import styles from "./Card.module.css";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "article" | "section" | "div" | "li";
  interactive?: boolean;
}

/**
 * Card — bordered container. No shadow, no radius above 4px.
 * Use `as="article"` for self-contained content (project, publication),
 * `as="li"` when a Card sits inside a semantic list.
 */
export function Card({ as = "article", interactive, className, children, ...rest }: CardProps) {
  const Element = as;
  const classes = [styles.root, interactive && styles.interactive, className].filter(Boolean).join(" ");
  return (
    <Element className={classes} {...rest}>
      {children}
    </Element>
  );
}
