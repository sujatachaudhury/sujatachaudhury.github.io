import styles from './Socials.module.css';
import { ReactNode } from 'react';

interface Social {
  name: string;
  url: string;
  icon: string | ReactNode;
}

interface SocialsProps {
  socials: Social[];
}

export function Socials({ socials }: SocialsProps) {
  return (
    <div className={styles.socialsContainer}>
      {socials.map((social, index) => (
        <a
          key={index}
          href={social.url}
          className={styles.socialLink}
          target="_blank"
          rel="noopener noreferrer"
          title={social.name}
        >
          <span className={styles.socialIcon}>
            {typeof social.icon === 'string' ? social.icon : social.icon}
          </span>
          <span className={styles.socialName}>{social.name}</span>
        </a>
      ))}
    </div>
  );
}