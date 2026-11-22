import { ResumeContent, EducationItem, ExperienceItem, ProjectItem, CertificationItem, SkillGroup } from "../../api/types";
import { isContentEmpty } from "../preview/isContentEmpty";
import { formatDates, cleanUrlDisplay } from "../preview/documentUtils";
import { isValidHttpUrl } from "../utils/sanitizer";

export const SECTION_ORDER = [
  "summary",
  "education",
  "skills",
  "experience",
  "projects",
  "certifications",
] as const;

export type SectionKey = (typeof SECTION_ORDER)[number];

export interface ContactPart {
  text: string;
  href?: string;
}

export interface HeaderModel {
  name: string;
  contactParts: ContactPart[];
}

export interface SummarySectionModel {
  kind: "summary";
  title: string;
  text: string;
}

export interface EducationEntryModel {
  id: string;
  institution: string;
  dates: string;
  subline: string;
}

export interface EducationSectionModel {
  kind: "education";
  title: string;
  entries: EducationEntryModel[];
}

export interface SkillEntryModel {
  id: string;
  category: string;
  itemsText: string;
}

export interface SkillsSectionModel {
  kind: "skills";
  title: string;
  entries: SkillEntryModel[];
}

export interface ExperienceEntryModel {
  id: string;
  jobTitle: string;
  dates: string;
  company: string;
  bullets: string[];
}

export interface ExperienceSectionModel {
  kind: "experience";
  title: string;
  entries: ExperienceEntryModel[];
}

export interface ProjectEntryModel {
  id: string;
  name: string;
  techStack: string;
  linkText: string;
  linkHref?: string;
  bullets: string[];
}

export interface ProjectsSectionModel {
  kind: "projects";
  title: string;
  entries: ProjectEntryModel[];
}

export interface CertificationEntryModel {
  id: string;
  name: string;
  issuer: string;
}

export interface CertificationsSectionModel {
  kind: "certifications";
  title: string;
  entries: CertificationEntryModel[];
}

export type SectionModel =
  | SummarySectionModel
  | EducationSectionModel
  | SkillsSectionModel
  | ExperienceSectionModel
  | ProjectsSectionModel
  | CertificationsSectionModel;

export interface ResumeModel {
  header: HeaderModel;
  sections: SectionModel[];
  isEmpty: boolean;
}

export function buildResumeModel(content: ResumeContent | null | undefined): ResumeModel {
  if (!content || isContentEmpty(content)) {
    return {
      header: { name: "", contactParts: [] },
      sections: [],
      isEmpty: true,
    };
  }

  const { basics, summary, education, experience, projects, certifications, skills } = content;

  // Header
  const contactParts: ContactPart[] = [];
  const trimmedEmail = (basics.email || "").trim();
  if (trimmedEmail) {
    contactParts.push({ text: trimmedEmail, href: `mailto:${trimmedEmail}` });
  }

  const trimmedPhone = (basics.phone || "").trim();
  if (trimmedPhone) {
    contactParts.push({ text: trimmedPhone });
  }

  const trimmedLoc = (basics.location || "").trim();
  if (trimmedLoc) {
    contactParts.push({ text: trimmedLoc });
  }

  (basics.links || []).forEach((link) => {
    const trimmedUrl = (link.url || "").trim();
    const trimmedLabel = (link.label || "").trim();
    if (trimmedUrl || trimmedLabel) {
      const display = trimmedLabel || cleanUrlDisplay(trimmedUrl);
      const isHttp = isValidHttpUrl(trimmedUrl);
      contactParts.push({
        text: display,
        href: isHttp ? trimmedUrl : undefined,
      });
    }
  });

  const header: HeaderModel = {
    name: (basics.fullName || "").trim(),
    contactParts,
  };

  const sections: SectionModel[] = [];

  for (const key of SECTION_ORDER) {
    switch (key) {
      case "summary": {
        const trimmedSummary = (summary || "").trim();
        if (trimmedSummary) {
          sections.push({
            kind: "summary",
            title: "Summary",
            text: trimmedSummary,
          });
        }
        break;
      }
      case "education": {
        const validEducation = (education || []).filter(
          (e: EducationItem) =>
            e.institution.trim() || e.degree.trim() || e.startDate.trim() || e.endDate.trim()
        );
        if (validEducation.length > 0) {
          const entries: EducationEntryModel[] = validEducation.map((edu) => {
            const dates = formatDates(edu.startDate, edu.endDate);
            const gradeText =
              edu.gradeValue !== null && typeof edu.gradeValue === "number"
                ? edu.gradeType === "cgpa"
                  ? `CGPA: ${edu.gradeValue}/10`
                  : `Percentage: ${edu.gradeValue}%`
                : "";
            const subline = [edu.degree.trim(), gradeText].filter(Boolean).join(" | ");
            return {
              id: edu.id || edu.institution,
              institution: edu.institution.trim(),
              dates,
              subline,
            };
          });
          sections.push({
            kind: "education",
            title: "Education",
            entries,
          });
        }
        break;
      }
      case "skills": {
        const validSkills = (skills || []).filter((s: SkillGroup) =>
          (s.items || []).some((item) => item.trim() !== "")
        );
        if (validSkills.length > 0) {
          const entries: SkillEntryModel[] = validSkills.map((sg) => {
            const items = sg.items.filter((i) => i.trim() !== "").join(", ");
            return {
              id: sg.id || sg.category.trim(),
              category: sg.category.trim(),
              itemsText: items,
            };
          });
          sections.push({
            kind: "skills",
            title: "Skills",
            entries,
          });
        }
        break;
      }
      case "experience": {
        const validExperience = (experience || []).filter(
          (e: ExperienceItem) =>
            e.jobTitle.trim() ||
            e.company.trim() ||
            (e.bullets && e.bullets.some((b) => b.trim() !== ""))
        );
        if (validExperience.length > 0) {
          const entries: ExperienceEntryModel[] = validExperience.map((exp) => {
            const dates = formatDates(exp.startDate, exp.endDate, exp.isCurrent);
            const validBullets = (exp.bullets || []).filter((b) => b.trim() !== "");
            return {
              id: exp.id || exp.jobTitle,
              jobTitle: exp.jobTitle.trim(),
              dates,
              company: exp.company.trim(),
              bullets: validBullets,
            };
          });
          sections.push({
            kind: "experience",
            title: "Experience",
            entries,
          });
        }
        break;
      }
      case "projects": {
        const validProjects = (projects || []).filter(
          (p: ProjectItem) =>
            p.name.trim() ||
            (p.techStack && p.techStack.some((t) => t.trim() !== "")) ||
            (p.bullets && p.bullets.some((b) => b.trim() !== ""))
        );
        if (validProjects.length > 0) {
          const entries: ProjectEntryModel[] = validProjects.map((proj) => {
            const tech = (proj.techStack || []).filter((t) => t.trim() !== "").join(", ");
            const validBullets = (proj.bullets || []).filter((b) => b.trim() !== "");
            const trimmedLink = (proj.link || "").trim();
            const isHttp = isValidHttpUrl(trimmedLink);
            return {
              id: proj.id || proj.name,
              name: proj.name.trim(),
              techStack: tech,
              linkText: trimmedLink ? cleanUrlDisplay(trimmedLink) : "",
              linkHref: isHttp ? trimmedLink : undefined,
              bullets: validBullets,
            };
          });
          sections.push({
            kind: "projects",
            title: "Projects",
            entries,
          });
        }
        break;
      }
      case "certifications": {
        const validCertifications = (certifications || []).filter(
          (c: CertificationItem) => c.name.trim() || c.issuer.trim()
        );
        if (validCertifications.length > 0) {
          const entries: CertificationEntryModel[] = validCertifications.map((cert) => ({
            id: cert.id || cert.name,
            name: cert.name.trim(),
            issuer: cert.issuer.trim(),
          }));
          sections.push({
            kind: "certifications",
            title: "Certifications",
            entries,
          });
        }
        break;
      }
    }
  }

  return {
    header,
    sections,
    isEmpty: false,
  };
}
