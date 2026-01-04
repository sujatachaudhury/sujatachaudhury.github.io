import Image from 'next/image';
import { getTranslationsFromProps, LocalizationProps, locales } from '@/i18n';
import { Eyes, ActionItem, Socials } from '@/components';
import stylesheet from '@/tokens/stylesheet.module.css';
import styles from './page.module.css';

export async function generateStaticParams() {
  return locales.map((locale) => ({
    locale,
  }));
}

export default async function Page(props: LocalizationProps) {
  const translation = await getTranslationsFromProps(props);

  return <main className={styles.container}>
    <header className={styles.header}>
      <h1 className={styles.title}>
        {translation.main.title}
      </h1>
      <p className={styles.tagline}>
        {translation.main.tagline}
      </p>
    </header>
    <div className={styles.content}>
      <div className={styles.firstSection}>
        <div className={styles.firstSectionTitle}>
          <p>{translation.main.sections.first.title}</p>
          <Eyes />
        </div>
        <p className={styles.firstSectionSubtitle}>
          {translation.main.sections.first.subtitle}
        </p>
      </div>
      <div>
        <p className={`${stylesheet.h3} ${stylesheet.textInverse}`}>{translation.main.sections.publications.title}</p>
        <hr />
        <ActionItem items={[
          {
            title: "Improving performance of Recurrent Neural Networks for Question-Answering with Attention-based Context Reduction",
            url: "https://ieeexplore.ieee.org/abstract/document/9641626",
            authors: "Sagnik Modak; Sujata Chaudhury; Abhishek Rawat; Suman Deb",
            props: {
              date: "October, 2021",
              publisher: "IEEE",
              journal: "IEEE MysuruCon 2021",
              doi: "DOI: 10.1109/MysuruCon52639.2021.9641626"
            }
          }
        ]} />
      </div>
      <div>
        <p className={`${stylesheet.h3} ${stylesheet.textInverse}`}>{translation.main.sections.degrees.title}</p>
        <hr />
        <ActionItem items={[
          {
            title: "Masters in Image Modeling and Data Intensive Imaging",
            props: {
              date: "2024 - Present",
              program: "Erasmus Mundus Joint Masters in Imaging",
              institution: "University of Tampere",
              location: "Tampere, Finland"
            }
          },
          {
            title: "Bachelors of Technology in Computer Science and Engineering",
            props: {
              date: "2017 - 2021",
              institution: "National Institute of Technology, Agartala",
              location: "Tripura, India"
            }
          }
        ]} />
      </div>
      <div>
        <p className={`${stylesheet.h3} ${stylesheet.textInverse}`}>{translation.main.sections.experience.title}</p>
        <hr />
        <ActionItem items={[
          {
            title: "Software Developer",
            props: {
              date: "2021 - 2024",
              company: "Optum",
              location: "Bangalore, Karnataka, India"
            }
          }
        ]} />
      </div>
      <div>
        <p className={`${stylesheet.h3} ${stylesheet.textInverse}`}>{translation.main.sections.socials.title}</p>
        <hr />
        <Socials socials={[
          {
            name: translation.main.sections.socials.linkedin,
            url: "https://linkedin.com/in/sujata-chaudhury",
            icon: <Image src="/assets/linkedin.svg" alt="LinkedIn" width={20} height={20} />
          },
          {
            name: translation.main.sections.socials.github,
            url: "https://github.com/sujatachaudhury",
            icon: <Image src="/assets/github.svg" alt="GitHub" width={20} height={20} />
          },
          {
            name: translation.main.sections.socials.email,
            url: "mailto:sujata.chaudhury@gmail.com",
            icon: <Image src="/assets/gmail.svg" alt="Email" width={20} height={20} />
          }
        ]} />
      </div>
    </div>
  </main>;
};
