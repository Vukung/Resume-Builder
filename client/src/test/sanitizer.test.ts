import { describe, it, expect } from "vitest";
import { toSaveable, isValidHttpUrl } from "../editor/utils/sanitizer";
import { ResumeContent } from "../api/types";

describe("Sanitizer toSaveable and URL validation", () => {
  const baseContent: ResumeContent = {
    schemaVersion: 1,
    basics: {
      fullName: "Alex",
      email: "alex@example.com",
      phone: "",
      location: "",
      links: [
        { label: "Valid GitHub", url: "https://github.com/alex" },
        { label: "Valid HTTP", url: "http://alex.dev" },
        { label: "Invalid Protocol", url: "ftp://files.example.com" },
        { label: "Not a URL", url: "just text" },
        { label: "Empty URL", url: "" },
      ],
    },
    summary: "Hello world",
    education: [
      {
        id: "edu-1",
        institution: "College",
        degree: "B.S.",
        startDate: "2018-08",
        endDate: "2022-05",
        gradeType: "percentage",
        gradeValue: 85,
      },
      {
        id: "edu-2",
        institution: "High School",
        degree: "High School",
        startDate: "2014-08",
        endDate: "2018-05",
        gradeType: "percentage",
        gradeValue: 105, // invalid percentage
      },
      {
        id: "edu-3",
        institution: "Grad School",
        degree: "M.S.",
        startDate: "2022-08",
        endDate: "2024-05",
        gradeType: "cgpa",
        gradeValue: 8.5, // valid cgpa
      },
      {
        id: "edu-4",
        institution: "Other",
        degree: "Diploma",
        startDate: "",
        endDate: "",
        gradeType: "cgpa",
        gradeValue: 12, // invalid cgpa
      },
    ],
    experience: [],
    projects: [
      {
        id: "proj-1",
        name: "Project A",
        techStack: ["React"],
        link: "https://demo.example.com",
        bullets: ["Did something"],
      },
      {
        id: "proj-2",
        name: "Project B",
        techStack: ["Node"],
        link: "not-a-valid-url",
        bullets: ["Did more"],
      },
      {
        id: "proj-3",
        name: "Project C",
        techStack: [],
        link: "",
        bullets: [],
      },
    ],
    certifications: [],
    skills: [],
  };

  it("validates http and https URLs correctly with isValidHttpUrl", () => {
    expect(isValidHttpUrl("https://example.com")).toBe(true);
    expect(isValidHttpUrl("http://localhost:3000")).toBe(true);
    expect(isValidHttpUrl("ftp://example.com")).toBe(false);
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isValidHttpUrl("not-a-url")).toBe(false);
    expect(isValidHttpUrl("")).toBe(false);
  });

  it("toSaveable sanitizes links and grades while preserving valid values and in-memory state", () => {
    const sanitized = toSaveable(baseContent);

    // In-memory original remains unchanged
    expect(baseContent.basics.links[2].url).toBe("ftp://files.example.com");
    expect(baseContent.projects[1].link).toBe("not-a-valid-url");
    expect(baseContent.education[1].gradeValue).toBe(105);

    // Basics links sanitized
    expect(sanitized.basics.links[0].url).toBe("https://github.com/alex");
    expect(sanitized.basics.links[1].url).toBe("http://alex.dev");
    expect(sanitized.basics.links[2].url).toBe("");
    expect(sanitized.basics.links[3].url).toBe("");
    expect(sanitized.basics.links[4].url).toBe("");

    // Project links sanitized: invalid becomes "", valid is unchanged
    expect(sanitized.projects[0].link).toBe("https://demo.example.com");
    expect(sanitized.projects[1].link).toBe("");
    expect(sanitized.projects[2].link).toBe("");

    // Education gradeValues sanitized: invalid becomes null, valid is unchanged
    expect(sanitized.education[0].gradeValue).toBe(85);
    expect(sanitized.education[1].gradeValue).toBeNull();
    expect(sanitized.education[2].gradeValue).toBe(8.5);
    expect(sanitized.education[3].gradeValue).toBeNull();
  });
});
