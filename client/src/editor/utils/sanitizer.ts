import { ResumeContent } from "../../api/types";

export function isValidHttpUrl(val: string): boolean {
  if (!val || typeof val !== "string") return false;
  const trimmed = val.trim();
  if (trimmed === "") return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Pure sanitizer for autosave payloads.
 * - Any basics link url that is non-empty and not valid http/https becomes "".
 * - Any project link that is non-empty and not valid http/https becomes "".
 * - Any education gradeValue that is not a finite number within the range for its gradeType becomes null.
 * - Everything else is preserved unchanged.
 */
export function toSaveable(content: ResumeContent): ResumeContent {
  const sanitizedBasicsLinks = content.basics.links.map((link) => {
    const trimmed = link.url.trim();
    if (trimmed !== "" && !isValidHttpUrl(trimmed)) {
      return { ...link, url: "" };
    }
    return link;
  });

  const sanitizedEducation = (content.education || []).map((edu) => {
    let sanitizedGrade = edu.gradeValue;
    if (sanitizedGrade !== null) {
      if (typeof sanitizedGrade !== "number" || !Number.isFinite(sanitizedGrade)) {
        sanitizedGrade = null;
      } else if (edu.gradeType === "percentage") {
        if (sanitizedGrade < 0 || sanitizedGrade > 100) {
          sanitizedGrade = null;
        }
      } else if (edu.gradeType === "cgpa") {
        if (sanitizedGrade < 0 || sanitizedGrade > 10) {
          sanitizedGrade = null;
        }
      }
    }
    return {
      ...edu,
      gradeValue: sanitizedGrade,
    };
  });

  const sanitizedProjects = (content.projects || []).map((proj) => {
    const trimmed = (proj.link || "").trim();
    if (trimmed !== "" && !isValidHttpUrl(trimmed)) {
      return { ...proj, link: "" };
    }
    return proj;
  });

  return {
    ...content,
    basics: {
      ...content.basics,
      links: sanitizedBasicsLinks,
    },
    education: sanitizedEducation,
    projects: sanitizedProjects,
  };
}
