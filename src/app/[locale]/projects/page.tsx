import type { Metadata } from "next";
import Image from "next/image";
import {
  activeLocales,
  createTranslator,
  isLocale,
  loadMessages,
  localeMeta,
  type Locale,
} from "@/lib/i18n";
import { Tag } from "@/components/primitives";
import { projects } from "@/content/projects";
import styles from "./projects.module.css";

export function generateStaticParams() {
  return activeLocales.map((locale) => ({ locale }));
}

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const messages = await loadMessages(locale, ["projects"]);
  const t = createTranslator(locale, messages);
  return {
    title: t("page.title"),
    description: t("page.summary"),
    alternates: {
      canonical: `/${locale}/projects/`,
      languages: Object.fromEntries(
        activeLocales.map((code) => [localeMeta[code].bcp47, `/${code}/projects/`]),
      ),
    },
  };
}

export default async function ProjectsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const messages = await loadMessages(locale as Locale, ["projects"]);
  const t = createTranslator(locale as Locale, messages);

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("page.title")}</h1>
        <p className={styles.summary}>{t("page.summary")}</p>
      </header>

      <ol className={styles.list}>
        {projects.map((project) => (
          <li key={project.id} className={styles.item}>
            <div className={styles.imageWrap}>
              {project.image ? (
                <Image
                  src={project.image.src}
                  alt={project.image.alt}
                  width={640}
                  height={480}
                  sizes="(max-width: 720px) 100vw, 40vw"
                />
              ) : (
                <div className={styles.imagePlaceholder}>Figure</div>
              )}
            </div>
            <div className={styles.body}>
              <div className={styles.meta}>
                <Tag>{project.year}</Tag>
                <Tag>{t(`status.${project.status}`)}</Tag>
              </div>
              <h2 className={styles.projectTitle}><a href={project.href} style={{textDecoration:"none"}}>{t(`${project.key}.title`)}</a></h2>
              <p className={styles.projectSummary}>{t(`${project.key}.summary`)}</p>
              <p className={styles.projectBody}>{t(`${project.key}.body`)}</p>
              <div className={styles.stack}>
                {project.stack.map((tech) => (
                  <Tag key={tech}>{tech}</Tag>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
