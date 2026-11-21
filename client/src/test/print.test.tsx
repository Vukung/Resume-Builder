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
  summary: "", education: [], experience: [], projects: [], certifications: [], skills: [],
};

const populatedContent: ResumeContent = {
  schemaVersion: 1,
  basics: { fullName: "Aarav Sharma", email: "aarav@example.com", phone: "+91 98765 43210", location: "Delhi", links: [] },
  summary: "Frontend Developer",
  education: [{ id: "edu-1", institution: "IIT Delhi", degree: "B.Tech", startDate: "2019-07", endDate: "2023-05", gradeType: "cgpa", gradeValue: 9.0 }],
  experience: [{ id: "exp-1", jobTitle: "Software Engineer", company: "StartUp", startDate: "2023-06", endDate: "", isCurrent: true, bullets: ["Built UI"] }],
  projects: [{ id: "proj-1", name: "Project Alpha", techStack: ["React"], link: "https://alpha.dev", bullets: ["Built app"] }],
  certifications: [{ id: "cert-1", name: "AWS Developer", issuer: "Amazon" }],
  skills: [{ id: "sk-1", category: "Languages", items: ["TypeScript"] }],
};

function renderEditor(id = "res-1") {
  return render(
    <MemoryRouter initialEntries={[`/resume/${id}`]}>
      <Routes><Route path="/resume/:id" element={<EditorPage />} /></Routes>
    </MemoryRouter>
  );
}

describe("Print and PDF Export (Phase 6)", () => {
  const originalTitle = document.title;
  const originalUA = navigator.userAgent;
  const originalUAData = (navigator as unknown as { userAgentData?: unknown }).userAgentData;

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
    document.getElementById("print-page-rule")?.remove();
  });

  afterEach(() => {
    document.title = originalTitle;
    Object.defineProperty(window.navigator, "userAgent", { value: originalUA, configurable: true });
    Object.defineProperty(window.navigator, "userAgentData", { value: originalUAData, configurable: true });
    const printRoot = document.getElementById("print-root");
    if (printRoot) printRoot.innerHTML = "";
    document.getElementById("print-page-rule")?.remove();
  });

  it("2. Chromium mode: injects @page margin 0, renders table.print-frame, and cleans up", async () => {
    Object.defineProperty(window.navigator, "userAgentData", { value: { brands: [{ brand: "Chromium", version: "120" }] }, configurable: true });
    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: { id: "res-chrom", title: "My Resume", content: populatedContent, createdAt: "", updatedAt: "" },
    });
    renderEditor("res-chrom");
    await waitFor(() => expect(screen.getByDisplayValue("Aarav Sharma")).toBeInTheDocument());

    act(() => { window.dispatchEvent(new Event("beforeprint")); });
    const styleEl = document.getElementById("print-page-rule");
    expect(styleEl).toBeInTheDocument();
    expect(styleEl?.textContent).toContain("margin: 0");

    const printRoot = document.getElementById("print-root")!;
    const table = printRoot.querySelector("table.print-frame");
    expect(table).toBeInTheDocument();
    expect(table!.querySelector("thead")?.textContent?.trim()).toBe("");
    expect(table!.querySelector("tfoot")?.textContent?.trim()).toBe("");
    expect(table!.querySelector("tbody")?.textContent).toContain("Aarav Sharma");

    act(() => { window.dispatchEvent(new Event("afterprint")); });
    expect(document.getElementById("print-page-rule")).toBeNull();
    expect(printRoot.innerHTML).toBe("");
  });

  it("3. Standard mode: injects @page 14mm 16mm, print root contains no table, and cleans up", async () => {
    Object.defineProperty(window.navigator, "userAgentData", { value: undefined, configurable: true });
    Object.defineProperty(window.navigator, "userAgent", { value: "Mozilla/5.0 Firefox/119.0", configurable: true });
    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: { id: "res-std", title: "My Resume", content: populatedContent, createdAt: "", updatedAt: "" },
    });
    renderEditor("res-std");
    await waitFor(() => expect(screen.getByDisplayValue("Aarav Sharma")).toBeInTheDocument());

    act(() => { window.dispatchEvent(new Event("beforeprint")); });
    expect(document.getElementById("print-page-rule")?.textContent).toContain("14mm 16mm");

    const printRoot = document.getElementById("print-root")!;
    expect(printRoot.querySelector("table")).toBeNull();
    expect(printRoot.querySelector(".resume-document")).toBeInTheDocument();

    act(() => { window.dispatchEvent(new Event("afterprint")); });
    expect(document.getElementById("print-page-rule")).toBeNull();
    expect(printRoot.innerHTML).toBe("");
  });

  it("4. printing twice in a row never leaves more than one print-page-rule element", async () => {
    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: { id: "res-twice", title: "Twice Test", content: populatedContent, createdAt: "", updatedAt: "" },
    });
    renderEditor("res-twice");
    await waitFor(() => expect(screen.getByDisplayValue("Aarav Sharma")).toBeInTheDocument());

    act(() => { window.dispatchEvent(new Event("beforeprint")); });
    act(() => { window.dispatchEvent(new Event("beforeprint")); });
    expect(document.querySelectorAll("#print-page-rule").length).toBe(1);

    act(() => { window.dispatchEvent(new Event("afterprint")); });
    expect(document.querySelectorAll("#print-page-rule").length).toBe(0);
  });

  it("5. print stylesheet text has break-inside: avoid and hides root, and has no @page rule", () => {
    expect(printCss).toMatch(/break-inside:\s*avoid/i);
    expect(printCss).toMatch(/#root[^{]*\{[^}]*display:\s*none/i);
    expect(printCss).not.toMatch(/@page/i);
  });

  it("6. on screen preview markup (outside #print-root) contains no table element", async () => {
    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: { id: "res-screen", title: "Screen Preview", content: populatedContent, createdAt: "", updatedAt: "" },
    });
    const { container } = renderEditor("res-screen");
    await waitFor(() => expect(screen.getByDisplayValue("Aarav Sharma")).toBeInTheDocument());
    expect(container.querySelector("#panel-preview")!.querySelector("table")).toBeNull();
  });

  it("handles document.title change on beforeprint and restoration on afterprint", async () => {
    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: { id: "res-title", title: "Fallback Title", content: populatedContent, createdAt: "", updatedAt: "" },
    });
    renderEditor("res-title");
    await waitFor(() => expect(screen.getByDisplayValue("Aarav Sharma")).toBeInTheDocument());

    const savedTitle = document.title;
    act(() => { window.dispatchEvent(new Event("beforeprint")); });
    expect(document.title).toBe("Aarav Sharma - Resume");

    act(() => { window.dispatchEvent(new Event("afterprint")); });
    expect(document.title).toBe(savedTitle);
  });

  it("print button is disabled when empty, enabled otherwise, and calls window.print", async () => {
    const user = userEvent.setup();
    const printSpy = vi.fn();
    window.print = printSpy;

    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: { id: "res-empty", title: "Empty Resume", content: emptyContent, createdAt: "", updatedAt: "" },
    });
    const { unmount } = renderEditor("res-empty");
    await waitFor(() => expect(screen.getByRole("button", { name: /^print or save as pdf$/i })).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /^print or save as pdf$/i })).toBeDisabled();
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

  it("isContentEmpty checks and listeners/rules are removed on unmount", async () => {
    expect(isContentEmpty(emptyContent)).toBe(true);
    expect(isContentEmpty({ ...emptyContent, basics: { ...emptyContent.basics, fullName: "Maya" } })).toBe(false);

    vi.spyOn(api, "getResume").mockResolvedValue({
      resume: { id: "res-unmount", title: "Unmount Test", content: populatedContent, createdAt: "", updatedAt: "" },
    });
    const { unmount } = renderEditor("res-unmount");
    await waitFor(() => expect(screen.getByDisplayValue("Aarav Sharma")).toBeInTheDocument());

    act(() => { window.dispatchEvent(new Event("beforeprint")); });
    expect(document.getElementById("print-page-rule")).toBeInTheDocument();
    unmount();
    expect(document.getElementById("print-page-rule")).toBeNull();
  });
});
