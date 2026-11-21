import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { EditorPage } from "../pages/EditorPage";
import { api, ApiError } from "../api/client";
import { ResumeContent } from "../api/types";

describe("EditorPage", () => {
  const mockContent: ResumeContent = {
    schemaVersion: 1,
    basics: {
      fullName: "Kavita Patel",
      email: "kavita@example.com",
      phone: "+91 91234 56789",
      location: "Mumbai, India",
      links: [],
    },
    summary: "Experienced Full Stack Engineer",
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    skills: [],
  };

  const fullContent: ResumeContent = {
    schemaVersion: 1,
    basics: {
      fullName: "Priya Sharma",
      email: "priya@example.com",
      phone: "+91 98765 43210",
      location: "Bengaluru, India",
      links: [{ label: "Portfolio", url: "https://priya.dev" }],
    },
    summary: "Senior Frontend Engineer",
    education: [
      {
        id: "edu-1",
        institution: "Original University",
        degree: "B.Tech Computer Science",
        startDate: "2018-08",
        endDate: "2022-05",
        gradeType: "cgpa",
        gradeValue: 9.2,
      },
    ],
    skills: [
      {
        id: "sk-1",
        category: "Frontend",
        items: ["React", "TypeScript"],
      },
    ],
    experience: [
      {
        id: "exp-1",
        jobTitle: "Frontend Engineer",
        company: "Tech Corp",
        startDate: "2022-06",
        endDate: "",
        isCurrent: true,
        bullets: ["Built features"],
      },
    ],
    projects: [
      {
        id: "proj-1",
        name: "Portfolio Site",
        techStack: ["Next.js"],
        link: "https://portfolio.dev",
        bullets: ["Designed UI"],
      },
    ],
    certifications: [
      {
        id: "cert-1",
        name: "AWS Certified Developer",
        issuer: "Amazon",
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads resume, displays title, and supports responsive tab switching while keeping both panels mounted", async () => {
    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: {
        id: "res-101",
        title: "Kavita's Master Resume",
        content: mockContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    render(
      <MemoryRouter initialEntries={["/resume/res-101"]}>
        <Routes>
          <Route path="/resume/:id" element={<EditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Initial loading -> loaded
    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Kavita's Master Resume" })).toBeInTheDocument();
    });

    const editTab = screen.getByRole("tab", { name: /edit/i });
    const previewTab = screen.getByRole("tab", { name: /preview/i });

    expect(editTab).toHaveAttribute("aria-selected", "true");
    expect(previewTab).toHaveAttribute("aria-selected", "false");

    const editPanel = screen.getByRole("tabpanel", { name: /edit/i });
    const previewPanel = screen.getByRole("tabpanel", { name: /preview/i });

    // Both panels are mounted in the DOM
    expect(editPanel).toBeInTheDocument();
    expect(previewPanel).toBeInTheDocument();

    expect(editPanel.className).toContain("block");
    expect(previewPanel.className).toContain("hidden lg:block");

    // Click Preview tab
    await userEvent.click(previewTab);

    expect(editTab).toHaveAttribute("aria-selected", "false");
    expect(previewTab).toHaveAttribute("aria-selected", "true");

    // Panel classes updated, both panels still mounted
    expect(editPanel.className).toContain("hidden lg:block");
    expect(previewPanel.className).toContain("block");
    expect(editPanel).toBeInTheDocument();
    expect(previewPanel).toBeInTheDocument();
  });

  it("editing institution in a full fixture updates the preview text", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: {
        id: "res-full",
        title: "Full Resume",
        content: fullContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    render(
      <MemoryRouter initialEntries={["/resume/res-full"]}>
        <Routes>
          <Route path="/resume/:id" element={<EditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Full Resume" })).toBeInTheDocument();
    });

    // Preview initially contains Original University
    expect(screen.getByText("Original University")).toBeInTheDocument();

    // Expand the Education section card inside the edit panel
    const editPanel = screen.getByRole("tabpanel", { name: /edit/i });
    const educationHeading = within(editPanel).getByRole("heading", { level: 2, name: /education/i });
    const educationCard = educationHeading.closest("div")?.parentElement;
    const expandBtn = educationCard?.querySelector("button[aria-expanded='false']") as HTMLButtonElement;
    expect(expandBtn).toBeDefined();
    await user.click(expandBtn);

    // Edit institution
    const institutionInput = within(editPanel).getByDisplayValue("Original University");
    await user.clear(institutionInput);
    await user.type(institutionInput, "Stanford University");

    // Preview should reflect updated institution
    const previewPanel = screen.getByRole("tabpanel", { name: /preview/i });
    expect(within(previewPanel).getByText("Stanford University")).toBeInTheDocument();
  });

  it("shows friendly not found page when resume returns 404", async () => {
    vi.spyOn(api, "getResume").mockRejectedValue(new ApiError(404, "Not found"));

    render(
      <MemoryRouter initialEntries={["/resume/non-existent-id"]}>
        <Routes>
          <Route path="/resume/:id" element={<EditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Resume not found" })).toBeInTheDocument();
    });

    expect(
      screen.getByText("The resume you are looking for does not exist or has been deleted.")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to dashboard/i })).toBeInTheDocument();
  });
});
