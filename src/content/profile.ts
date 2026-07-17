/**
 * Untranslated facts about the person. Labels come from i18n; these are
 * data points that don't translate: names, URLs, dates, coordinates.
 */
export const profile = {
  fullName: "Sujata Chaudhury",
  givenName: "Sujata",
  familyName: "Chaudhury",
  email: "sujata.chaudhury@gmail.com",
  phone: "+358 44 941 2850",
  location: {
    city: "Tampere",
    country: "Finland",
    countryCode: "FI",
  },
  urls: {
    website: "https://sujatachaudhury.github.io",
    linkedin: "https://linkedin.com/in/sujata-chaudhury",
    github: "https://github.com/sujatachaudhury",
  },
  yearsOfIndustryExperience: 3,
  photo: {
    src: "/assets/sujata-background-hero.png",
    alt: "Portrait of Sujata Chaudhury",
  },
} as const;

export const skills = {
  programming: ["Python", "C++", "MATLAB", "R", "SQL", "C#", ".NET"],
  ml: ["PyTorch", "TensorFlow", "Neural networks", "Machine learning"],
  cv: [
    "Image segmentation",
    "Feature extraction",
    "OpenCV",
    "3D reconstruction",
    "Epipolar geometry",
    "Image processing pipelines",
  ],
  tools: ["Git", "Linux", "CI/CD", "LaTeX"],
  web: ["HTML5", "CSS3", "JavaScript", "React", "Angular"],
} as const;
