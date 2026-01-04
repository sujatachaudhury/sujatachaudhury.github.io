import styles from './NeonSign.module.css';

interface NeonSignProps {
  text: string;
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'inverse';
  size?: 'small' | 'medium' | 'large';
}

export function NeonSign({ 
  text, 
  color = 'accent', 
  size = 'medium' 
}: NeonSignProps) {
  return (
    <div className={`${styles.neonSign} ${styles[color]} ${styles[size]}`}>
      <span className={styles.text}>{text}</span>
    </div>
  );
}