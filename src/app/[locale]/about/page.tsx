import { getTranslationsFromProps, LocalizationProps, locales } from '@/i18n';
import stylesheet from "@/tokens/stylesheet.module.css";
import styles from "./page.module.css";

export async function generateStaticParams() {
  return locales.map((locale) => ({
    locale,
  }));
}

export default async function About(props: LocalizationProps) {
  const translation = await getTranslationsFromProps(props);
  
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <header className={`${stylesheet.h1} ${stylesheet.textAccent} ${styles.title}`}>{translation.about.title}</header>
        <div className={styles.imageAndTextContent}>
          <div className={`${stylesheet.body} ${stylesheet.textAccent}`}>
            {translation.about.description}
          </div>
          <img src="/assets/sujata-background-hero.png"></img>
        </div>
      </div>
    </div>
  );
}
