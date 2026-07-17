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
  },
  {
    id: "survival",
    key: "items.survival",
    year: "2025",
    stack: ["Python", "R", "DICOM", "Cox PH"],
    status: "coursework",
    image: { src: "/assets/project-images/survival-analysis.png", alt: "Cardiac calcification survival analysis" },
  },
  {
    id: "mars",
    key: "items.mars",
    year: "2024",
    stack: ["PyTorch", "Segmentation", "MIoU"],
    status: "coursework",
    image: null,
  },
] as const;
