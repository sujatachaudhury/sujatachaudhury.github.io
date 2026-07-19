/**
 * Projects — untranslated metadata. Copy lives in projects.json.
 */

export interface Project {
  id: string;
  key: string;
  year: string;
  stack: readonly string[];
  status: "published" | "thesis" | "coursework" | "industry";
  image: {
    src: string;
    alt: string;
  } | null;
  href?: string;
}

export const projects: readonly Project[] = [
  {
    id: "vehicles",
    key: "items.vehicles",
    year: "2025",
    stack: ["Python", "OpenCV", "NumPy", "Projective geometry"],
    status: "coursework",
    image: { src: "/assets/project-images/vehicle-detection.png", alt: "Vehicle detection visualization" },
    href: "https://github.com/sujatachaudhury/self-supervised-denoising"
  },
  {
    id: "survival",
    key: "items.survival",
    year: "2025",
    stack: ["Python", "R", "DICOM", "Cox PH"],
    status: "coursework",
    image: { src: "/assets/project-images/survival-analysis.png", alt: "Cardiac calcification survival analysis" },
    href: "https://github.com/sujatachaudhury/survival-analysis-cox-model"
  },
  {
    id: "self-supervise",
    key: "items.self-supervise",
    year: "2026",
    stack: ["Python", "TensorFlow", "Docker"],
    status: "coursework",
    image: { src: "/assets/project-images/self-supervised-denoising.png", alt: "Self Supervised Denoising Methods Comparison" },
    href: "https://github.com/sujatachaudhury/vehicle-detection"
  },
  // {
  //   id: "mars",
  //   key: "items.mars",
  //   year: "2024",
  //   stack: ["PyTorch", "Segmentation", "MIoU"],
  //   status: "coursework",
  //   image: null,
  // },
] as const;
