import { describe, it, expect } from "vitest";
import { buildResumeModel, SECTION_ORDER } from "../editor/shared/resumeModel";
import { ResumeContent } from "../api/types";

describe("buildResumeModel", () => {
  const fullFixture: ResumeContent = {
    schemaVersion: 1,
    basics: {
      fullName: "Maya Lin",
      email: "maya@example.com",
      phone: "+1 555 123 4567",
      location: "San Francisco, CA",
      links: [
        { label: "Portfolio", url: "https://mayalin.dev" },
        { label: "Blog", url: "not-a-valid-url" },
        { label: "", url: "https://github.com/mayalin" },
      ],
    },
    summary: "Senior Software Engineer passionate about developer tooling.",
    education: [
      {
        id: "edu-1",
        institution: "UC Berkeley",
        degree: "B.S. in Electrical Engineering & Computer Science",
        startDate: "2016-08",
        endDate: "2020-05",
        gradeType: "cgpa",
        gradeValue: 3.9,
      },
      {
        id: "edu-2",
        institution: "High School",
        degree: "High School Diploma",
        startDate: "2012-09",
        endDate: "2016-06",
        gradeType: "percentage",
        gradeValue: 98,
      },
      {
        id: "edu-empty",
        institution: "",
        degree: "",
        startDate: "",
        endDate: "",
        gradeType: "cgpa",
        gradeValue: null,
      },
    ],
    skills: [
      {
        id: "sk-1",
        category: "Languages",
        items: ["TypeScript", "Rust", "Python", ""],
      },
      {
        id: "sk-2",
        category: "",
        items: ["Docker", "Kubernetes"],
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
        jobTitle: "Staff Engineer",
        company: "Stripe",
        startDate: "2022-01",
        endDate: "",
        isCurrent: true,
        bullets: ["Led payments infrastructure redesign", "", "Mentored 10 engineers"],
      },
      {
        id: "exp-empty",
        jobTitle: "",
        company: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        bullets: ["", "   "],
      },
    ],
    projects: [
      {
        id: "proj-1",
        name: "FastPack",
        techStack: ["Rust", "WASM", ""],
        link: "https://github.com/mayalin/fastpack",
        bullets: ["10x faster bundler", ""],
      },
      {
        id: "proj-invalid-link",
        name: "Internal Tool",
        techStack: ["React"],
        link: "ftp://invalid-scheme",
        bullets: [],
      },
      {
        id: "proj-empty",
        name: "",
        techStack: ["", "  "],
        link: "",
        bullets: [],
      },
    ],
    certifications: [
      {
        id: "cert-1",
        name: "AWS Solutions Architect",
        issuer: "Amazon Web Services",
      },
      {
        id: "cert-empty",
        name: "",
        issuer: "",
      },
    ],
  };

  it("omits empty sections and empty entries, maintains SECTION_ORDER", () => {
    const model = buildResumeModel(fullFixture);
    expect(model.isEmpty).toBe(false);

    const sectionKinds = model.sections.map((s) => s.kind);
    expect(sectionKinds).toEqual(SECTION_ORDER);

    // Education: 2 entries, empty entry omitted
    const eduSection = model.sections.find((s) => s.kind === "education")!;
    expect(eduSection.entries).toHaveLength(2);
    expect(eduSection.entries[0].institution).toBe("UC Berkeley");
    expect(eduSection.entries[1].institution).toBe("High School");

    // Skills: 2 entries, empty group omitted
    const skillsSection = model.sections.find((s) => s.kind === "skills")!;
    expect(skillsSection.entries).toHaveLength(2);

    // Experience: 1 entry, empty entry omitted
    const expSection = model.sections.find((s) => s.kind === "experience")!;
    expect(expSection.entries).toHaveLength(1);

    // Projects: 2 entries, empty project omitted
    const projSection = model.sections.find((s) => s.kind === "projects")!;
    expect(projSection.entries).toHaveLength(2);

    // Certifications: 1 entry, empty cert omitted
    const certSection = model.sections.find((s) => s.kind === "certifications")!;
    expect(certSection.entries).toHaveLength(1);
  });

  it("formats dates, grade text, 'Present', skills lines, and filters empty bullets", () => {
    const model = buildResumeModel(fullFixture);

    // Dates & Grade text
    const edu = model.sections.find((s) => s.kind === "education")!;
    expect(edu.entries[0].dates).toBe("Aug 2016 - May 2020");
    expect(edu.entries[0].subline).toBe("B.S. in Electrical Engineering & Computer Science | CGPA: 3.9/10");
    expect(edu.entries[1].subline).toBe("High School Diploma | Percentage: 98%");

    // Experience: 'Present' for isCurrent and bullets filtered
    const exp = model.sections.find((s) => s.kind === "experience")!;
    expect(exp.entries[0].dates).toBe("Jan 2022 - Present");
    expect(exp.entries[0].bullets).toEqual([
      "Led payments infrastructure redesign",
      "Mentored 10 engineers",
    ]);

    // Skills joined
    const skills = model.sections.find((s) => s.kind === "skills")!;
    expect(skills.entries[0].category).toBe("Languages");
    expect(skills.entries[0].itemsText).toBe("TypeScript, Rust, Python");
    expect(skills.entries[1].category).toBe("");
    expect(skills.entries[1].itemsText).toBe("Docker, Kubernetes");

    // Projects techStack joined and bullets filtered
    const proj = model.sections.find((s) => s.kind === "projects")!;
    expect(proj.entries[0].techStack).toBe("Rust, WASM");
    expect(proj.entries[0].bullets).toEqual(["10x faster bundler"]);
  });

  it("handles contact links: valid URL gets href, invalid URL stays text", () => {
    const model = buildResumeModel(fullFixture);
    expect(model.header.name).toBe("Maya Lin");

    // Check contact parts
    expect(model.header.contactParts[0]).toEqual({ text: "maya@example.com", href: "mailto:maya@example.com" });
    expect(model.header.contactParts[1]).toEqual({ text: "+1 555 123 4567" });
    expect(model.header.contactParts[2]).toEqual({ text: "San Francisco, CA" });
    expect(model.header.contactParts[3]).toEqual({ text: "Portfolio", href: "https://mayalin.dev" });
    // Invalid link gets no href
    expect(model.header.contactParts[4]).toEqual({ text: "Blog", href: undefined });
    // Link with clean URL display
    expect(model.header.contactParts[5]).toEqual({ text: "github.com/mayalin", href: "https://github.com/mayalin" });

    // Project links
    const proj = model.sections.find((s) => s.kind === "projects")!;
    expect(proj.entries[0].linkHref).toBe("https://github.com/mayalin/fastpack");
    expect(proj.entries[0].linkText).toBe("github.com/mayalin/fastpack");
    // Invalid project link gets no href
    expect(proj.entries[1].linkHref).toBeUndefined();
    expect(proj.entries[1].linkText).toBe("ftp://invalid-scheme");
  });

  it("returns isEmpty: true when content is empty or null", () => {
    expect(buildResumeModel(null).isEmpty).toBe(true);
    expect(buildResumeModel(undefined).isEmpty).toBe(true);
    const emptyContent: ResumeContent = {
      schemaVersion: 1,
      basics: { fullName: "", email: "", phone: "", location: "", links: [] },
      summary: "",
      education: [],
      skills: [],
      experience: [],
      projects: [],
      certifications: [],
    };
    expect(buildResumeModel(emptyContent).isEmpty).toBe(true);
  });
});
