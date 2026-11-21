import React, { memo } from "react";
import { ResumeContent, EducationItem, ExperienceItem, ProjectItem, CertificationItem, SkillGroup } from "../../api/types";
import { isContentEmpty } from "./isContentEmpty";
import { formatDates, cleanUrlDisplay } from "./documentUtils";
import "./resumeDocument.css";

export const SECTION_ORDER = [
  "summary",
  "education",
  "skills",
  "experience",
  "projects",
  "certifications",
] as const;

export type SectionKey = typeof SECTION_ORDER[number];

interface ResumeDocumentProps {
  content: ResumeContent;
}

export const ResumeDocument: React.FC<ResumeDocumentProps> = memo(({ content }) => {
  const { basics, summary, education, experience, projects, certifications, skills } = content;

  if (isContentEmpty(content)) {
    return (
      <div className="resume-document resume-document-empty">
        <p>Start typing and your resume appears here.</p>
      </div>
    );
  }

  // Contact items
  const contactParts: React.ReactNode[] = [];
  if (basics.email.trim()) {
    contactParts.push(<a key="email" href={`mailto:${basics.email.trim()}`}>{basics.email.trim()}</a>);
  }
  if (basics.phone.trim()) {
    contactParts.push(<span key="phone">{basics.phone.trim()}</span>);
  }
  if (basics.location.trim()) {
    contactParts.push(<span key="loc">{basics.location.trim()}</span>);
  }
  basics.links.forEach((link, idx) => {
    const trimmedUrl = link.url.trim();
    const trimmedLabel = link.label.trim();
    if (trimmedUrl || trimmedLabel) {
      const display = trimmedLabel || cleanUrlDisplay(trimmedUrl);
      contactParts.push(
        trimmedUrl ? (
          <a key={`link-${idx}`} href={trimmedUrl} target="_blank" rel="noreferrer">
            {display}
          </a>
        ) : (
          <span key={`link-${idx}`}>{display}</span>
        )
      );
    }
  });

  const validEducation = (education || []).filter(
    (e: EducationItem) => e.institution.trim() || e.degree.trim() || e.startDate.trim() || e.endDate.trim()
  );
  const validSkills = (skills || []).filter((s: SkillGroup) => (s.items || []).some((item) => item.trim() !== ""));
  const validExperience = (experience || []).filter(
    (e: ExperienceItem) => e.jobTitle.trim() || e.company.trim() || (e.bullets && e.bullets.some((b) => b.trim() !== ""))
  );
  const validProjects = (projects || []).filter(
    (p: ProjectItem) => p.name.trim() || (p.techStack && p.techStack.some((t) => t.trim() !== "")) || (p.bullets && p.bullets.some((b) => b.trim() !== ""))
  );
  const validCertifications = (certifications || []).filter((c: CertificationItem) => c.name.trim() || c.issuer.trim());

  const renderSection = (key: SectionKey) => {
    switch (key) {
      case "summary":
        if (!summary.trim()) return null;
        return <section key="sec-summary"><h2>Summary</h2><p>{summary.trim()}</p></section>;
      case "education":
        if (validEducation.length === 0) return null;
        return (
          <section key="sec-education">
            <h2>Education</h2>
            {validEducation.map((edu) => {
              const dates = formatDates(edu.startDate, edu.endDate);
              const gradeText = edu.gradeValue !== null && typeof edu.gradeValue === "number"
                ? edu.gradeType === "cgpa" ? `CGPA: ${edu.gradeValue}/10` : `Percentage: ${edu.gradeValue}%`
                : "";
              const subline = [edu.degree.trim(), gradeText].filter(Boolean).join(" | ");
              return (
                <div key={edu.id || edu.institution} className="entry-block">
                  <div className="item-row"><span className="item-title">{edu.institution}</span>{dates && <span className="item-date">{dates}</span>}</div>
                  {subline && <p className="item-subline">{subline}</p>}
                </div>
              );
            })}
          </section>
        );
      case "skills":
        if (validSkills.length === 0) return null;
        return (
          <section key="sec-skills">
            <h2>Skills</h2>
            {validSkills.map((sg) => {
              const items = sg.items.filter((i) => i.trim() !== "").join(", ");
              const cat = sg.category.trim();
              return (
                <p key={sg.id || cat} className="skills-line">
                  {cat ? <><span className="item-title">{cat}:</span> {items}</> : <span>{items}</span>}
                </p>
              );
            })}
          </section>
        );
      case "experience":
        if (validExperience.length === 0) return null;
        return (
          <section key="sec-experience">
            <h2>Experience</h2>
            {validExperience.map((exp) => {
              const dates = formatDates(exp.startDate, exp.endDate, exp.isCurrent);
              const validBullets = (exp.bullets || []).filter((b) => b.trim() !== "");
              return (
                <div key={exp.id || exp.jobTitle} className="entry-block">
                  <div className="item-row"><span className="item-title">{exp.jobTitle}</span>{dates && <span className="item-date">{dates}</span>}</div>
                  {exp.company && <p className="item-subline">{exp.company}</p>}
                  {validBullets.length > 0 && <ul>{validBullets.map((b, idx) => <li key={idx}>{b}</li>)}</ul>}
                </div>
              );
            })}
          </section>
        );
      case "projects":
        if (validProjects.length === 0) return null;
        return (
          <section key="sec-projects">
            <h2>Projects</h2>
            {validProjects.map((proj) => {
              const tech = (proj.techStack || []).filter((t) => t.trim() !== "").join(", ");
              const validBullets = (proj.bullets || []).filter((b) => b.trim() !== "");
              return (
                <div key={proj.id || proj.name} className="entry-block">
                  <div className="item-row">
                    <span><span className="item-title">{proj.name}</span>{tech && <span> | {tech}</span>}</span>
                    {proj.link && <span className="item-date"><a href={proj.link} target="_blank" rel="noreferrer">{cleanUrlDisplay(proj.link)}</a></span>}
                  </div>
                  {validBullets.length > 0 && <ul>{validBullets.map((b, idx) => <li key={idx}>{b}</li>)}</ul>}
                </div>
              );
            })}
          </section>
        );
      case "certifications":
        if (validCertifications.length === 0) return null;
        return (
          <section key="sec-certifications">
            <h2>Certifications</h2>
            {validCertifications.map((cert) => (
              <p key={cert.id || cert.name} className="item-subline">
                <span className="item-title">{cert.name}</span>{cert.issuer && <span> - {cert.issuer}</span>}
              </p>
            ))}
          </section>
        );
    }
  };

  const hasName = Boolean(basics.fullName.trim());
  const hasContact = contactParts.length > 0;

  return (
    <div className="resume-document">
      <header>
        {hasName && <h1>{basics.fullName}</h1>}
        {hasContact && (
          <p className="contact-line">
            {contactParts.map((part, index) => (
              <React.Fragment key={index}>
                {index > 0 && " | "}
                {part}
              </React.Fragment>
            ))}
          </p>
        )}
      </header>

      {SECTION_ORDER.map((key) => renderSection(key))}
    </div>
  );
});

ResumeDocument.displayName = "ResumeDocument";
