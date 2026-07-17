/**
 * Bio knowledge base — the corpus retrieval-anchored chat draws from.
 *
 * Each chunk should:
 *   - Be self-contained (retrievable in isolation).
 *   - Prefer specifics over generalities (dates, tools, outcomes).
 *   - Be written in third person to match the "answers about Sujata" framing.
 *
 * `queries` are example prompts the chunk should match. Used to seed the
 * embedder at index time so retrieval is warm on paraphrases like
 * "what does she do?" hitting the identity chunk. Not shown to the user.
 *
 * Categories are informational only; retrieval ignores them but a scope
 * check ("does this question look like it's about Sujata?") uses them to
 * short-circuit off-topic prompts.
 */

export interface BioChunk {
  id: string;
  category: "identity" | "work" | "education" | "project" | "publication" | "skill" | "contact";
  queries: string[];
  body: string;
}

export const bioChunks: readonly BioChunk[] = [
  {
    id: "identity.role",
    category: "identity",
    queries: [
      "who is Sujata",
      "what does she do",
      "what is her job",
      "tell me about her",
      "what is her background",
    ],
    body: "Sujata Chaudhury is a Machine Learning and Computer Vision engineer with three years of industry experience building software in healthcare. She is currently finishing an Erasmus Mundus Joint Master's in Imaging across Politecnico di Milano and Tampere University, focused on image modelling and data-intensive imaging. She is seeking a Computer Vision or ML Engineering role.",
  },
  {
    id: "overview.projects",
    category: "project",
    queries: [
      "what projects has she worked on",
      "what are some of her projects",
      "tell me about her projects",
      "list her projects",
      "her portfolio projects",
      "what has she built",
      "which projects has she done",
      "give me her project list",
      "what are her key projects",
    ],
    body: "Sujata's main projects are: (1) Visual Analysis of Moving Vehicles — a geometric framework for vehicle motion analysis and collision detection using 3D reconstruction and projective geometry; (2) Cardiac Calcification and Survival — automated Agatston scoring from CT scans paired with Cox proportional-hazards survival analysis for lung-cancer patients; (3) Mars Terrain Segmentation — a deep-learning model for pixel-level classification of Mars orbital imagery. All three are described in more detail in their own sections.",
  },
  {
    id: "overview.experience",
    category: "work",
    queries: [
      "what is her work experience",
      "tell me about her experience",
      "where has she worked",
      "her past jobs",
      "what companies has she worked at",
      "her career",
      "professional experience",
      "job history",
    ],
    body: "Sujata has three years of industry experience. From June 2021 to August 2024 she worked as a Software Engineer at Optum in Bengaluru, India, on a C# and .NET healthcare data platform. Before Optum, she interned at IIT Kharagpur in summer 2019 building a WebRTC video-conferencing application, and completed a summer internship in India in 2020 doing full-stack development in .NET and Java Spring Boot.",
  },
  {
    id: "overview.education",
    category: "education",
    queries: [
      "what has she studied",
      "her education",
      "her degrees",
      "her academic background",
      "where did she study",
      "her qualifications",
      "her schooling",
    ],
    body: "Sujata is currently completing an MSc through the Erasmus Mundus Joint Masters in Imaging, jointly awarded by Politecnico di Milano and Tampere University, specializing in Image Modelling and Data-Intensive Imaging (2024 to present). She holds a Bachelor of Technology in Computer Science and Engineering from the National Institute of Technology, Agartala (2017 to 2021).",
  },
  {
    id: "overview.skills",
    category: "skill",
    queries: [
      "what are her skills",
      "what technologies does she know",
      "her tech stack",
      "her expertise",
      "what can she do technically",
      "her strengths",
    ],
    body: "Sujata's technical skills span programming (Python, C++, MATLAB, R, SQL, C# / .NET), machine learning (PyTorch, TensorFlow, neural networks), computer vision (image segmentation, feature extraction, OpenCV, 3D reconstruction, epipolar geometry), tools (Git, Linux, CI/CD, LaTeX), and web development (HTML5, CSS3, JavaScript, React, Angular). Her current focus is computer vision and ML.",
  },
  {
    id: "identity.location",
    category: "identity",
    queries: ["where is she based", "location", "where does she live", "which country"],
    body: "Sujata is currently based in Tampere, Finland, where she is completing the Tampere University leg of her Erasmus Mundus Master's. She previously lived and worked in Bengaluru, India during her time at Optum.",
  },
  {
    id: "work.optum",
    category: "work",
    queries: [
      "what did she do at Optum",
      "Optum experience",
      "her industry job",
      "software engineering experience",
      "healthcare work",
    ],
    body: "From June 2021 to August 2024, Sujata worked as a Software Engineer at Optum in Bengaluru, India. She built and maintained an enterprise C# and .NET healthcare data platform managing provider records for thousands of US medical professionals. She led design proposals to modernize a legacy provider-data system, improving maintainability and reducing technical debt on a business-critical service. She also proposed and presented an AI/ML-driven AutoML approach for automated model creation and hyperparameter tuning at the Optum Global Hackathon.",
  },
  {
    id: "work.internSummer",
    category: "work",
    queries: ["summer internship", "her first internship", "early work experience"],
    body: "In summer 2020, Sujata completed an internship in India doing full-stack development in .NET and Java Spring Boot inside an agile team.",
  },
  {
    id: "work.internIIT",
    category: "work",
    queries: [
      "IIT Kharagpur internship",
      "WebRTC project",
      "her first engineering role",
      "video conferencing project",
    ],
    body: "In summer 2019, Sujata interned as an Engineering Intern at IIT Kharagpur. She built a WebRTC application for video conferencing and content sharing on bandwidth-constrained networks, with STUN/TURN peer connectivity at near-zero cost, and developed frontend components in Vue.js.",
  },
  {
    id: "education.msc",
    category: "education",
    queries: [
      "Master's degree",
      "Erasmus Mundus",
      "Tampere University",
      "Politecnico di Milano",
      "current studies",
      "what is she studying",
    ],
    body: "Sujata is completing an MSc as part of the Erasmus Mundus Joint Masters in Imaging, jointly awarded by Politecnico di Milano and Tampere University. She specializes in Image Modelling and Data-Intensive Imaging. She began the program in September 2024 and is currently finishing it.",
  },
  {
    id: "education.btech",
    category: "education",
    queries: [
      "Bachelor's degree",
      "undergraduate",
      "NIT Agartala",
      "where did she do her B.Tech",
      "computer science degree",
    ],
    body: "From 2017 to 2021, Sujata earned a Bachelor of Technology in Computer Science and Engineering at the National Institute of Technology, Agartala, in Tripura, India.",
  },
  {
    id: "project.vehicles",
    category: "project",
    queries: [
      "vehicle detection project",
      "moving vehicles",
      "collision detection",
      "projective geometry",
      "3D reconstruction project",
    ],
    body: "Sujata's Visual Analysis of Moving Vehicles project is a geometric framework for vehicle motion analysis and collision detection built on 3D reconstruction and projective geometry. Given known camera intrinsics and standard vehicle dimensions, headlights become reliable reference points; projective geometry yields vanishing points, vehicle orientation, and — via back-projection and the law of cosines — real-world inter-vehicle distance. Built in Python with OpenCV.",
  },
  {
    id: "project.survival",
    category: "project",
    queries: [
      "cardiac calcification project",
      "survival analysis",
      "lung cancer",
      "radiotherapy",
      "medical imaging project",
      "Cox proportional hazards",
    ],
    body: "The Cardiac Calcification and Survival project investigates whether cardiac calcification, measured via an Agatston-style score, predicts overall survival in lung-cancer patients undergoing radiotherapy. Sujata automated cardiac calcification scoring from CT DICOM images in Python, then paired it with Cox proportional-hazards survival analysis in R. The pipeline turns imaging biomarkers into statistically testable predictors of patient outcomes.",
  },
  {
    id: "project.mars",
    category: "project",
    queries: [
      "Mars terrain project",
      "Mars segmentation",
      "planetary imaging",
      "deep learning segmentation project",
    ],
    body: "Sujata's Mars Terrain Segmentation project trains a deep-learning model for pixel-level classification of Mars orbital imagery, achieving high Mean Intersection-over-Union across terrain classes. The work emphasizes class balance, augmentation strategy, and boundary-aware loss. Built in PyTorch.",
  },
  {
    id: "publication.rnn",
    category: "publication",
    queries: [
      "IEEE publication",
      "RNN paper",
      "question answering paper",
      "her research",
      "MysuruCon",
    ],
    body: "Sujata co-authored 'Improving performance of Recurrent Neural Networks for Question-Answering with Attention-based Context Reduction,' published at IEEE MysuruCon 2021 by IEEE (DOI: 10.1109/MysuruCon52639.2021.9641626). Co-authors: Sagnik Modak, Sujata Chaudhury, Abhishek Rawat, and Suman Deb.",
  },
  {
    id: "skill.programming",
    category: "skill",
    queries: ["programming languages", "what languages does she know", "coding skills"],
    body: "Sujata's programming languages include Python, C++, MATLAB, R, SQL, and C# / .NET. She has a strong grounding in object-oriented programming, data structures, and algorithms.",
  },
  {
    id: "skill.ml",
    category: "skill",
    queries: ["ML skills", "machine learning experience", "PyTorch", "TensorFlow", "neural networks"],
    body: "In machine learning, Sujata works with PyTorch and TensorFlow for neural networks — from tabular models through pixel-level segmentation classifiers.",
  },
  {
    id: "skill.cv",
    category: "skill",
    queries: [
      "computer vision skills",
      "OpenCV",
      "image segmentation",
      "3D reconstruction",
      "epipolar geometry",
    ],
    body: "In computer vision, Sujata's areas include image segmentation, feature extraction, image processing pipelines, OpenCV, 3D reconstruction, and epipolar geometry.",
  },
  {
    id: "skill.web",
    category: "skill",
    queries: ["web development", "frontend skills", "React", "Angular"],
    body: "For web development Sujata has worked in HTML5, CSS3, JavaScript, React, and Angular — though her focus has shifted toward ML and computer vision.",
  },
  {
    id: "skill.tools",
    category: "skill",
    queries: ["tools", "development environment", "Git", "Linux", "LaTeX"],
    body: "Sujata's tooling includes Git, Linux, CI/CD, and LaTeX.",
  },
  {
    id: "contact.reach",
    category: "contact",
    queries: [
      "how to contact her",
      "email",
      "reach out",
      "hiring",
      "get in touch",
      "LinkedIn",
      "GitHub",
    ],
    body: "The best way to reach Sujata is via email at sujata.chaudhury@gmail.com. She's also on LinkedIn at linkedin.com/in/sujata-chaudhury and GitHub at github.com/sujatachaudhury. She's open to Computer Vision and ML Engineering roles, available for interviews anywhere in the EU and remotely elsewhere.",
  },
];
