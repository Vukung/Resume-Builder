export interface LinkItem {
  label: string;
  url: string;
}

export interface Basics {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  links: LinkItem[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
  gradeType: "percentage" | "cgpa";
  gradeValue: number | null;
}

export interface ExperienceItem {
  id: string;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  bullets: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  techStack: string[];
  link: string;
  bullets: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
}

export interface SkillGroup {
  id: string;
  category: string;
  items: string[];
}

export interface ResumeContent {
  schemaVersion: 1;
  basics: Basics;
  summary: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  skills: SkillGroup[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  isDemo: boolean;
}

export interface ResumeSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Resume extends ResumeSummary {
  content: ResumeContent;
}

export interface ApiErrorField {
  path: string;
  message: string;
}

export interface ApiErrorPayload {
  error: string;
  fields?: ApiErrorField[];
}
