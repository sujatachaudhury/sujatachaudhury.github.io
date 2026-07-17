import Link from "next/link";
import {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  forwardRef,
  ReactNode,
} from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "ghost";
type Size = "sm" | "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  children?: ReactNode;
}

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    href?: undefined;
    loading?: boolean;
  };

type ButtonAsLink = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children"> & {
    href: string;
    external?: boolean;
    loading?: never;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/**
 * Button — polymorphic. Renders as:
 *   - <button>  when `href` is not provided
 *   - <a>       when `href` is a string (next/link for internal routes,
 *                plain <a> for external/mailto:/tel: URLs)
 *
 * Shared visual language: variant × size × leading/trailing slots.
 * `loading` is only valid on the <button> form since anchors have no busy state.
 *
 * Examples:
 *   <Button onClick={fn}>Save</Button>
 *   <Button variant="ghost" size="sm" loading>Saving</Button>
 *   <Button href={`/${locale}/work`}>Read my work</Button>
 *   <Button href="mailto:me@example.com" external>Email me</Button>
 */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const { variant = "primary", size = "md", leading, trailing, className, children } = props;

    const classes = [
      styles.root,
      variant === "ghost" && styles.ghost,
      size === "sm" && styles.small,
      size === "lg" && styles.large,
      "loading" in props && props.loading && styles.loading,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    if ("href" in props && props.href !== undefined) {
      const { href, external, ...anchorRest } = props;
      const isExternal = external || /^(https?:|mailto:|tel:)/.test(href);
      const content = (
        <>
          {leading}
          <span className={styles.label}>{children}</span>
          {trailing}
        </>
      );
      if (isExternal) {
        return (
          <a
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={href}
            className={classes}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            {...anchorRest}
          >
            {content}
          </a>
        );
      }
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          {...anchorRest}
        >
          {content}
        </Link>
      );
    }

    const { loading, disabled, ...buttonRest } = props;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={classes}
        aria-disabled={loading || disabled || undefined}
        aria-busy={loading || undefined}
        disabled={disabled}
        {...buttonRest}
      >
        {leading}
        <span className={styles.label}>{children}</span>
        {trailing}
        {loading && <span className={styles.spinner} aria-hidden="true" />}
      </button>
    );
  },
);
