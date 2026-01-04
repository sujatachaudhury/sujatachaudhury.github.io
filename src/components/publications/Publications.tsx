import styles from './Publications.module.css';

interface Publication {
  title: string;
  url: string;
  authors: string;
  date: string;
  publisher: string;
  journal?: string;
  conference?: string;
  doi?: string;
}

interface PublicationsProps {
  publications: Publication[];
}

export function Publications({ publications }: PublicationsProps) {
  return (
    <ul className={styles.publicationList}>
      {publications.map((publication, index) => (
        <li key={index} className={styles.publicationItem}>
          <a href={publication.url} className={styles.publicationLink}>
            <div className={styles.publicationTitle}>
              {publication.title}
            </div>
            <div className={styles.publicationMeta}>
              <span className={styles.publicationAuthors}>
                {publication.authors}
              </span>
              <span className={styles.publicationVenue}>
                {publication.journal || publication.conference}
              </span>
              <span className={styles.publicationDate}>{publication.date}</span>
              <span className={styles.publicationPublisher}>{publication.publisher}</span>
              {publication.doi && (
                <span className={styles.publicationDoi}>DOI: {publication.doi}</span>
              )}
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}