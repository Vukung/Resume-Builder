import { ResumeContent, EducationItem, ExperienceItem, ProjectItem, CertificationItem, SkillGroup } from "../../api/types";

export function isContentEmpty(content: ResumeContent | null | undefined): boolean {
  if (!content) return true;

  const { basics, summary, education, experience, projects, certifications, skills } = content;

  const hasName = Boolean(basics?.fullName?.trim());
  const hasEmail = Boolean(basics?.email?.trim());
  const hasPhone = Boolean(basics?.phone?.trim());
  const hasLoc = Boolean(basics?.location?.trim());
  const hasLinks = (basics?.links || []).some(
    (l) => Boolean(l.url?.trim()) || Boolean(l.label?.trim())
  );
  const hasContact = hasEmail || hasPhone || hasLoc || hasLinks;

  const hasSummary = Boolean(summary?.trim());

  const validEducation = (education || []).filter(
    (e: EducationItem) =>
      Boolean(e.institution?.trim()) ||
      Boolean(e.degree?.trim()) ||
      Boolean(e.startDate?.trim()) ||
      Boolean(e.endDate?.trim())
  );

  const validSkills = (skills || []).filter((s: SkillGroup) => {
    const validItems = (s.items || []).filter((item) => item?.trim() !== "");
    return Boolean(s.category?.trim()) || validItems.length > 0;
  });

  const validExperience = (experience || []).filter(
    (e: ExperienceItem) =>
      Boolean(e.jobTitle?.trim()) ||
      Boolean(e.company?.trim()) ||
      (e.bullets && e.bullets.some((b) => b?.trim() !== ""))
  );

  const validProjects = (projects || []).filter(
    (p: ProjectItem) =>
      Boolean(p.name?.trim()) ||
      Boolean(p.link?.trim()) ||
      (p.techStack && p.techStack.some((t) => t?.trim() !== "")) ||
      (p.bullets && p.bullets.some((b) => b?.trim() !== ""))
  );

  const validCertifications = (certifications || []).filter(
    (c: CertificationItem) => Boolean(c.name?.trim()) || Boolean(c.issuer?.trim())
  );

  return (
    !hasName &&
    !hasContact &&
    !hasSummary &&
    validEducation.length === 0 &&
    validSkills.length === 0 &&
    validExperience.length === 0 &&
    validProjects.length === 0 &&
    validCertifications.length === 0
  );
}
