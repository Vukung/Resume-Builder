import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResumeDocument, SECTION_ORDER } from "../editor/preview/ResumeDocument";
import { ResumeContent } from "../api/types";

const cssRaw = fs.readFileSync(
  path.resolve(__dirname, "../editor/preview/resumeDocument.css"),
  "utf-8"
);

describe("ResumeDocument", () => {
  const fullFixture: ResumeContent = {
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
      {
        id: "edu-2",
        institution: "High School",
        degree: "Higher Secondary",
        startDate: "2016-06",
        endDate: "2018-04",
        gradeType: "percentage",
        gradeValue: 95,
      },
    ],
    skills: [
      {
        id: "sk-1",
        category: "Languages",
        items: ["TypeScript", "JavaScript", "HTML/CSS"],
      },
      {
        id: "sk-2",
        category: "Frameworks",
        items: ["React", "Next.js", "Tailwind CSS"],
      },
      {
        id: "sk-3",
        category: "",
        items: ["Git", "Docker"],
      },
      {
        id: "sk-empty",
        category: "Empty Group",
        items: ["", "  "],
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
        bullets: ["Built real-time editor preview.", ""],
      },
    ],
    certifications: [
      {
        id: "cert-1",
        name: "AWS Certified Developer",
        issuer: "Amazon Web Services",
      },
      {
        id: "cert-2",
        name: "Independent Project Lead",
        issuer: "",
      },
    ],
  };

  it("renders full fixture in exact section order: Summary, Education, Skills, Experience, Projects, Certifications", () => {
    expect(SECTION_ORDER).toEqual([
      "summary",
      "education",
      "skills",
      "experience",
      "projects",
      "certifications",
    ]);

    render(<ResumeDocument content={fullFixture} />);

    // Header check
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Priya Sharma");
    expect(screen.getByText("priya@example.com")).toBeInTheDocument();
    expect(screen.getByText("+91 98765 43210")).toBeInTheDocument();
    expect(screen.getByText("Bengaluru, India")).toBeInTheDocument();
    // Link with label vs without label
    expect(screen.getByText("Portfolio")).toHaveAttribute("href", "https://priya.dev");
    expect(screen.getByText("github.com/priyasharma")).toHaveAttribute("href", "https://github.com/priyasharma");

    // Headings order check
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      "Summary",
      "Education",
      "Skills",
      "Experience",
      "Projects",
      "Certifications",
    ]);

    // Education details
    expect(screen.getByText("Indian Institute of Technology")).toBeInTheDocument();
    expect(screen.getByText("Aug 2018 - May 2022")).toBeInTheDocument();
    expect(screen.getByText(/CGPA: 9.1\/10/)).toBeInTheDocument();
    expect(screen.getByText(/Percentage: 95%/)).toBeInTheDocument();

    // Skills details
    expect(screen.getByText(/Languages:/)).toBeInTheDocument();
    expect(screen.getByText(/TypeScript, JavaScript, HTML\/CSS/)).toBeInTheDocument();
    expect(screen.getByText("Git, Docker")).toBeInTheDocument();
    // Empty skill group should be hidden
    expect(screen.queryByText(/Empty Group/)).not.toBeInTheDocument();

    // Experience details
    expect(screen.getByText("Lead Frontend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Tech Innovations")).toBeInTheDocument();
    expect(screen.getByText("Jun 2022 - Present")).toBeInTheDocument();
    expect(screen.getByText("Spearheaded design system adoption.")).toBeInTheDocument();

    // Projects details
    expect(screen.getByText("Resume Rocket")).toBeInTheDocument();
    expect(screen.getByText(/React, TypeScript, Vite/)).toBeInTheDocument();
    expect(screen.getByText("github.com/priya/resume-rocket")).toHaveAttribute("href", "https://github.com/priya/resume-rocket");

    // Certifications details
    expect(screen.getByText(/AWS Certified Developer/)).toBeInTheDocument();
    expect(screen.getByText(/Amazon Web Services/)).toBeInTheDocument();
    expect(screen.getByText("Independent Project Lead")).toBeInTheDocument();
  });

  it("shows empty message when content is fully empty", () => {
    const emptyContent: ResumeContent = {
      schemaVersion: 1,
      basics: {
        fullName: "",
        email: "",
        phone: "",
        location: "",
        links: [],
      },
      summary: "",
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      skills: [],
    };

    render(<ResumeDocument content={emptyContent} />);
    expect(screen.getByText("Start typing and your resume appears here.")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("hides empty sections and skips empty items", () => {
    const partiallyEmpty: ResumeContent = {
      schemaVersion: 1,
      basics: {
        fullName: "Only Name",
        email: "",
        phone: "",
        location: "",
        links: [],
      },
      summary: "",
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      skills: [],
    };

    render(<ResumeDocument content={partiallyEmpty} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Only Name");
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    expect(screen.queryByText("Start typing and your resume appears here.")).not.toBeInTheDocument();
  });

  it("renders fixture where every text field contains a 200 character unbroken string without throwing and applies safe wrapping style", () => {
    const makeLong = (prefix: string) => prefix + "X".repeat(200 - prefix.length);

    const fields = {
      fullName: makeLong("name_"),
      email: `${makeLong("email_")}@example.com`,
      phone: makeLong("phone_"),
      location: makeLong("loc_"),
      linkLabel: makeLong("label_"),
      linkUrl: `https://${makeLong("url_")}.com`,
      summary: makeLong("summary_"),
      institution: makeLong("inst_"),
      degree: makeLong("degree_"),
      skillsCat: makeLong("cat_"),
      skillsItem: makeLong("item_"),
      jobTitle: makeLong("title_"),
      company: makeLong("company_"),
      projectName: makeLong("proj_"),
      techStack: makeLong("tech_"),
      bullet: makeLong("bullet_"),
      certName: makeLong("cert_"),
      certIssuer: makeLong("issuer_"),
    };

    const longFixture: ResumeContent = {
      schemaVersion: 1,
      basics: {
        fullName: fields.fullName,
        email: fields.email,
        phone: fields.phone,
        location: fields.location,
        links: [
          { label: fields.linkLabel, url: fields.linkUrl },
        ],
      },
      summary: fields.summary,
      education: [
        {
          id: "edu-long",
          institution: fields.institution,
          degree: fields.degree,
          startDate: "2020-01",
          endDate: "2024-01",
          gradeType: "cgpa",
          gradeValue: 9.5,
        },
      ],
      skills: [
        {
          id: "sk-long",
          category: fields.skillsCat,
          items: [fields.skillsItem],
        },
      ],
      experience: [
        {
          id: "exp-long",
          jobTitle: fields.jobTitle,
          company: fields.company,
          startDate: "2020-01",
          endDate: "2024-01",
          isCurrent: false,
          bullets: [fields.bullet],
        },
      ],
      projects: [
        {
          id: "proj-long",
          name: fields.projectName,
          techStack: [fields.techStack],
          link: `https://${makeLong("projlink_")}.com`,
          bullets: [fields.bullet],
        },
      ],
      certifications: [
        {
          id: "cert-long",
          name: fields.certName,
          issuer: fields.certIssuer,
        },
      ],
    };

    let renderedContainer: HTMLElement | undefined;
    expect(() => {
      const { container } = render(<ResumeDocument content={longFixture} />);
      renderedContainer = container;
    }).not.toThrow();

    const root = renderedContainer?.querySelector(".resume-document");
    expect(root).toBeInTheDocument();

    // Verify all long unbroken strings are present in the DOM
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(fields.fullName);
    expect(screen.getByText(fields.email)).toBeInTheDocument();
    expect(screen.getByText(fields.phone)).toBeInTheDocument();
    expect(screen.getByText(fields.location)).toBeInTheDocument();
    expect(screen.getByText(fields.linkLabel)).toBeInTheDocument();
    expect(screen.getByText(fields.summary)).toBeInTheDocument();
    expect(screen.getByText(fields.institution)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(fields.degree))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(fields.skillsCat))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(fields.skillsItem))).toBeInTheDocument();
    expect(screen.getByText(fields.jobTitle)).toBeInTheDocument();
    expect(screen.getByText(fields.company)).toBeInTheDocument();
    expect(screen.getByText(fields.projectName)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(fields.techStack))).toBeInTheDocument();
    expect(screen.getAllByText(fields.bullet).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(fields.certName)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(fields.certIssuer))).toBeInTheDocument();

    // Verify stylesheet rules for text wrapping and flex row shrink behavior
    expect(cssRaw).toMatch(/\.resume-document\s*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(cssRaw).toMatch(/\.resume-document\s*\{[^}]*word-break:\s*break-word/);
    expect(cssRaw).toMatch(/\.resume-document\s+\.item-row\s*>\s*:first-child\s*\{[^}]*min-width:\s*0/);
    expect(cssRaw).toMatch(/\.resume-document\s+\.item-date\s*\{[^}]*flex-shrink:\s*0/);

    // Verify parsed stylesheet rules in DOM
    const styleEl = document.createElement("style");
    styleEl.textContent = cssRaw;
    document.head.appendChild(styleEl);

    const rules = Array.from(styleEl.sheet?.cssRules || []);
    const docRule = rules.find(
      (r) => (r as CSSStyleRule).selectorText === ".resume-document"
    ) as CSSStyleRule | undefined;
    expect(docRule).toBeDefined();
    expect(docRule?.cssText).toMatch(/overflow-wrap:\s*anywhere/);
    expect(docRule?.cssText).toMatch(/word-break:\s*break-word/);

    const itemRowLeftRule = rules.find(
      (r) => (r as CSSStyleRule).selectorText === ".resume-document .item-row > :first-child"
    ) as CSSStyleRule | undefined;
    expect(itemRowLeftRule).toBeDefined();
    expect(itemRowLeftRule?.cssText).toMatch(/min-width:\s*0/);

    const itemDateRule = rules.find(
      (r) => (r as CSSStyleRule).selectorText === ".resume-document .item-date"
    ) as CSSStyleRule | undefined;
    expect(itemDateRule).toBeDefined();
    expect(itemDateRule?.cssText).toMatch(/flex-shrink:\s*0/);

    document.head.removeChild(styleEl);
  });

  it("renders project layout: project with link renders p.project-title-line (name in bold + tech stack) and p.project-link-line (anchor); project without link renders no project-link-line", () => {
    const content: ResumeContent = {
      schemaVersion: 1,
      basics: {
        fullName: "Test User",
        email: "test@example.com",
        phone: "",
        location: "",
        links: [],
      },
      summary: "",
      education: [],
      skills: [],
      experience: [],
      projects: [
        {
          id: "proj-1",
          name: "Alpha Project",
          techStack: ["React", "TypeScript"],
          link: "https://example.com/alpha",
          bullets: ["First bullet"],
        },
        {
          id: "proj-2",
          name: "Beta Project",
          techStack: ["Node.js"],
          link: "",
          bullets: ["Second bullet"],
        },
      ],
      certifications: [],
    };

    const { container } = render(<ResumeDocument content={content} />);

    // Check project 1: has link
    const titleLines = container.querySelectorAll("p.project-title-line");
    expect(titleLines).toHaveLength(2);

    const firstTitleLine = titleLines[0];
    const boldTitle = firstTitleLine.querySelector("span.item-title");
    expect(boldTitle).toBeInTheDocument();
    expect(boldTitle).toHaveTextContent("Alpha Project");
    expect(firstTitleLine).toHaveTextContent("Alpha Project | React, TypeScript");

    const linkLines = container.querySelectorAll("p.project-link-line");
    expect(linkLines).toHaveLength(1);

    const anchor = linkLines[0].querySelector("a");
    expect(anchor).toBeInTheDocument();
    expect(anchor).toHaveAttribute("href", "https://example.com/alpha");
    expect(anchor).toHaveTextContent("example.com/alpha");

    // Check project 2: without link
    const secondTitleLine = titleLines[1];
    const secondBoldTitle = secondTitleLine.querySelector("span.item-title");
    expect(secondBoldTitle).toBeInTheDocument();
    expect(secondBoldTitle).toHaveTextContent("Beta Project");
    expect(secondTitleLine).toHaveTextContent("Beta Project | Node.js");

    const entryBlocks = container.querySelectorAll("section .entry-block");
    expect(entryBlocks).toHaveLength(2);
    expect(entryBlocks[1].querySelector("p.project-link-line")).toBeNull();
  });
});
