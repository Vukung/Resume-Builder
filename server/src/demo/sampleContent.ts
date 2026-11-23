import { resumeContentSchema, ResumeContent } from "../schemas/resumeContent";

export const SAMPLE_RESUME_TITLE = "Sample Resume";

const rawSample = {
  schemaVersion: 1,
  basics: {
    fullName: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    phone: "+91 90000 00000",
    location: "Pune, India",
    links: [
      { label: "GitHub", url: "https://github.com/example" },
      { label: "Portfolio", url: "https://example.com" },
    ],
  },
  summary:
    "Final year computer engineering student with hands-on experience building full stack web applications with React, Node.js and PostgreSQL. Comfortable designing REST APIs, writing tests and deploying to cloud platforms. Looking for a software engineering internship working on backend services and data driven products.",
  education: [
    {
      id: "edu-1",
      institution: "Example Institute of Technology",
      degree: "B.Tech in Computer Engineering",
      startDate: "2022-08",
      endDate: "2026-06",
      gradeType: "cgpa" as const,
      gradeValue: 8.4,
    },
  ],
  skills: [
    {
      id: "sk-1",
      category: "Languages",
      items: ["TypeScript", "JavaScript", "Python", "SQL"],
    },
    {
      id: "sk-2",
      category: "Frameworks",
      items: ["React", "Node.js", "Express"],
    },
    {
      id: "sk-3",
      category: "Databases",
      items: ["PostgreSQL", "MongoDB"],
    },
    {
      id: "sk-4",
      category: "Tools",
      items: ["Git", "Docker", "Linux", "AWS"],
    },
  ],
  experience: [
    {
      id: "exp-1",
      jobTitle: "Software Engineering Intern",
      company: "Northwind Labs",
      startDate: "2025-06",
      endDate: "2025-08",
      isCurrent: false,
      bullets: [
        "Built and documented five REST API endpoints for an internal booking service using Node.js and Express.",
        "Wrote unit and integration tests that caught regressions before each release.",
        "Fixed production bugs found through log review and collaborated with two teammates through Git pull requests.",
      ],
    },
    {
      id: "exp-2",
      jobTitle: "Web Development Intern",
      company: "Acme Technologies",
      startDate: "2024-06",
      endDate: "2024-08",
      isCurrent: false,
      bullets: [
        "Developed responsive dashboard pages in React for an internal reporting tool.",
        "Connected the interface to existing APIs and handled loading and error states.",
      ],
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "Expense Tracker App",
      techStack: ["React", "Node.js", "PostgreSQL"],
      link: "https://github.com/example/expense-tracker",
      bullets: [
        "Built a full stack app with login, categorized expenses, charts and CSV export.",
        "Designed the database schema and wrote REST endpoints with input validation.",
      ],
    },
    {
      id: "proj-2",
      name: "Study Group Finder",
      techStack: ["TypeScript", "Express", "MongoDB"],
      link: "",
      bullets: [
        "Created a service that matches students by course and availability.",
      ],
    },
  ],
  certifications: [
    {
      id: "cert-1",
      name: "Relational Databases and SQL",
      issuer: "Example Learning",
    },
  ],
};

export const SAMPLE_CONTENT: ResumeContent = resumeContentSchema.parse(rawSample);
