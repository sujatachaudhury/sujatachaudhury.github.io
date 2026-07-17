import Link from "next/link";
import { AnchorHTMLAttributes, ReactNode } from "react";
import styles from "./TextLink.module.css";

export interface TextLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  external?: boolean;
  plain?: boolean;
  children: ReactNode;
}

/**
 * TextLink — inline anchor. Uses next/link for internal routes; falls back to
 * a native <a> for external URLs and mailto:/tel: schemes.
 *
 * Set `external` to render a small ↗ affordance and open in a new tab safely
 * (rel="noopener noreferrer"). Set `plain` to inherit color and drop the
 * underline (used inside navigation lists and cards).
 */
export function TextLink({ href, external, plain, children, className, ...rest }: TextLinkProps) {
  const classes = [styles.root, external && styles.external, plain && styles.plain, className]
    .filter(Boolean)
    .join(" ");

  const isExternal = external || /^(https?:|mailto:|tel:)/.test(href);

  if (isExternal) {
    return (
      <a
        href={href}
        className={classes}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
