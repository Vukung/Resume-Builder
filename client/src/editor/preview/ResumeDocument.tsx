import React, { memo, useMemo } from "react";
import { ResumeContent } from "../../api/types";
import {
  ResumeModel,
  SectionModel,
  buildResumeModel,
  SECTION_ORDER,
  SectionKey,
} from "../shared/resumeModel";
import "./resumeDocument.css";

export { SECTION_ORDER };
export type { SectionKey };

interface ResumeDocumentProps {
  content?: ResumeContent;
  model?: ResumeModel;
}

export const ResumeDocument: React.FC<ResumeDocumentProps> = memo(({ content, model: propModel }) => {
  const model = useMemo(() => {
    if (propModel) return propModel;
    return buildResumeModel(content);
  }, [content, propModel]);

  if (model.isEmpty) {
    return (
      <div className="resume-document resume-document-empty">
        <p>Start typing and your resume appears here.</p>
      </div>
    );
  }

  const renderSection = (section: SectionModel) => {
    switch (section.kind) {
      case "summary":
        return (
          <section key="sec-summary">
            <h2>{section.title}</h2>
            <p>{section.text}</p>
          </section>
        );
      case "education":
        return (
          <section key="sec-education">
            <h2>{section.title}</h2>
            {section.entries.map((edu) => (
              <div key={edu.id} className="entry-block">
                <div className="item-row">
                  <span className="item-title">{edu.institution}</span>
                  {edu.dates && <span className="item-date">{edu.dates}</span>}
                </div>
                {edu.subline && <p className="item-subline">{edu.subline}</p>}
              </div>
            ))}
          </section>
        );
      case "skills":
        return (
          <section key="sec-skills">
            <h2>{section.title}</h2>
            {section.entries.map((sg) => (
              <p key={sg.id} className="skills-line">
                {sg.category ? (
                  <>
                    <span className="item-title">{sg.category}:</span> {sg.itemsText}
                  </>
                ) : (
                  <span>{sg.itemsText}</span>
                )}
              </p>
            ))}
          </section>
        );
      case "experience":
        return (
          <section key="sec-experience">
            <h2>{section.title}</h2>
            {section.entries.map((exp) => (
              <div key={exp.id} className="entry-block">
                <div className="item-row">
                  <span className="item-title">{exp.jobTitle}</span>
                  {exp.dates && <span className="item-date">{exp.dates}</span>}
                </div>
                {exp.company && <p className="item-subline">{exp.company}</p>}
                {exp.bullets.length > 0 && (
                  <ul>
                    {exp.bullets.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        );
      case "projects":
        return (
          <section key="sec-projects">
            <h2>{section.title}</h2>
            {section.entries.map((proj) => (
              <div key={proj.id} className="entry-block">
                <p className="project-title-line">
                  <span className="item-title">{proj.name}</span>
                  {proj.techStack && <span> | {proj.techStack}</span>}
                </p>
                {proj.linkText && (
                  <p className="project-link-line">
                    {proj.linkHref ? (
                      <a href={proj.linkHref} target="_blank" rel="noreferrer">
                        {proj.linkText}
                      </a>
                    ) : (
                      <span>{proj.linkText}</span>
                    )}
                  </p>
                )}
                {proj.bullets.length > 0 && (
                  <ul>
                    {proj.bullets.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        );
      case "certifications":
        return (
          <section key="sec-certifications">
            <h2>{section.title}</h2>
            {section.entries.map((cert) => (
              <p key={cert.id} className="item-subline">
                <span className="item-title">{cert.name}</span>
                {cert.issuer && <span> - {cert.issuer}</span>}
              </p>
            ))}
          </section>
        );
    }
  };

  const hasName = Boolean(model.header.name);
  const hasContact = model.header.contactParts.length > 0;

  return (
    <div className="resume-document">
      <header>
        {hasName && <h1>{model.header.name}</h1>}
        {hasContact && (
          <p className="contact-line">
            {model.header.contactParts.map((part, index) => (
              <React.Fragment key={index}>
                {index > 0 && " | "}
                {part.href ? (
                  <a href={part.href} target="_blank" rel="noreferrer">
                    {part.text}
                  </a>
                ) : (
                  <span>{part.text}</span>
                )}
              </React.Fragment>
            ))}
          </p>
        )}
      </header>

      {model.sections.map((section) => renderSection(section))}
    </div>
  );
});

ResumeDocument.displayName = "ResumeDocument";
