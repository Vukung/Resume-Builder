import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { EditorPage } from "../pages/EditorPage";
import { api } from "../api/client";
import { ResumeContent } from "../api/types";
import { isContentEmpty } from "../editor/preview/isContentEmpty";
import printCssRaw from "../editor/print/print.css?raw";
import fs from "node:fs";
import path from "node:path";

const printCss = printCssRaw || fs.readFileSync(path.resolve(__dirname, "../editor/print/print.css"), "utf8");

const emptyContent: ResumeContent = {
  schemaVersion: 1,
  basics: { fullName: "", email: "", phone: "", location: "", links: [] },
  summary: "",
  education: [],
  experience: [],
  projects: [],
  certifications: [],
  skills: [],
};

const populatedContent: ResumeContent = {
  schemaVersion: 1,
  basics: {
    fullName: "Aarav Sharma",
    email: "aarav@example.com",
    phone: "+91 98765 43210",
    location: "Delhi, India",
    links: [{ label: "Portfolio", url: "https://aarav.dev" }],
  },
  summary: "Frontend Developer with React expertise",
  education: [{ id: "edu-1", institution: "IIT Delhi", degree: "B.Tech", startDate: "2019-07", endDate: "2023-05", gradeType: "cgpa", gradeValue: 9.0 }],
  experience: [{ id: "exp-1", jobTitle: "Software Engineer", company: "StartUp", startDate: "2023-06", endDate: "", isCurrent: true, bullets: ["Built UI"] }],
  projects: [{ id: "proj-1", name: "Project Alpha", techStack: ["React"], link: "https://alpha.dev", bullets: ["Built app"] }],
  certifications: [{ id: "cert-1", name: "AWS Developer", issuer: "Amazon" }],
  skills: [{ id: "sk-1", category: "Languages", items: ["TypeScript", "Python"] }],
};

function renderEditor(id = "res-1") {
  return render(
    <MemoryRouter initialEntries={[`/resume/${id}`]}>
      <Routes>
        <Route path="/resume/:id" element={<EditorPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Print and PDF Export (Phase 6)", () => {
  const originalTitle = document.title;

  beforeEach(() => {
    vi.restoreAllMocks();
    document.title = "Resume Rocket Test";
    let printRoot = document.getElementById("print-root");
    if (!printRoot) {
      printRoot = document.createElement("div");
      printRoot.id = "print-root";
      document.body.appendChild(printRoot);
    }
    printRoot.innerHTML = "";
  });

  afterEach(() => {
    document.title = originalTitle;
    const printRoot = document.getElementById("print-root");
    if (printRoot) printRoot.innerHTML = "";
  });

  it("1. beforeprint puts ResumeDocument into #print-root with current/unsaved edits, afterprint removes it", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: { id: "res-1", title: "My Resume", content: populatedContent, createdAt: "", updatedAt: "" },
    });
    renderEditor("res-1");
    await waitFor(() => expect(screen.getByDisplayValue("Aarav Sharma")).toBeInTheDocument());

    const printRoot = document.getElementById("print-root")!;
    expect(printRoot.innerHTML).toBe("");

    const nameInput = screen.getByDisplayValue("Aarav Sharma");
    await user.clear(nameInput);
    await user.type(nameInput, "Aarav S. Unsaved");

    act(() => { window.dispatchEvent(new Event("beforeprint")); });
    expect(printRoot.querySelector(".resume-document")).toBeInTheDocument();
    expect(printRoot.textContent).toContain("Aarav S. Unsaved");

    act(() => { window.dispatchEvent(new Event("afterprint")); });
    expect(printRoot.innerHTML).toBe("");
  });

  it("2. during beforeprint document.title is '<full name> - Resume' or '<title> - Resume', and restored on afterprint", async () => {
    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: { id: "res-2", title: "Fallback Title", content: populatedContent, createdAt: "", updatedAt: "" },
    });
    const { unmount } = renderEditor("res-2");
    await waitFor(() => expect(screen.getByDisplayValue("Aarav Sharma")).toBeInTheDocument());

    const savedTitle = document.title;
    act(() => { window.dispatchEvent(new Event("beforeprint")); });
    expect(document.title).toBe("Aarav Sharma - Resume");

    act(() => { window.dispatchEvent(new Event("afterprint")); });
    expect(document.title).toBe(savedTitle);
    unmount();

    const noNameContent = { ...populatedContent, basics: { ...populatedContent.basics, fullName: "" } };
    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: { id: "res-3", title: "Software Engineer", content: noNameContent, createdAt: "", updatedAt: "" },
    });
    renderEditor("res-3");
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: "Software Engineer" })).toBeInTheDocument());

    act(() => { window.dispatchEvent(new Event("beforeprint")); });
    expect(document.title).toBe("Software Engineer - Resume");

    act(() => { window.dispatchEvent(new Event("afterprint")); });
    expect(document.title).toBe(savedTitle);
  });

  it("3. clicking Print button calls window.print (disabled when empty, enabled otherwise)", async () => {
    const user = userEvent.setup();
    const printSpy = vi.fn();
    window.print = printSpy;

    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: { id: "res-empty", title: "Empty Resume", content: emptyContent, createdAt: "", updatedAt: "" },
    });
    const { unmount } = renderEditor("res-empty");
    await waitFor(() => expect(screen.getByRole("button", { name: /^print or save as pdf$/i })).toBeInTheDocument());
    const emptyBtn = screen.getByRole("button", { name: /^print or save as pdf$/i });
    expect(emptyBtn).toBeDisabled();
    expect(emptyBtn).toHaveAttribute("title", "Add some content first");
    unmount();

    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: { id: "res-pop", title: "Populated Resume", content: populatedContent, createdAt: "", updatedAt: "" },
    });
    renderEditor("res-pop");
    await waitFor(() => expect(screen.getByRole("button", { name: /^print or save as pdf$/i })).toBeInTheDocument());
    const enabledBtn = screen.getByRole("button", { name: /^print or save as pdf$/i });
    expect(enabledBtn).not.toBeDisabled();

    await user.click(enabledBtn);
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it("4. isContentEmpty returns true for fully empty content and false when any text exists", () => {
    expect(isContentEmpty(emptyContent)).toBe(true);
    expect(isContentEmpty({ ...emptyContent, basics: { ...emptyContent.basics, fullName: "   " } })).toBe(true);
    expect(isContentEmpty({ ...emptyContent, basics: { ...emptyContent.basics, fullName: "Maya" } })).toBe(false);
    expect(isContentEmpty({ ...emptyContent, basics: { ...emptyContent.basics, email: "m@e.com" } })).toBe(false);
    expect(isContentEmpty({ ...emptyContent, summary: "Developer" })).toBe(false);
    expect(isContentEmpty({ ...emptyContent, education: [{ id: "1", institution: "IIT", degree: "", startDate: "", endDate: "", gradeType: "cgpa", gradeValue: null }] })).toBe(false);
    expect(isContentEmpty({ ...emptyContent, skills: [{ id: "1", category: "Backend", items: [] }] })).toBe(false);
    expect(isContentEmpty({ ...emptyContent, skills: [{ id: "1", category: "", items: ["Go"] }] })).toBe(false);
    expect(isContentEmpty({ ...emptyContent, experience: [{ id: "1", jobTitle: "Dev", company: "", startDate: "", endDate: "", isCurrent: false, bullets: [] }] })).toBe(false);
    expect(isContentEmpty({ ...emptyContent, projects: [{ id: "1", name: "Rocket", techStack: [], link: "", bullets: [] }] })).toBe(false);
    expect(isContentEmpty({ ...emptyContent, certifications: [{ id: "1", name: "GCP", issuer: "" }] })).toBe(false);
  });

  it("5. print stylesheet contains @page with size: A4, break-inside: avoid, and hides app root", () => {
    expect(printCss).toMatch(/@page\s*\{[^}]*size:\s*A4/i);
    expect(printCss).toMatch(/break-inside:\s*avoid/i);
    expect(printCss).toMatch(/#root[^{]*\{[^}]*display:\s*none/i);
  });

  it("6. listeners are removed on unmount", async () => {
    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: { id: "res-unmount", title: "Unmount Test", content: populatedContent, createdAt: "", updatedAt: "" },
    });
    const { unmount } = renderEditor("res-unmount");
    await waitFor(() => expect(screen.getByDisplayValue("Aarav Sharma")).toBeInTheDocument());
    unmount();

    const titleBefore = document.title;
    act(() => { window.dispatchEvent(new Event("beforeprint")); });
    const printRoot = document.getElementById("print-root")!;
    expect(printRoot.innerHTML).toBe("");
    expect(document.title).toBe(titleBefore);
  });
});
