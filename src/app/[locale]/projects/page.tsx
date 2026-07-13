import { getTranslationsFromProps, LocalizationProps, locales } from '@/i18n';
import stylesheet from "@/tokens/stylesheet.module.css";
import styles from "./page.module.css";
import { ProjectCards } from '@/components';

type GitHubRepo = {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  fork: boolean;
};

async function getPublicRepos() {
  try {
    const response = await fetch(
      "https://api.github.com/users/sujatachaudhury/repos?sort=updated&direction=desc&per_page=12",
      {
        headers: {
          Accept: "application/vnd.github+json",
        },
      },
    );

    if (!response.ok) {
      return [];
    }

    const repos = (await response.json()) as GitHubRepo[];

    return repos.filter((repo) => !repo.fork);
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  return locales.map((locale) => ({
    locale,
  }));
}

export default async function Projects(props: LocalizationProps) {
  const translation = await getTranslationsFromProps(props);
  const repos = await getPublicRepos();
  
  return (
    <div className={styles.container}>
      <header className={`${stylesheet.h1} ${stylesheet.textAccent}`}>{translation.projects.title}</header>
      {/* <p className={`${stylesheet.body} ${stylesheet.textAccent} ${styles.description}`}>
        {translation.projects.description}
      </p> */}

      {/* <section className={styles.grid} aria-label={translation.projects.repositoryList}>
        {repos.length > 0 ? repos.map((repo) => (
          <article className={styles.project} key={repo.id}>
            <a className={styles.projectName} href={repo.html_url} target="_blank" rel="noreferrer">
              {repo.name}
            </a>
            <p className={styles.projectDescription}>
              {repo.description || translation.projects.noDescription}
            </p>
            <dl className={styles.meta}>
              {repo.language ? (
                <div className={styles.metaItem}>
                  <dt>{translation.projects.language}</dt>
                  <dd>{repo.language}</dd>
                </div>
              ) : null}
              <div className={styles.metaItem}>
                <dt>{translation.projects.stars}</dt>
                <dd>{repo.stargazers_count}</dd>
              </div>
              <div className={styles.metaItem}>
                <dt>{translation.projects.forks}</dt>
                <dd>{repo.forks_count}</dd>
              </div>
            </dl>
          </article>
        )) : (
          <p className={styles.empty}>{translation.projects.empty}</p>
        )}
      </section> */}

      <ProjectCards projects={translation['project-cards']} />


    </div>
  );
}
