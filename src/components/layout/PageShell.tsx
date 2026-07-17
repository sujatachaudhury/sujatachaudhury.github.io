import { HTMLAttributes, ReactNode } from "react";
import styles from "./PageShell.module.css";

interface PageShellProps {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

export function PageShell({ header, footer, children }: PageShellProps) {
  return (
    <div className={styles.shell}>
      {header}
      <main id="main" className={styles.main}>
        {children}
      </main>
      {footer}
    </div>
  );
}

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  width?: "page" | "narrow" | "prose";
  as?: "div" | "section" | "article";
}

export function Container({ width = "page", as = "div", className, children, ...rest }: ContainerProps) {
  const Element = as;
  const widthClass = width === "narrow" ? styles.narrow : width === "prose" ? styles.prose : "";
  return (
    <Element className={[styles.container, widthClass, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </Element>
  );
}

interface SectionProps extends HTMLAttributes<HTMLElement> {
  labelledBy?: string;
}

export function Section({ labelledBy, className, children, ...rest }: SectionProps) {
  return (
    <section
      className={[styles.section, className].filter(Boolean).join(" ")}
      aria-labelledby={labelledBy}
      {...rest}
    >
      {children}
    </section>
  );
}
