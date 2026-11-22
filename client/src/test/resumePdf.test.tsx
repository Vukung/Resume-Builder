import React from "react";
import { describe, it, expect } from "vitest";
import { ResumePdf } from "../editor/pdf/ResumePdf";
import { buildResumeModel, SECTION_ORDER } from "../editor/shared/resumeModel";
import { ResumeContent } from "../api/types";

const fixtureContent: ResumeContent = {
  schemaVersion: 1,
  basics: {
    fullName: "Priya Sharma",
    email: "priya@example.com",
    phone: "+91 98765 43210",
    location: "Bengaluru, India",
    links: [
      { label: "Portfolio", url: "https://priya.dev" },
      { label: "", url: "https://github.com/priyasharma" },
    ],
  },
  summary: "Senior Frontend Engineer specializing in accessible React interfaces and performance tuning.",
  education: [
    {
      id: "edu-1",
      institution: "Indian Institute of Technology",
      degree: "B.Tech in Computer Science",
      startDate: "2018-08",
      endDate: "2022-05",
      gradeType: "cgpa",
      gradeValue: 9.1,
    },
  ],
  skills: [
    {
      id: "sk-1",
      category: "Languages",
      items: ["TypeScript", "JavaScript", "HTML/CSS"],
    },
  ],
  experience: [
    {
      id: "exp-1",
      jobTitle: "Lead Frontend Engineer",
      company: "Tech Innovations",
      startDate: "2022-06",
      endDate: "",
      isCurrent: true,
      bullets: ["Spearheaded design system adoption.", "Reduced bundle size by 35%."],
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "Resume Rocket",
      techStack: ["React", "TypeScript", "Vite"],
      link: "https://github.com/priya/resume-rocket",
      bullets: ["Built real-time editor preview."],
    },
  ],
  certifications: [
    {
      id: "cert-1",
      name: "AWS Certified Developer",
      issuer: "Amazon Web Services",
    },
  ],
};

/**
 * Recursively walks the react-pdf element tree, expanding function components
 * until it reaches react-pdf primitives, and collects all string and number text nodes.
 */
function extractTextFromTree(element: unknown): string[] {
  if (element == null || typeof element === "boolean") return [];
  if (typeof element === "string" || typeof element === "number") {
    const trimmed = String(element).trim();
    return trimmed ? [trimmed] : [];
  }
  if (Array.isArray(element)) {
    return element.flatMap(extractTextFromTree);
  }
  if (React.isValidElement(element)) {
    // If element.type is a custom function component, expand it
    if (typeof element.type === "function") {
      const rendered = (element.type as (props: unknown) => React.ReactNode)(element.props);
      return extractTextFromTree(rendered);
    }
    // Primitive react-pdf component (Document, Page, View, Text, Link)
    return extractTextFromTree((element.props as { children?: React.ReactNode }).children);
  }
  return [];
}

describe("ResumePdf component tree", () => {
  it("renders Document props carrying the title and author, and falls back to resumeTitle", () => {
    const model = buildResumeModel(fixtureContent);
    const element = <ResumePdf model={model} resumeTitle="My Master Resume" />;

    expect(element.props.model).toBe(model);
    const rendered = ResumePdf(element.props) as React.ReactElement<import("@react-pdf/renderer").DocumentProps>;

    // Document props
    expect(rendered.props.title).toBe("Priya Sharma - Resume");
    expect(rendered.props.author).toBe("Priya Sharma");
    expect(rendered.props.subject).toBe("Resume");
    expect(rendered.props.creator).toBe("Resume Rocket");

    // When full name is empty, document title uses resumeTitle
    const noNameModel = buildResumeModel({
      ...fixtureContent,
      basics: { ...fixtureContent.basics, fullName: "" },
    });
    const elementNoName = <ResumePdf model={noNameModel} resumeTitle="Software Engineer" />;
    const renderedNoName = ResumePdf(elementNoName.props) as React.ReactElement<import("@react-pdf/renderer").DocumentProps>;
    expect(renderedNoName.props.title).toBe("Software Engineer - Resume");
    expect(renderedNoName.props.author).toBeUndefined();
  });

  it("walks element tree, asserts all model texts appear and section titles are in SECTION_ORDER", () => {
    const model = buildResumeModel(fixtureContent);
    const element = <ResumePdf model={model} resumeTitle="Priya's Resume" />;
    const allTexts = extractTextFromTree(element);
    const fullText = allTexts.join(" ");

    // Verify name and contact parts
    expect(fullText).toContain("Priya Sharma");
    expect(fullText).toContain("priya@example.com");
    expect(fullText).toContain("+91 98765 43210");
    expect(fullText).toContain("Bengaluru, India");
    expect(fullText).toContain("Portfolio");
    expect(fullText).toContain("github.com/priyasharma");

    // Verify section titles appear in exact SECTION_ORDER
    const foundIndices = SECTION_ORDER.map((key) => {
      const section = model.sections.find((s) => s.kind === key);
      expect(section).toBeDefined();
      const index = allTexts.indexOf(section!.title);
      expect(index).toBeGreaterThanOrEqual(0);
      return index;
    });

    for (let i = 1; i < foundIndices.length; i++) {
      expect(foundIndices[i]).toBeGreaterThan(foundIndices[i - 1]);
    }

    // Summary
    expect(fullText).toContain("Senior Frontend Engineer specializing in accessible React interfaces");

    // Education
    expect(fullText).toContain("Indian Institute of Technology");
    expect(fullText).toContain("Aug 2018 - May 2022");
    expect(fullText).toContain("B.Tech in Computer Science | CGPA: 9.1/10");

    // Skills
    expect(fullText).toContain("Languages");
    expect(fullText).toContain("TypeScript, JavaScript, HTML/CSS");

    // Experience
    expect(fullText).toContain("Lead Frontend Engineer");
    expect(fullText).toContain("Jun 2022 - Present");
    expect(fullText).toContain("Tech Innovations");
    expect(fullText).toContain("Spearheaded design system adoption.");
    expect(fullText).toContain("Reduced bundle size by 35%.");

    // Projects
    expect(fullText).toContain("Resume Rocket");
    expect(fullText).toContain("React, TypeScript, Vite");
    expect(fullText).toContain("github.com/priya/resume-rocket");
    expect(fullText).toContain("Built real-time editor preview.");

    // Certifications
    expect(fullText).toContain("AWS Certified Developer");
    expect(fullText).toContain("Amazon Web Services");
  });
});
