import { TextLink } from "@/components/primitives";
import styles from "./Footer.module.css";

interface FooterLink {
  href: string;
  label: string;
  external?: boolean;
}

interface FooterProps {
  name: string;
  tagline: string;
  links: FooterLink[];
  colophon: string;
}

export function Footer({ name, tagline, links, colophon }: FooterProps) {
  return (
    <footer className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.meta}>
          <span className={styles.name}>{name}</span>
          <span>{tagline}</span>
          <small>{colophon}</small>
        </div>
        <ul className={styles.links}>
          {links.map((link) => (
            <li key={link.href}>
              <TextLink href={link.href} external={link.external} plain>
                {link.label}
              </TextLink>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
