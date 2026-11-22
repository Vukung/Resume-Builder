import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { EditorPage } from "../pages/EditorPage";
import { api } from "../api/client";
import { ResumeContent } from "../api/types";

// NOTE: jsdom has no layout engine — offsetHeight/clientWidth are always 0.
// PreviewPane's ResizeObserver-based clipping (overflow:hidden + scaledHeight) cannot
// be reproduced in jsdom. The tests below verify DOM presence of both projects in the
// preview panel (#panel-preview tabpanel), which is the closest assertion possible here.
// If both projects are present in the DOM, the bug (if real) is a visual/layout issue
// that only manifests in a real browser where offsetHeight is non-zero and the wrapper
// clips content. The fix (removing overflow:hidden) is verified by inspecting the
// rendered element style in the DOM.

const fixtureContent: ResumeContent = {
  schemaVersion: 1,
  basics: {
    fullName: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    phone: "+91 90000 00000",
    location: "Pune, India",
    links: [{ label: "Portfolio", url: "https://example.com" }],
  },
  summary:
    "Passionate software engineer with expertise in full-stack development. Built scalable applications serving thousands of users. Strong background in cloud technologies and distributed systems design.",
  education: [
    {
      id: "edu-1",
      institution: "Example Institute of Engineering",
      degree: "B.Tech in Electronics and Telecommunication",
      startDate: "2022-11",
      endDate: "2026-06",
      gradeType: "cgpa",
      gradeValue: 8.98,
    },
  ],
  skills: [
    { id: "sk-1", category: "Languages", items: ["Python", "JavaScript"] },
    {
      id: "sk-2",
      category: "Computer Science Fundamentals",
      items: ["Data Structures", "Algorithms", "OS", "DBMS", "Networks"],
    },
    { id: "sk-3", category: "Backend / APIs", items: ["Node.js", "Express.js", "REST APIs"] },
    { id: "sk-4", category: "Databases", items: ["MySQL", "PostgreSQL"] },
    { id: "sk-5", category: "Cloud / Tools", items: ["AWS", "Docker", "Git"] },
  ],
  experience: [
    {
      id: "exp-1",
      jobTitle: "Software Development Intern",
      company: "Tech Solutions Pvt Ltd",
      startDate: "2024-05",
      endDate: "2024-07",
      isCurrent: false,
      bullets: [
        "Developed REST APIs serving over 10000 daily active users with sub-200ms response time under production load.",
        "Automated deployment pipeline reducing release time by 60% using GitHub Actions and AWS CodeDeploy.",
      ],
    },
    {
      id: "exp-2",
      jobTitle: "Open Source Contributor",
      company: "Various Projects",
      startDate: "2023-01",
      endDate: "",
      isCurrent: true,
      bullets: [
        "Contributed 15 merged pull requests across popular repositories improving documentation and fixing edge cases.",
        "Built developer tooling script that automated repetitive tasks saving contributors approximately 2 hours weekly.",
      ],
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "AI Ad Mapping & Category Classification System",
      techStack: ["n8n", "Groq LLaMA-3.1", "Google Sheets", "Looker Studio", "Docker"],
      link: "https://github.com/example/ai-ad-mapping-category-classification-system",
      bullets: [
        "Automated advertisement categorization pipeline processing 500 ads daily with 92% accuracy using LLaMA-3.1 via Groq API.",
      ],
    },
    {
      id: "proj-2",
      name: "Resume Builder Web Application",
      techStack: ["React.js", "Node.js", "Express.js", "MySQL"],
      link: "",
      bullets: [
        "Reduced user resume creation time by 80% through intuitive backend logic and dynamic data structure.",
      ],
    },
  ],
  certifications: [{ id: "cert-1", name: "AWS Certified Cloud Practitioner", issuer: "AWS" }],
};

function renderEditorWithFixture(content: ResumeContent, id = "res-fixture") {
  vi.spyOn(api, "getResume").mockResolvedValue({
    resume: {
      id,
      title: "Aarav Resume",
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });

  render(
    <MemoryRouter initialEntries={[`/resume/${id}`]}>
      <Routes>
        <Route path="/resume/:id" element={<EditorPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("PreviewPane — two-project fixture", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("2a: both project names appear in the preview panel (not only in #print-root)", async () => {
    renderEditorWithFixture(fixtureContent);

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Aarav Resume" })).toBeInTheDocument();
    });

    const previewPanel = screen.getByRole("tabpanel", { name: /preview/i });

    // Both projects must be present in the preview tabpanel
    expect(within(previewPanel).getByText("AI Ad Mapping & Category Classification System")).toBeInTheDocument();
    expect(within(previewPanel).getByText("Resume Builder Web Application")).toBeInTheDocument();

    // Neither should be hidden via aria-hidden or inline display:none/visibility:hidden
    const proj1 = within(previewPanel).getByText("AI Ad Mapping & Category Classification System");
    const proj2 = within(previewPanel).getByText("Resume Builder Web Application");

    let el: HTMLElement | null = proj1;
    while (el && el !== previewPanel) {
      expect(el.getAttribute("aria-hidden")).not.toBe("true");
      expect(el.style.display).not.toBe("none");
      expect(el.style.visibility).not.toBe("hidden");
      el = el.parentElement;
    }

    el = proj2;
    while (el && el !== previewPanel) {
      expect(el.getAttribute("aria-hidden")).not.toBe("true");
      expect(el.style.display).not.toBe("none");
      expect(el.style.visibility).not.toBe("hidden");
      el = el.parentElement;
    }

    // The scale wrapper must NOT have overflow:hidden (Part A fix)
    // Find the wrapper div inside the preview panel (direct child of the containerRef div)
    const containerDiv = previewPanel.querySelector('[aria-label="Resume live preview"]');
    expect(containerDiv).not.toBeNull();
    const scaleWrapper = containerDiv?.querySelector("div");
    expect(scaleWrapper).not.toBeNull();
    if (scaleWrapper) {
      expect(scaleWrapper.style.overflow).not.toBe("hidden");
    }
  });

  it("2b: adding two projects via the form shows both in the preview panel", async () => {
    const user = userEvent.setup();
    const emptyContent: ResumeContent = {
      schemaVersion: 1,
      basics: { fullName: "Test User", email: "", phone: "", location: "", links: [] },
      summary: "",
      education: [],
      skills: [],
      experience: [],
      projects: [],
      certifications: [],
    };

    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: {
        id: "res-empty",
        title: "Empty Resume",
        content: emptyContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    vi.spyOn(api, "saveContent").mockResolvedValue({ updatedAt: new Date().toISOString() });

    render(
      <MemoryRouter initialEntries={["/resume/res-empty"]}>
        <Routes>
          <Route path="/resume/:id" element={<EditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Empty Resume" })).toBeInTheDocument();
    });

    const editPanel = screen.getByRole("tabpanel", { name: /edit/i });

    // Expand Projects card
    const projectsHeading = within(editPanel).getByRole("heading", { level: 2, name: /projects/i });
    const projectsCard = projectsHeading.closest("div")?.parentElement;
    const expandBtn = projectsCard?.querySelector("button[aria-expanded='false']") as HTMLButtonElement;
    expect(expandBtn).not.toBeNull();
    await user.click(expandBtn);

    // Add first project
    const addBtn = within(editPanel).getByRole("button", { name: /add project/i });
    await user.click(addBtn);

    // Type name for first project
    const nameInputs = within(editPanel).getAllByPlaceholderText("e.g. Expense Tracker App");
    await user.type(nameInputs[0], "Alpha Project");

    // Add second project
    await user.click(within(editPanel).getByRole("button", { name: /add project/i }));

    // Type name for second project
    const nameInputs2 = within(editPanel).getAllByPlaceholderText("e.g. Expense Tracker App");
    await user.type(nameInputs2[1], "Beta Project");

    // Both names should appear in preview panel
    const previewPanel = screen.getByRole("tabpanel", { name: /preview/i });
    expect(within(previewPanel).getByText("Alpha Project")).toBeInTheDocument();
    expect(within(previewPanel).getByText("Beta Project")).toBeInTheDocument();
  });

  it("2c: editing project 1 name after project 2 exists keeps project 2 in preview", async () => {
    const user = userEvent.setup();
    const twoProjects: ResumeContent = {
      ...fixtureContent,
      projects: [
        { id: "p1", name: "Original Name", techStack: [], link: "", bullets: [] },
        { id: "p2", name: "Second Project", techStack: [], link: "", bullets: [] },
      ],
    };

    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: {
        id: "res-two",
        title: "Two Project Resume",
        content: twoProjects,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    vi.spyOn(api, "saveContent").mockResolvedValue({ updatedAt: new Date().toISOString() });

    render(
      <MemoryRouter initialEntries={["/resume/res-two"]}>
        <Routes>
          <Route path="/resume/:id" element={<EditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Two Project Resume" })).toBeInTheDocument();
    });

    const editPanel = screen.getByRole("tabpanel", { name: /edit/i });
    const previewPanel = screen.getByRole("tabpanel", { name: /preview/i });

    // Both should be in preview initially
    expect(within(previewPanel).getByText("Original Name")).toBeInTheDocument();
    expect(within(previewPanel).getByText("Second Project")).toBeInTheDocument();

    // Expand projects card
    const projectsHeading = within(editPanel).getByRole("heading", { level: 2, name: /projects/i });
    const projectsCard = projectsHeading.closest("div")?.parentElement;
    const expandBtn = projectsCard?.querySelector("button[aria-expanded='false']") as HTMLButtonElement;
    await user.click(expandBtn);

    // Edit project 1 name
    const nameInput = within(editPanel).getByDisplayValue("Original Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Renamed Project");

    // Project 2 must still be in preview
    expect(within(previewPanel).getByText("Second Project")).toBeInTheDocument();
    expect(within(previewPanel).getByText("Renamed Project")).toBeInTheDocument();
  });
});
