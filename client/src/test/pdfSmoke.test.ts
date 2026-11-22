// @vitest-environment node
import React from "react";
import { describe, it, expect } from "vitest";
import { pdf } from "@react-pdf/renderer";
import { ResumePdf } from "../editor/pdf/ResumePdf";
import { buildResumeModel } from "../editor/shared/resumeModel";
import { ResumeContent } from "../api/types";

const smokeFixture: ResumeContent = {
  schemaVersion: 1,
  basics: {
    fullName: "Aarav Sharma",
    email: "aarav@example.com",
    phone: "+91 98765 43210",
    location: "Pune, India",
    links: [{ label: "Portfolio", url: "https://aarav.dev" }],
  },
  summary: "Software Engineer with React and Node.js expertise.",
  education: [
    {
      id: "edu-1",
      institution: "Pune University",
      degree: "B.E. Computer Engineering",
      startDate: "2018-08",
      endDate: "2022-05",
      gradeType: "cgpa",
      gradeValue: 8.8,
    },
  ],
  skills: [{ id: "sk-1", category: "Languages", items: ["TypeScript", "JavaScript"] }],
  experience: [
    {
      id: "exp-1",
      jobTitle: "Software Engineer",
      company: "Tech Corp",
      startDate: "2022-06",
      endDate: "",
      isCurrent: true,
      bullets: ["Built high performance web applications."],
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "Resume Rocket",
      techStack: ["React", "TypeScript"],
      link: "https://github.com/example/resume-rocket",
      bullets: ["Real-time PDF generator."],
    },
  ],
  certifications: [{ id: "cert-1", name: "AWS Certified Developer", issuer: "AWS" }],
};

describe("PDF Smoke Test (Node environment)", () => {
  it("generates a real PDF buffer from the fixture that starts with %PDF", async () => {
    const model = buildResumeModel(smokeFixture);
    const pdfInstance = pdf(
      React.createElement(ResumePdf, {
        model,
        resumeTitle: "Aarav Resume",
      }) as unknown as React.ReactElement<import("@react-pdf/renderer").DocumentProps>
    );
    const stream = await pdfInstance.toBuffer();

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    expect(buffer.length).toBeGreaterThan(100);
    expect(buffer.subarray(0, 4).toString("utf-8")).toBe("%PDF");
  });
});
