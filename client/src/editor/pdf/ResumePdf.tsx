import React from "react";
import { Document, Page } from "@react-pdf/renderer";
import { ResumeModel } from "../shared/resumeModel";
import { styles } from "./pdfStyles";
import {
  ResumeHeader,
  SummarySection,
  EducationSection,
  SkillsSection,
  ExperienceSection,
  ProjectsSection,
  CertificationsSection,
} from "./PdfSections";

export {
  ResumeHeader,
  SummarySection,
  EducationSection,
  SkillsSection,
  ExperienceSection,
  ProjectsSection,
  CertificationsSection,
  BulletItem,
} from "./PdfSections";

interface ResumePdfProps {
  model: ResumeModel;
  resumeTitle?: string;
}

export const ResumePdf: React.FC<ResumePdfProps> = ({ model, resumeTitle }) => {
  const docTitle = model.header.name
    ? `${model.header.name} - Resume`
    : resumeTitle?.trim()
      ? `${resumeTitle.trim()} - Resume`
      : "Resume";
  const author = model.header.name || undefined;

  return (
    <Document title={docTitle} author={author} subject="Resume" creator="Resume Rocket">
      <Page size="A4" style={styles.page}>
        <ResumeHeader header={model.header} />
        {model.sections.map((section) => {
          switch (section.kind) {
            case "summary":
              return <SummarySection key="sec-summary" section={section} />;
            case "education":
              return <EducationSection key="sec-education" section={section} />;
            case "skills":
              return <SkillsSection key="sec-skills" section={section} />;
            case "experience":
              return <ExperienceSection key="sec-experience" section={section} />;
            case "projects":
              return <ProjectsSection key="sec-projects" section={section} />;
            case "certifications":
              return <CertificationsSection key="sec-certifications" section={section} />;
          }
        })}
      </Page>
    </Document>
  );
};
