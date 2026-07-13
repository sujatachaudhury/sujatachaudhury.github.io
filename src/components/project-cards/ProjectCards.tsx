import styles from './ProjectCards.module.css';

interface Project {
  title: string;
  description: string;
  img: string;
}

interface ProjectsProps {
  projects: Project[];
}


export function ProjectCards({ projects }: ProjectsProps) {
  return (
    <ul className={styles.cards}>
      {projects.map((project, index) => (
        <li key={index} className={styles.projectItem}>
          <img className={styles.projectImage} src={project.img}></img>
          <div className={styles.projectDescription}>
            <div className={styles.projectTitle}>
              {project.title}
            </div>
            <div>
              {project.description}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}